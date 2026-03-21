import {
    APP_MODULES,
    BOOT_SEQUENCE,
    type AppId,
    type AppModule,
    type TranscriptEntry,
} from "./osData";

type ShellCommandContext = {
    activeModuleId: AppId;
    args: string[];
    lineIndex: number;
};

type ShellCommandResult = {
    clearTranscript?: boolean;
    entries: TranscriptEntry[];
    nextModuleId: AppId;
    openedModuleId?: AppId;
    rebootShell?: boolean;
    windowState?: "open" | "close";
};

type ShellCommandDefinition = {
    aliases?: string[];
    command: string;
    description: string;
    usage?: string;
    run: (context: ShellCommandContext) => ShellCommandResult;
};

export type ShellAutocompleteSuggestion = {
    completion: string;
    description: string;
    label: string;
};

function createOutputEntry(index: number, text: string): TranscriptEntry {
    return { id: `line-${index}`, kind: "output", text };
}

export function getModuleById(moduleId: AppId) {
    return APP_MODULES.find((module) => module.id === moduleId);
}

function getModuleByCommand(command: string) {
    return APP_MODULES.find((module) => module.command === command);
}

function createLaunchEntries(module: AppModule, lineIndex: number, verb: string) {
    return [createOutputEntry(lineIndex, `${verb}: ${module.label}`)];
}

const WHOAMI_TEXT = [
    "bellameng, I like making random things (not just softwares), I’m always active (either running or BJJing or boxing or gyming or hiking or cycling or …)",
    "Just in case though, here is my LinkedIn if you are interested in my experiences: https://www.linkedin.com/in/bella-meng/, or you can email me at bellamengzihan@gmail.com. I’m based in London. Let’s be friends!",
].join("\n\n");

const CORE_COMMANDS: ShellCommandDefinition[] = [
    {
        command: "help",
        aliases: ["?"],
        description: "show the current command index",
        run: ({ activeModuleId, lineIndex }) => ({
            entries: [createOutputEntry(lineIndex, HELP_TEXT)],
            nextModuleId: activeModuleId,
        }),
    },
    {
        command: "whoami",
        description: "show Bella's intro card",
        run: ({ activeModuleId, lineIndex }) => ({
            entries: [createOutputEntry(lineIndex, WHOAMI_TEXT)],
            nextModuleId: activeModuleId,
        }),
    },
    {
        command: "open",
        aliases: ["launch"],
        usage: "open <app>",
        description: "open one of the available app modules",
        run: ({ activeModuleId, args, lineIndex }) => {
            const target = args[0]?.toLowerCase();
            const module = target ? getModuleByCommand(target) : undefined;

            if (!module) {
                return {
                    entries: [
                        createOutputEntry(
                            lineIndex,
                            "unknown app target. try `open books`, `open cats`, `open collage`, or `open bbs`.",
                        ),
                    ],
                    nextModuleId: activeModuleId,
                };
            }

            return {
                entries: createLaunchEntries(module, lineIndex, "launched"),
                nextModuleId: module.id,
                openedModuleId: module.id,
                windowState: "open",
            };
        },
    },
    {
        command: "clear",
        aliases: ["cls"],
        description: "clear the current transcript",
        run: ({ activeModuleId }) => ({
            clearTranscript: true,
            entries: [],
            nextModuleId: activeModuleId,
            windowState: "close",
        }),
    },
    {
        command: "reboot",
        aliases: ["restart"],
        description: "rerun the shell boot sequence",
        run: () => ({
            clearTranscript: true,
            entries: [],
            rebootShell: true,
            nextModuleId: "about",
            windowState: "close",
        }),
    },
];

const MODULE_COMMANDS: ShellCommandDefinition[] = APP_MODULES.map((module) => ({
    command: module.command,
    description: `open ${module.label}`,
    run: ({ lineIndex }) => ({
        entries: createLaunchEntries(module, lineIndex, "launched"),
        nextModuleId: module.id,
        openedModuleId: module.id,
        windowState: "open",
    }),
}));

const ALL_COMMANDS = [...CORE_COMMANDS, ...MODULE_COMMANDS];

const COMMAND_LOOKUP = new Map<string, ShellCommandDefinition>(
    ALL_COMMANDS.flatMap((definition) => [
        [definition.command, definition] as const,
        ...(definition.aliases ?? []).map((alias) => [alias, definition] as const),
    ]),
);

export const HELP_TEXT = [
    "available commands",
    "help, ?              show the current command index",
    "whoami               show Bella's intro card",
    "open <app>, launch   open one of the available app modules",
    "about                open about.app",
    "books                open books.app",
    "cats                 open cats.app",
    "collage              open collage.app",
    "bbs                  open dialtone.app",
    "clear, cls           clear the current transcript",
    "reboot, restart      rerun the shell boot sequence",
].join("\n");

export const INITIAL_TRANSCRIPT: TranscriptEntry[] = [...BOOT_SEQUENCE];

function getCommandSuggestions(): ShellAutocompleteSuggestion[] {
    return ALL_COMMANDS.flatMap((definition) => [
        {
            completion: definition.command === "open" ? "open " : definition.command,
            description: definition.description,
            label: definition.usage ?? definition.command,
        },
        ...(definition.aliases ?? []).map((alias) => ({
            completion: alias === "launch" ? "launch " : alias,
            description: definition.description,
            label: alias,
        })),
    ]);
}

function getOpenTargetSuggestions(launcher: "launch" | "open", query: string) {
    return APP_MODULES.filter((module) => !query || module.command.startsWith(query)).map(
        (module) => ({
            completion: `${launcher} ${module.command}`,
            description: `open ${module.label}`,
            label: `${launcher} ${module.command}`,
        }),
    );
}

export function getShellAutocompleteSuggestions(input: string): ShellAutocompleteSuggestion[] {
    const normalizedInput = input.trimStart().toLowerCase();
    if (!normalizedInput) {
        return [];
    }

    const openMatch = normalizedInput.match(/^(open|launch)\s+(.*)$/);
    if (openMatch) {
        const launcher = openMatch[1] as "launch" | "open";
        const query = openMatch[2]?.trim() ?? "";
        return getOpenTargetSuggestions(launcher, query).slice(0, 6);
    }

    return getCommandSuggestions()
        .filter((suggestion) => suggestion.completion.startsWith(normalizedInput))
        .filter((suggestion) => suggestion.completion.trimEnd() !== normalizedInput)
        .slice(0, 6);
}

export function runShellCommand(
    input: string,
    activeModuleId: AppId,
    lineIndex: number,
): ShellCommandResult {
    const trimmedInput = input.trim().toLowerCase();

    if (!trimmedInput) {
        return { entries: [], nextModuleId: activeModuleId };
    }

    const [commandName, ...args] = trimmedInput.split(/\s+/);
    const command = COMMAND_LOOKUP.get(commandName);

    if (!command) {
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

    return command.run({ activeModuleId, args, lineIndex });
}
