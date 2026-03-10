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

type WindowInteraction = {
    type: "drag" | "resize";
    startPointerX: number;
    startPointerY: number;
    startFrame: AppWindowFrame;
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

function getPreferredWindowFrame(appId: AppId, bounds: WindowBounds): AppWindowFrame {
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

    return clampWindowFrame(DEFAULT_APP_WINDOW_FRAME, bounds);
}

function App() {
    const [activeModuleId, setActiveModuleId] = useState<AppId>("about");
    const [isAppWindowOpen, setIsAppWindowOpen] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    const [commandInput, setCommandInput] = useState("");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [draftBeforeHistory, setDraftBeforeHistory] = useState("");
    const [appWindowFrame, setAppWindowFrame] = useState<AppWindowFrame>(DEFAULT_APP_WINDOW_FRAME);
    const shellRef = useRef<HTMLElement | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const commandInputRef = useRef<HTMLInputElement | null>(null);
    const rebootTimerRef = useRef<number | null>(null);
    const bootRunIdRef = useRef(0);
    const windowInteractionRef = useRef<WindowInteraction | null>(null);

    const activeModule = getModuleById(activeModuleId);

    const getShellBounds = useCallback(() => {
        const shellBounds = shellRef.current?.getBoundingClientRect();

        return {
            width: Math.round(shellBounds?.width ?? window.innerWidth),
            height: Math.round(shellBounds?.height ?? window.innerHeight),
        };
    }, []);

    const handleWindowPointerMove = useCallback(
        (event: PointerEvent) => {
            const activeInteraction = windowInteractionRef.current;
            if (!activeInteraction) {
                return;
            }

            event.preventDefault();
            const deltaX = event.clientX - activeInteraction.startPointerX;
            const deltaY = event.clientY - activeInteraction.startPointerY;

            setAppWindowFrame(() => {
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

                return clampWindowFrame(nextFrame, getShellBounds());
            });
        },
        [getShellBounds],
    );

    const endWindowInteraction = useCallback(() => {
        windowInteractionRef.current = null;
        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", endWindowInteraction);
        window.removeEventListener("pointercancel", endWindowInteraction);
    }, [handleWindowPointerMove]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ block: "end" });
    }, [transcript]);

    useEffect(() => {
        const syncWindowFrame = () => {
            setAppWindowFrame((currentFrame) => clampWindowFrame(currentFrame, getShellBounds()));
        };

        syncWindowFrame();
        window.addEventListener("resize", syncWindowFrame);

        return () => {
            bootRunIdRef.current += 1;
            endWindowInteraction();
            window.removeEventListener("resize", syncWindowFrame);

            if (rebootTimerRef.current !== null) {
                window.clearTimeout(rebootTimerRef.current);
            }
        };
    }, [endWindowInteraction, getShellBounds]);

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

    const terminateActiveApp = useEffectEvent(() => {
        endWindowInteraction();
        setIsAppWindowOpen(false);
        setTranscript((currentTranscript) => [
            ...currentTranscript,
            activeModule
                ? {
                      id: `terminate-${currentTranscript.length + 1}`,
                      kind: "output" as const,
                      text: `^C terminated ${activeModule.label}`,
                  }
                : {
                      id: `terminate-${currentTranscript.length + 1}`,
                      kind: "output" as const,
                      text: "^C terminated active app",
                  },
        ]);
        requestAnimationFrame(() => {
            commandInputRef.current?.focus();
        });
    });

    const closeActiveAppWindow = () => {
        terminateActiveApp();
    };

    useEffect(() => {
        if (!isAppWindowOpen) {
            endWindowInteraction();
            return;
        }

        const shellBounds = getShellBounds();
        setAppWindowFrame((currentFrame) =>
            activeModuleId === "collage"
                ? getPreferredWindowFrame("collage", shellBounds)
                : clampWindowFrame(currentFrame, shellBounds),
        );

        const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
                event.preventDefault();
                terminateActiveApp();
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, [activeModuleId, endWindowInteraction, getShellBounds, isAppWindowOpen]);

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

        setTranscript((currentTranscript) => {
            const lineIndex = currentTranscript.length + 1;
            const response = runShellCommand(trimmedInput, activeModuleId, lineIndex);

            if (response.clearTranscript) {
                setActiveModuleId(response.nextModuleId);
                setIsAppWindowOpen(false);
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

                return [];
            }

            if (response.windowState === "open") {
                setIsAppWindowOpen(true);
            } else if (response.windowState === "close") {
                setIsAppWindowOpen(false);
                endWindowInteraction();
            }

            setActiveModuleId(response.openedModuleId ?? response.nextModuleId);

            return [
                ...currentTranscript,
                { id: `command-${lineIndex}`, kind: "command", text: trimmedInput },
                ...response.entries,
            ];
        });

        setCommandInput("");
    };

    const startWindowInteraction = (
        event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>,
        type: WindowInteraction["type"],
    ) => {
        if (event.button !== 0 || window.innerWidth <= MOBILE_BREAKPOINT) {
            return;
        }

        if (type === "drag" && (event.target as HTMLElement).closest("button")) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        windowInteractionRef.current = {
            type,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startFrame: appWindowFrame,
        };
        window.addEventListener("pointermove", handleWindowPointerMove);
        window.addEventListener("pointerup", endWindowInteraction);
        window.addEventListener("pointercancel", endWindowInteraction);
    };

    const openAppWindow = (appId: AppId) => {
        const shellBounds = getShellBounds();
        setActiveModuleId(appId);
        setIsAppWindowOpen(true);
        setAppWindowFrame(
            appId === "collage"
                ? getPreferredWindowFrame("collage", shellBounds)
                : clampWindowFrame(DEFAULT_APP_WINDOW_FRAME, shellBounds),
        );
    };

    return (
        <div className="os-app">
            <AnimatedCursor />
            <main className="os-main">
                <section
                    ref={shellRef}
                    className="os-shell"
                    onClick={() => {
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

                    {isAppWindowOpen && activeModule ? (
                        <div className="os-app-window-layer">
                            <article
                                className="os-app-window"
                                style={{
                                    transform: `translate(${appWindowFrame.x}px, ${appWindowFrame.y}px)`,
                                    width: `${appWindowFrame.width}px`,
                                    height: `${appWindowFrame.height}px`,
                                }}
                            >
                                <div
                                    className="os-app-window-bar"
                                    onPointerDown={(event) => startWindowInteraction(event, "drag")}
                                >
                                    <div className="os-app-window-lights">
                                        <button
                                            type="button"
                                            className="os-window-light os-window-light--close"
                                            aria-label={`Close ${activeModule.label}`}
                                            onClick={closeActiveAppWindow}
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
                                    <span className="os-accent-font">{activeModule.label}</span>
                                    <span className="os-accent-font">running</span>
                                </div>
                                <div
                                    className={`os-app-window-body ${
                                        activeModule.id === "collage"
                                            ? "os-app-window-body--collage"
                                            : ""
                                    }`}
                                >
                                    <OsAppContent
                                        activeModule={activeModule}
                                        onLaunchApp={openAppWindow}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="os-app-window-resize-handle"
                                    aria-label={`Resize ${activeModule.label}`}
                                    onPointerDown={(event) =>
                                        startWindowInteraction(event, "resize")
                                    }
                                />
                            </article>
                        </div>
                    ) : null}
                </section>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
