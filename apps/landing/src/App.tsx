import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent } from "react";
import { AnimatedCursor, Footer } from "@pixattica/ui";
import { PROMPT, SHELL_LABEL, type AppId, type TranscriptEntry } from "./osData";
import { getModuleById, INITIAL_TRANSCRIPT, runShellCommand } from "./osShell";

function App() {
    const [activeModuleId, setActiveModuleId] = useState<AppId>("about");
    const [isAppWindowOpen, setIsAppWindowOpen] = useState(false);
    const [commandInput, setCommandInput] = useState("");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>(INITIAL_TRANSCRIPT);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [draftBeforeHistory, setDraftBeforeHistory] = useState("");
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const commandInputRef = useRef<HTMLInputElement | null>(null);

    const activeModule = getModuleById(activeModuleId);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ block: "end" });
    }, [transcript]);

    const terminateActiveApp = useEffectEvent(() => {
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
            return;
        }

        const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
                event.preventDefault();
                terminateActiveApp();
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, [isAppWindowOpen]);

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
                return [];
            }

            if (response.windowState === "open") {
                setIsAppWindowOpen(true);
            } else if (response.windowState === "close") {
                setIsAppWindowOpen(false);
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

    const currentTime = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());

    return (
        <div className="os-app">
            <AnimatedCursor />
            <main className="os-main">
                <section className="os-shell">
                    <div className="os-shell-bar">
                        <div className="os-shell-lights" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="os-shell-label">{SHELL_LABEL}</div>
                        <div className="os-shell-meta">ready</div>
                    </div>

                    <div className="os-shell-grid">
                        <div className="os-panel-header">
                            <span>shell</span>
                            <span>{PROMPT}</span>
                        </div>

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
                                                    <span className="os-line-prompt">{PROMPT}</span>
                                                    <span>{entry.text}</span>
                                                </>
                                            ) : (
                                                <span>{entry.text}</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="os-line os-line--system">
                                        screen cleared. type{" "}
                                        <span className="os-inline-code">help</span> or{" "}
                                        <span className="os-inline-code">reboot</span>.
                                    </div>
                                )}
                                <div ref={transcriptEndRef} />
                            </div>
                        </div>

                        <form className="os-prompt-form" onSubmit={handleSubmit}>
                            <label className="os-prompt-label" htmlFor="pixattica-command-input">
                                {PROMPT}
                            </label>
                            <div className="os-input-frame">
                                <input
                                    ref={commandInputRef}
                                    id="pixattica-command-input"
                                    value={commandInput}
                                    onChange={(event) => setCommandInput(event.target.value)}
                                    className="os-command-input"
                                    spellCheck={false}
                                    autoComplete="off"
                                    placeholder="try `help`, `open cats`, or `collage`"
                                    onKeyDown={handleCommandHistoryKeyDown}
                                />
                                <span className="os-caret" aria-hidden="true" />
                            </div>
                        </form>
                    </div>

                    <div className="os-status-bar">
                        <span>theme // rosepaper</span>
                        <span>
                            focus //{" "}
                            {isAppWindowOpen && activeModule ? activeModule.label : "shell"}
                        </span>
                        <span>time // {currentTime}</span>
                    </div>

                    {isAppWindowOpen && activeModule ? (
                        <div className="os-app-window-layer">
                            <article className="os-app-window">
                                <div className="os-app-window-bar">
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
                                    <span>{activeModule.label}</span>
                                    <span>running</span>
                                </div>
                                <div className="os-app-window-body">
                                    <p className="os-app-chip">{activeModule.label}</p>
                                    <h2 className="os-app-title">{activeModule.title}</h2>
                                    <p className="os-app-window-copy">
                                        This window opened over the shell, like a second desktop
                                        app. The real {activeModule.command} content will replace
                                        this body next.
                                    </p>
                                    <p className="os-app-window-copy">
                                        Press the top-left button or{" "}
                                        <span className="os-inline-code">Cmd/Ctrl+C</span> to
                                        terminate the active app and return to the shell.
                                    </p>
                                </div>
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
