import { useState } from "react";
import { AnimatedCursor, Footer } from "@pixattica/ui";
import {
    APP_MODULES,
    BOOT_SEQUENCE,
    HELP_TEXT,
    INITIAL_TRANSCRIPT,
    PROMPT,
    SHELL_LABEL,
    type AppId,
    type TranscriptEntry,
} from "./osData";

function getModuleByCommand(command: string) {
    return APP_MODULES.find((module) => module.command === command);
}

function createOutputEntry(index: number, text: string): TranscriptEntry {
    return { id: `line-${index}`, kind: "output", text };
}

function createCommandResponse(
    input: string,
    activeModuleId: AppId,
    lineIndex: number,
): { entries: TranscriptEntry[]; nextModuleId: AppId } {
    const trimmedInput = input.trim().toLowerCase();

    if (!trimmedInput) {
        return { entries: [], nextModuleId: activeModuleId };
    }

    if (trimmedInput === "help") {
        return {
            entries: [createOutputEntry(lineIndex, HELP_TEXT)],
            nextModuleId: activeModuleId,
        };
    }

    if (trimmedInput === "clear") {
        return {
            entries: [
                createOutputEntry(
                    lineIndex,
                    "screen cleared. boot log preserved in memory until reboot.",
                ),
            ],
            nextModuleId: activeModuleId,
        };
    }

    if (trimmedInput === "reboot") {
        return {
            entries: [
                createOutputEntry(lineIndex, "restarting PIXATTICA OS shell..."),
                ...BOOT_SEQUENCE.map((entry, index) => ({
                    ...entry,
                    id: `reboot-${lineIndex}-${index}`,
                })),
            ],
            nextModuleId: "about",
        };
    }

    const directModule = getModuleByCommand(trimmedInput);
    if (directModule) {
        return {
            entries: [createOutputEntry(lineIndex, `launching ${directModule.label}`)],
            nextModuleId: directModule.id,
        };
    }

    if (trimmedInput.startsWith("open ")) {
        const target = trimmedInput.replace(/^open\s+/, "");
        const module = getModuleByCommand(target);

        if (module) {
            return {
                entries: [createOutputEntry(lineIndex, `launch request accepted: ${module.label}`)],
                nextModuleId: module.id,
            };
        }
    }

    return {
        entries: [
            createOutputEntry(
                lineIndex,
                `command not found: ${trimmedInput}. try \`help\` or \`open books\`.`,
            ),
        ],
        nextModuleId: activeModuleId,
    };
}

function App() {
    const [activeModuleId, setActiveModuleId] = useState<AppId>("books");
    const [commandInput, setCommandInput] = useState("");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>(INITIAL_TRANSCRIPT);

    const activeModule =
        APP_MODULES.find((module) => module.id === activeModuleId) ?? APP_MODULES[0];

    const focusModule = (moduleId: AppId) => {
        const module = APP_MODULES.find((item) => item.id === moduleId);
        if (!module) {
            return;
        }

        setActiveModuleId(moduleId);
        setTranscript((currentTranscript) => [
            ...currentTranscript,
            {
                id: `focus-${currentTranscript.length + 1}`,
                kind: "command",
                text: `open ${module.command}`,
            },
            {
                id: `focus-output-${currentTranscript.length + 2}`,
                kind: "output",
                text: `launch request accepted: ${module.label}`,
            },
        ]);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedInput = commandInput.trim();
        if (!trimmedInput) {
            return;
        }

        if (trimmedInput.toLowerCase() === "clear") {
            setTranscript([]);
            setCommandInput("");
            return;
        }

        setTranscript((currentTranscript) => {
            const lineIndex = currentTranscript.length + 1;
            const response = createCommandResponse(trimmedInput, activeModuleId, lineIndex);

            setActiveModuleId(response.nextModuleId);

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
                        <section className="os-terminal-panel">
                            <div className="os-panel-header">
                                <span>shell</span>
                                <span>{PROMPT}</span>
                            </div>

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
                            </div>

                            <form className="os-prompt-form" onSubmit={handleSubmit}>
                                <label
                                    className="os-prompt-label"
                                    htmlFor="pixattica-command-input"
                                >
                                    {PROMPT}
                                </label>
                                <div className="os-input-frame">
                                    <input
                                        id="pixattica-command-input"
                                        value={commandInput}
                                        onChange={(event) => setCommandInput(event.target.value)}
                                        className="os-command-input"
                                        spellCheck={false}
                                        autoComplete="off"
                                        placeholder="try `help`, `open cats`, or `collage`"
                                    />
                                    <span className="os-caret" aria-hidden="true" />
                                </div>
                            </form>
                        </section>

                        <aside className="os-side-panel">
                            <div className="os-panel-header">
                                <span>launched app</span>
                                <span>{activeModule.label}</span>
                            </div>

                            <article className="os-app-preview">
                                <p className="os-app-chip">{activeModule.label}</p>
                                <h2 className="os-app-title">{activeModule.title}</h2>
                                <a className="os-app-link" href={activeModule.href}>
                                    {activeModule.actionLabel}
                                </a>
                            </article>

                            <div className="os-launch-grid" aria-label="Quick launch modules">
                                {APP_MODULES.map((module) => (
                                    <button
                                        key={module.id}
                                        type="button"
                                        onClick={() => focusModule(module.id)}
                                        className={`os-launch-card ${
                                            module.id === activeModule.id
                                                ? "os-launch-card--active"
                                                : ""
                                        }`}
                                    >
                                        <span className="os-launch-command">{module.command}</span>
                                        <span className="os-launch-label">{module.label}</span>
                                    </button>
                                ))}
                            </div>
                        </aside>
                    </div>

                    <div className="os-status-bar">
                        <span>theme // rosepaper</span>
                        <span>focus // {activeModule.label}</span>
                        <span>time // {currentTime}</span>
                    </div>
                </section>
            </main>
            <Footer instagramUrl={import.meta.env.VITE_INSTAGRAM_URL} />
        </div>
    );
}

export default App;
