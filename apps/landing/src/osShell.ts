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
    closePage?: boolean;
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

const OPEN_APP_FLAGS = new Set(["-a", "--app"]);
const APP_COMMAND_LIST = APP_MODULES.map((module) => module.command).join(", ");

function getOpenUsageText() {
    return `use \`open <app>\` or \`open -a <app>\`. apps: ${APP_COMMAND_LIST}.`;
}

function resolveOpenTarget(args: string[]) {
    if (args.length === 0) {
        return { error: `missing app name. ${getOpenUsageText()}` };
    }

    const [firstArg, secondArg] = args;

    if (OPEN_APP_FLAGS.has(firstArg)) {
        if (!secondArg) {
            return { error: `missing app name. ${getOpenUsageText()}` };
        }

        return { module: getModuleByCommand(secondArg) };
    }

    if (firstArg.startsWith("-")) {
        return {
            error: `unknown open flag: ${firstArg}. use \`open <app>\` or \`open -a <app>\`.`,
        };
    }

    return { module: getModuleByCommand(firstArg) };
}

const WHOAMI_TEXT = [
    "Bella Meng, software engineer, (product engineer?), based in London. I like making random things outside software too.",
    "More about my work lives on LinkedIn: https://www.linkedin.com/in/bella-meng/. You can also reach me at bellamengzihan@gmail.com.",
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
        command: "exit",
        description: "close the current page",
        run: ({ activeModuleId, lineIndex }) => ({
            closePage: true,
            entries: [
                createOutputEntry(
                    lineIndex,
                    "attempting to close the page. if this tab stays open, your browser blocked it.",
                ),
            ],
            nextModuleId: activeModuleId,
        }),
    },
    {
        command: "open",
        usage: "open [-a] <app>",
        description: "launch an app",
        run: ({ activeModuleId, args, lineIndex }) => {
            const { error, module } = resolveOpenTarget(args);

            if (!module) {
                return {
                    entries: [
                        createOutputEntry(
                            lineIndex,
                            error ?? `unknown app target. ${getOpenUsageText()}`,
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

const ALL_COMMANDS = [...CORE_COMMANDS];

const COMMAND_LOOKUP = new Map<string, ShellCommandDefinition>(
    ALL_COMMANDS.flatMap((definition) => [
        [definition.command, definition] as const,
        ...(definition.aliases ?? []).map((alias) => [alias, definition] as const),
    ]),
);

export const HELP_TEXT = [
    "commands",
    "help, ?          command index",
    "whoami           intro card",
    "open [-a] <app>  launch an app",
    "exit             close the page",
    "clear, cls       clear the shell",
    "reboot, restart  reboot the shell",
    `apps             ${APP_COMMAND_LIST}`,
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
            completion: alias,
            description: definition.description,
            label: alias,
        })),
    ]);
}

function getOpenTargetSuggestions(prefix: string, query: string) {
    return APP_MODULES.filter((module) => !query || module.command.startsWith(query)).map(
        (module) => ({
            completion: `${prefix} ${module.command}`,
            description: `open ${module.label}`,
            label: `${prefix} ${module.command}`,
        }),
    );
}

function getOpenFlagSuggestions(query: string) {
    return ["-a", "--app"]
        .filter((flag) => flag.startsWith(query))
        .map((flag) => ({
            completion: `open ${flag} `,
            description: "launch an app with an explicit app flag",
            label: `open ${flag}`,
        }));
}

function getOpenSuggestions(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query) {
        return getOpenTargetSuggestions("open", "");
    }

    const [firstToken, ...rest] = query.split(/\s+/);

    if (firstToken.startsWith("-")) {
        if (OPEN_APP_FLAGS.has(firstToken)) {
            return getOpenTargetSuggestions(`open ${firstToken}`, rest.join(" "));
        }

        return getOpenFlagSuggestions(firstToken);
    }

    return getOpenTargetSuggestions("open", query);
}

export function getShellAutocompleteSuggestions(input: string): ShellAutocompleteSuggestion[] {
    const normalizedInput = input.trimStart().toLowerCase();
    if (!normalizedInput) {
        return [];
    }

    const openMatch = normalizedInput.match(/^open\s+(.*)$/);
    if (openMatch) {
        return getOpenSuggestions(openMatch[1] ?? "").slice(0, 6);
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
