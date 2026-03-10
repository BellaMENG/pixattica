import {
    useCallback,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatedCursor, Footer } from "@pixattica/ui";
import { PROMPT, type AppId, type TranscriptEntry } from "./osData";
import { runBootSequence } from "./osBoot";
import { OsAppContent } from "./osAppContent";
import { getModuleById, runShellCommand } from "./osShell";

type AppWindowFrame = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type WindowBounds = {
    width: number;
    height: number;
};

type OsWindow = {
    frame: AppWindowFrame;
    id: string;
    moduleId: AppId;
};

type WindowInteraction = {
    startFrame: AppWindowFrame;
    startPointerX: number;
    startPointerY: number;
    type: "drag" | "resize";
    windowId: string;
};

const MOBILE_BREAKPOINT = 640;
const WINDOW_EDGE_GAP = 12;
const MIN_APP_WINDOW_WIDTH = 520;
const MIN_APP_WINDOW_HEIGHT = 360;
const DEFAULT_APP_WINDOW_FRAME: AppWindowFrame = {
    x: 72,
    y: 42,
    width: 860,
    height: 620,
};

function clampValue(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function clampWindowFrame(frame: AppWindowFrame, bounds: WindowBounds): AppWindowFrame {
    if (bounds.width <= MOBILE_BREAKPOINT) {
        return {
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height,
        };
    }

    const maxWidth = Math.max(MIN_APP_WINDOW_WIDTH, bounds.width - WINDOW_EDGE_GAP * 2);
    const maxHeight = Math.max(MIN_APP_WINDOW_HEIGHT, bounds.height - WINDOW_EDGE_GAP * 2);
    const width = clampValue(frame.width, MIN_APP_WINDOW_WIDTH, maxWidth);
    const height = clampValue(frame.height, MIN_APP_WINDOW_HEIGHT, maxHeight);
    const x = clampValue(frame.x, WINDOW_EDGE_GAP, bounds.width - width - WINDOW_EDGE_GAP);
    const y = clampValue(frame.y, WINDOW_EDGE_GAP, bounds.height - height - WINDOW_EDGE_GAP);

    return { x, y, width, height };
}

function getPreferredWindowFrame(
    appId: AppId,
    bounds: WindowBounds,
    options?: { index?: number },
): AppWindowFrame {
    if (appId === "collage") {
        return clampWindowFrame(
            {
                x: WINDOW_EDGE_GAP,
                y: WINDOW_EDGE_GAP,
                width: bounds.width - WINDOW_EDGE_GAP * 2,
                height: bounds.height - WINDOW_EDGE_GAP * 2,
            },
            bounds,
        );
    }

    const offsetIndex = options?.index ?? 0;
    const offsetFrame = {
        ...DEFAULT_APP_WINDOW_FRAME,
        x: DEFAULT_APP_WINDOW_FRAME.x + offsetIndex * 28,
        y: DEFAULT_APP_WINDOW_FRAME.y + offsetIndex * 20,
    };

    return clampWindowFrame(offsetFrame, bounds);
}

function App() {
    const [activeModuleId, setActiveModuleId] = useState<AppId>("about");
    const [isBooting, setIsBooting] = useState(true);
    const [commandInput, setCommandInput] = useState("");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [draftBeforeHistory, setDraftBeforeHistory] = useState("");
    const [windows, setWindows] = useState<OsWindow[]>([]);
    const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
    const shellRef = useRef<HTMLElement | null>(null);
    const windowsRef = useRef<OsWindow[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const commandInputRef = useRef<HTMLInputElement | null>(null);
    const rebootTimerRef = useRef<number | null>(null);
    const bootRunIdRef = useRef(0);
    const nextWindowIdRef = useRef(1);
    const windowInteractionRef = useRef<WindowInteraction | null>(null);

    const setWindowsState = useCallback(
        (
            updater: OsWindow[] | ((currentWindows: OsWindow[]) => OsWindow[]),
            options?: { focusedWindowId?: string | null },
        ) => {
            const currentWindows = windowsRef.current;
            const nextWindows = typeof updater === "function" ? updater(currentWindows) : updater;
            windowsRef.current = nextWindows;
            setWindows(nextWindows);

            if (options && "focusedWindowId" in options) {
                setFocusedWindowId(options.focusedWindowId ?? null);
            }
        },
        [],
    );

    const getShellBounds = useCallback(() => {
        const shellBounds = shellRef.current?.getBoundingClientRect();

        return {
            width: Math.round(shellBounds?.width ?? window.innerWidth),
            height: Math.round(shellBounds?.height ?? window.innerHeight),
        };
    }, []);

    const bringWindowToFront = useCallback(
        (windowId: string) => {
            setWindowsState(
                (currentWindows) => {
                    const windowIndex = currentWindows.findIndex(
                        (windowItem) => windowItem.id === windowId,
                    );
                    if (windowIndex === -1 || windowIndex === currentWindows.length - 1) {
                        return currentWindows;
                    }

                    const nextWindows = [...currentWindows];
                    const [windowItem] = nextWindows.splice(windowIndex, 1);
                    nextWindows.push(windowItem);
                    return nextWindows;
                },
                { focusedWindowId: windowId },
            );
        },
        [setWindowsState],
    );

    const handleWindowPointerMove = useCallback(
        (event: PointerEvent) => {
            const activeInteraction = windowInteractionRef.current;
            if (!activeInteraction) {
                return;
            }

            event.preventDefault();
            const deltaX = event.clientX - activeInteraction.startPointerX;
            const deltaY = event.clientY - activeInteraction.startPointerY;

            setWindowsState((currentWindows) =>
                currentWindows.map((windowItem) => {
                    if (windowItem.id !== activeInteraction.windowId) {
                        return windowItem;
                    }

                    const nextFrame =
                        activeInteraction.type === "drag"
                            ? {
                                  ...activeInteraction.startFrame,
                                  x: activeInteraction.startFrame.x + deltaX,
                                  y: activeInteraction.startFrame.y + deltaY,
                              }
                            : {
                                  ...activeInteraction.startFrame,
                                  width: activeInteraction.startFrame.width + deltaX,
                                  height: activeInteraction.startFrame.height + deltaY,
                              };

                    return {
                        ...windowItem,
                        frame: clampWindowFrame(nextFrame, getShellBounds()),
                    };
                }),
            );
        },
        [getShellBounds, setWindowsState],
    );

    const endWindowInteraction = useCallback(() => {
        windowInteractionRef.current = null;
        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", endWindowInteraction);
        window.removeEventListener("pointercancel", endWindowInteraction);
    }, [handleWindowPointerMove]);

    const closeWindow = useCallback(
        (windowId: string) => {
            endWindowInteraction();
            setWindowsState(
                (currentWindows) => {
                    const nextWindows = currentWindows.filter(
                        (windowItem) => windowItem.id !== windowId,
                    );
                    return nextWindows;
                },
                {
                    focusedWindowId:
                        windowsRef.current.length > 1
                            ? (windowsRef.current
                                  .filter((windowItem) => windowItem.id !== windowId)
                                  .slice(-1)[0]?.id ?? null)
                            : null,
                },
            );
        },
        [endWindowInteraction, setWindowsState],
    );

    const focusOrOpenAppWindow = useCallback(
        (appId: AppId) => {
            const existingWindow = windowsRef.current.find(
                (windowItem) => windowItem.moduleId === appId,
            );
            if (existingWindow) {
                bringWindowToFront(existingWindow.id);
                setActiveModuleId(appId);
                return false;
            }

            const shellBounds = getShellBounds();
            const windowId = `window-${nextWindowIdRef.current}`;
            nextWindowIdRef.current += 1;
            const nextWindow: OsWindow = {
                id: windowId,
                moduleId: appId,
                frame: getPreferredWindowFrame(appId, shellBounds, {
                    index: windowsRef.current.length,
                }),
            };

            setWindowsState((currentWindows) => [...currentWindows, nextWindow], {
                focusedWindowId: windowId,
            });
            setActiveModuleId(appId);
            return true;
        },
        [bringWindowToFront, getShellBounds, setWindowsState],
    );

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ block: "end" });
    }, [transcript]);

    useEffect(() => {
        const syncWindowFrames = () => {
            const shellBounds = getShellBounds();
            setWindowsState((currentWindows) =>
                currentWindows.map((windowItem) => ({
                    ...windowItem,
                    frame: clampWindowFrame(windowItem.frame, shellBounds),
                })),
            );
        };

        syncWindowFrames();
        window.addEventListener("resize", syncWindowFrames);

        return () => {
            bootRunIdRef.current += 1;
            endWindowInteraction();
            window.removeEventListener("resize", syncWindowFrames);

            if (rebootTimerRef.current !== null) {
                window.clearTimeout(rebootTimerRef.current);
            }
        };
    }, [endWindowInteraction, getShellBounds, setWindowsState]);

    const startBootSequence = useEffectEvent((lineIndexStart: number) => {
        const bootRunId = bootRunIdRef.current + 1;
        bootRunIdRef.current = bootRunId;
        setIsBooting(true);

        void runBootSequence({
            lineIndexStart,
            onEntryAdd: (entry) => {
                if (bootRunIdRef.current !== bootRunId) {
                    return;
                }

                setTranscript((currentTranscript) => [...currentTranscript, entry]);
            },
            onEntryUpdate: (entryId, text) => {
                if (bootRunIdRef.current !== bootRunId) {
                    return;
                }

                setTranscript((currentTranscript) =>
                    currentTranscript.map((entry) =>
                        entry.id === entryId ? { ...entry, text } : entry,
                    ),
                );
            },
            shouldCancel: () => bootRunIdRef.current !== bootRunId,
        }).finally(() => {
            if (bootRunIdRef.current !== bootRunId) {
                return;
            }

            setIsBooting(false);
            requestAnimationFrame(() => {
                commandInputRef.current?.focus();
            });
        });
    });

    useEffect(() => {
        const initialBootTimerId = window.setTimeout(() => {
            startBootSequence(1);
        }, 0);

        return () => {
            window.clearTimeout(initialBootTimerId);
        };
    }, []);

    useEffect(() => {
        if (!focusedWindowId) {
            endWindowInteraction();
            return;
        }

        const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
                event.preventDefault();
                closeWindow(focusedWindowId);
                requestAnimationFrame(() => {
                    commandInputRef.current?.focus();
                });
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, [closeWindow, endWindowInteraction, focusedWindowId]);

    const handleCommandHistoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (commandHistory.length === 0) {
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (historyIndex === null) {
                setDraftBeforeHistory(commandInput);
                const nextIndex = commandHistory.length - 1;
                setHistoryIndex(nextIndex);
                setCommandInput(commandHistory[nextIndex]);
                return;
            }

            const nextIndex = Math.max(0, historyIndex - 1);
            setHistoryIndex(nextIndex);
            setCommandInput(commandHistory[nextIndex]);
            return;
        }

        if (event.key === "ArrowDown" && historyIndex !== null) {
            event.preventDefault();

            const nextIndex = historyIndex + 1;
            if (nextIndex >= commandHistory.length) {
                setHistoryIndex(null);
                setCommandInput(draftBeforeHistory);
                return;
            }

            setHistoryIndex(nextIndex);
            setCommandInput(commandHistory[nextIndex]);
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedInput = commandInput.trim();
        if (!trimmedInput) {
            return;
        }

        setCommandHistory((currentHistory) => [...currentHistory, trimmedInput]);
        setHistoryIndex(null);
        setDraftBeforeHistory("");

        const lineIndex = transcript.length + 1;
        const response = runShellCommand(trimmedInput, activeModuleId, lineIndex);

        if (response.clearTranscript) {
            setActiveModuleId(response.nextModuleId);
            setWindowsState([], { focusedWindowId: null });
            bootRunIdRef.current += 1;
            setIsBooting(Boolean(response.rebootShell));
            endWindowInteraction();

            if (rebootTimerRef.current !== null) {
                window.clearTimeout(rebootTimerRef.current);
            }

            if (response.rebootShell) {
                rebootTimerRef.current = window.setTimeout(() => {
                    startBootSequence(lineIndex);
                    rebootTimerRef.current = null;
                }, 180);
            }

            setTranscript([]);
            setCommandInput("");
            return;
        }

        let nextEntries = response.entries;
        if (response.windowState === "open" && response.openedModuleId) {
            const didOpenWindow = focusOrOpenAppWindow(response.openedModuleId);
            if (!didOpenWindow) {
                const openedModule = getModuleById(response.openedModuleId);
                if (openedModule) {
                    nextEntries = [
                        {
                            id: `line-${lineIndex}`,
                            kind: "output",
                            text: `focused: ${openedModule.label}`,
                        },
                    ];
                }
            }
        }

        setActiveModuleId(response.openedModuleId ?? response.nextModuleId);
        setTranscript((currentTranscript) => [
            ...currentTranscript,
            { id: `command-${lineIndex}`, kind: "command", text: trimmedInput },
            ...nextEntries,
        ]);

        setCommandInput("");
    };

    const startWindowInteraction = (
        event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>,
        type: WindowInteraction["type"],
        windowId: string,
    ) => {
        if (event.button !== 0 || window.innerWidth <= MOBILE_BREAKPOINT) {
            return;
        }

        if (type === "drag" && (event.target as HTMLElement).closest("button")) {
            return;
        }

        const activeWindow = windowsRef.current.find((windowItem) => windowItem.id === windowId);
        if (!activeWindow) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        bringWindowToFront(windowId);
        windowInteractionRef.current = {
            type,
            windowId,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startFrame: activeWindow.frame,
        };
        window.addEventListener("pointermove", handleWindowPointerMove);
        window.addEventListener("pointerup", endWindowInteraction);
        window.addEventListener("pointercancel", endWindowInteraction);
    };

    return (
        <div className="os-app">
            <AnimatedCursor />
            <main className="os-main">
                <section
                    ref={shellRef}
                    className="os-shell"
                    onClick={() => {
                        setFocusedWindowId(null);
                        commandInputRef.current?.focus();
                    }}
                >
                    <div className="os-shell-grid">
                        <div className="os-terminal-stage">
                            <div className="os-transcript" aria-live="polite">
                                {transcript.length > 0 ? (
                                    transcript.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`os-line os-line--${entry.kind}`}
                                        >
                                            {entry.kind === "command" ? (
                                                <>
                                                    <span className="os-line-prompt os-accent-font">
                                                        {PROMPT}
                                                    </span>
                                                    <span className="os-line-command-text">
                                                        {entry.text}
                                                    </span>
                                                </>
                                            ) : (
                                                <span>{entry.text}</span>
                                            )}
                                        </div>
                                    ))
                                ) : !isBooting ? (
                                    <div className="os-line os-line--system">
                                        screen cleared. type{" "}
                                        <span className="os-inline-code">help</span> or{" "}
                                        <span className="os-inline-code">reboot</span>.
                                    </div>
                                ) : null}
                                {!isBooting ? (
                                    <form className="os-prompt-form" onSubmit={handleSubmit}>
                                        <label
                                            className="os-prompt-label os-accent-font"
                                            htmlFor="pixattica-command-input"
                                        >
                                            {PROMPT}
                                        </label>
                                        <input
                                            ref={commandInputRef}
                                            id="pixattica-command-input"
                                            value={commandInput}
                                            onChange={(event) =>
                                                setCommandInput(event.target.value)
                                            }
                                            className="os-command-input"
                                            spellCheck={false}
                                            autoComplete="off"
                                            placeholder="help"
                                            onKeyDown={handleCommandHistoryKeyDown}
                                        />
                                    </form>
                                ) : null}
                                <div ref={transcriptEndRef} />
                            </div>
                        </div>
                    </div>

                    {windows.length > 0 ? (
                        <div className="os-app-window-layer">
                            {windows.map((windowItem, index) => {
                                const module = getModuleById(windowItem.moduleId);
                                if (!module) {
                                    return null;
                                }

                                return (
                                    <article
                                        key={windowItem.id}
                                        className={`os-app-window ${
                                            focusedWindowId === windowItem.id
                                                ? "os-app-window--focused"
                                                : ""
                                        }`}
                                        style={{
                                            transform: `translate(${windowItem.frame.x}px, ${windowItem.frame.y}px)`,
                                            width: `${windowItem.frame.width}px`,
                                            height: `${windowItem.frame.height}px`,
                                            zIndex: index + 1,
                                        }}
                                        onPointerDown={() => bringWindowToFront(windowItem.id)}
                                    >
                                        <div
                                            className="os-app-window-bar"
                                            onPointerDown={(event) =>
                                                startWindowInteraction(event, "drag", windowItem.id)
                                            }
                                        >
                                            <div className="os-app-window-lights">
                                                <button
                                                    type="button"
                                                    className="os-window-light os-window-light--close"
                                                    aria-label={`Close ${module.label}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        closeWindow(windowItem.id);
                                                    }}
                                                />
                                                <span
                                                    className="os-window-light os-window-light--minimize"
                                                    aria-hidden="true"
                                                />
                                                <span
                                                    className="os-window-light os-window-light--expand"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <span className="os-accent-font">{module.label}</span>
                                            <span className="os-accent-font">running</span>
                                        </div>
                                        <div
                                            className={`os-app-window-body ${
                                                module.id === "collage"
                                                    ? "os-app-window-body--collage"
                                                    : ""
                                            }`}
                                        >
                                            <OsAppContent
                                                activeModule={module}
                                                onLaunchApp={focusOrOpenAppWindow}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="os-app-window-resize-handle"
                                            aria-label={`Resize ${module.label}`}
                                            onPointerDown={(event) =>
                                                startWindowInteraction(
                                                    event,
                                                    "resize",
                                                    windowItem.id,
                                                )
                                            }
                                        />
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
