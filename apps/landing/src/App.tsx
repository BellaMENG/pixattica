import {
    useEffect,
    useEffectEvent,
    useRef,
    type FormEvent,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatedCursor, Footer } from "@pixattica/ui";
import { PROMPT, type TranscriptEntry } from "./osData";
import { runBootSequence } from "./osBoot";
import { OsAppContent } from "./osAppContent";
import { INITIAL_OS_STATE, osStore, useOsStore } from "./osStore";
import { getModuleById, runShellCommand } from "./osShell";
import { MOBILE_BREAKPOINT, type AppWindowFrame } from "./osWindowing";

type WindowInteraction = {
    startFrame: AppWindowFrame;
    startPointerX: number;
    startPointerY: number;
    type: "drag" | "resize";
    windowId: string;
};

function App() {
    const activeModuleId = useOsStore((state) => state.activeModuleId);
    const commandInput = useOsStore((state) => state.commandInput);
    const focusedWindowId = useOsStore((state) => state.focusedWindowId);
    const isBooting = useOsStore((state) => state.isBooting);
    const transcript = useOsStore((state) => state.transcript);
    const windows = useOsStore((state) => state.windows);
    const appendTranscriptEntries = useOsStore((state) => state.appendTranscriptEntries);
    const appendTranscriptEntry = useOsStore((state) => state.appendTranscriptEntry);
    const clearCommandInput = useOsStore((state) => state.clearCommandInput);
    const closeWindow = useOsStore((state) => state.closeWindow);
    const focusOrOpenWindow = useOsStore((state) => state.focusOrOpenWindow);
    const focusShell = useOsStore((state) => state.focusShell);
    const recallNextCommand = useOsStore((state) => state.recallNextCommand);
    const recallPreviousCommand = useOsStore((state) => state.recallPreviousCommand);
    const recordCommand = useOsStore((state) => state.recordCommand);
    const resetSession = useOsStore((state) => state.resetSession);
    const setActiveModuleId = useOsStore((state) => state.setActiveModuleId);
    const setCommandInput = useOsStore((state) => state.setCommandInput);
    const setIsBooting = useOsStore((state) => state.setIsBooting);
    const syncWindowFrames = useOsStore((state) => state.syncWindowFrames);
    const updateTranscriptEntry = useOsStore((state) => state.updateTranscriptEntry);
    const updateWindowFrame = useOsStore((state) => state.updateWindowFrame);
    const shellRef = useRef<HTMLElement | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const commandInputRef = useRef<HTMLInputElement | null>(null);
    const rebootTimerRef = useRef<number | null>(null);
    const bootRunIdRef = useRef(0);
    const windowInteractionRef = useRef<WindowInteraction | null>(null);

    const getShellBounds = () => {
        const shellBounds = shellRef.current?.getBoundingClientRect();

        return {
            width: Math.round(shellBounds?.width ?? window.innerWidth),
            height: Math.round(shellBounds?.height ?? window.innerHeight),
        };
    };

    const handleWindowPointerMove = useEffectEvent((event: PointerEvent) => {
        const activeInteraction = windowInteractionRef.current;
        if (!activeInteraction) {
            return;
        }

        event.preventDefault();
        const deltaX = event.clientX - activeInteraction.startPointerX;
        const deltaY = event.clientY - activeInteraction.startPointerY;

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

        updateWindowFrame(activeInteraction.windowId, nextFrame, getShellBounds());
    });

    const endWindowInteraction = useEffectEvent(() => {
        windowInteractionRef.current = null;
        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", endWindowInteraction);
        window.removeEventListener("pointercancel", endWindowInteraction);
    });

    const closeWindowAndEndInteraction = useEffectEvent((windowId: string) => {
        endWindowInteraction();
        closeWindow(windowId);
    });

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

                appendTranscriptEntry(entry);
            },
            onEntryUpdate: (entryId, text) => {
                if (bootRunIdRef.current !== bootRunId) {
                    return;
                }

                updateTranscriptEntry(entryId, text);
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
        osStore.setState(INITIAL_OS_STATE);
    }, []);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ block: "end" });
    }, [transcript]);

    useEffect(() => {
        const syncWindowFramesOnResize = () => {
            syncWindowFrames(getShellBounds());
        };

        syncWindowFramesOnResize();
        window.addEventListener("resize", syncWindowFramesOnResize);

        return () => {
            bootRunIdRef.current += 1;
            endWindowInteraction();
            window.removeEventListener("resize", syncWindowFramesOnResize);

            if (rebootTimerRef.current !== null) {
                window.clearTimeout(rebootTimerRef.current);
            }
        };
    }, [syncWindowFrames]);

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
                closeWindowAndEndInteraction(focusedWindowId);
                requestAnimationFrame(() => {
                    commandInputRef.current?.focus();
                });
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, [focusedWindowId]);

    const handleCommandHistoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            recallPreviousCommand();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            recallNextCommand();
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedInput = commandInput.trim();
        if (!trimmedInput) {
            return;
        }

        recordCommand(trimmedInput);

        const lineIndex = transcript.length + 1;
        const response = runShellCommand(trimmedInput, activeModuleId, lineIndex);

        if (response.clearTranscript) {
            resetSession(response.nextModuleId);
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

            return;
        }

        let nextEntries = response.entries;
        if (response.windowState === "open" && response.openedModuleId) {
            const windowAction = focusOrOpenWindow(response.openedModuleId, getShellBounds());
            if (windowAction === "focused") {
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
        const commandEntry: TranscriptEntry = {
            id: `command-${lineIndex}`,
            kind: "command",
            text: trimmedInput,
        };
        appendTranscriptEntries([commandEntry, ...nextEntries]);
        clearCommandInput();
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

        const activeWindow = osStore
            .getState()
            .windows.find((windowItem) => windowItem.id === windowId);
        if (!activeWindow) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        osStore.getState().bringWindowToFront(windowId);
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
                        focusShell();
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
                                        onPointerDown={() =>
                                            osStore.getState().bringWindowToFront(windowItem.id)
                                        }
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
                                                        closeWindowAndEndInteraction(windowItem.id);
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
                                                onLaunchApp={(appId) => {
                                                    focusOrOpenWindow(appId, getShellBounds());
                                                }}
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
