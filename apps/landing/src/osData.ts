export type AppId = "about" | "books" | "cats" | "collage";
export type TranscriptEntry =
    | { id: string; kind: "system"; text: string }
    | { id: string; kind: "command"; text: string }
    | { id: string; kind: "output"; text: string };

export type AppModule = {
    id: AppId;
    command: string;
    label: string;
    title: string;
};

export type BootStep = {
    id: string;
    preloadAppId?: AppId;
    renderMode?: "instant" | "typed";
    text: string;
};

export const PROMPT = "bella@pixattica:~$";
export const SHELL_LABEL = "PIXATTICA OS // home shell";
const PIXATTICA_OS_BANNER = [
    " .--------------------------------------------------.",
    " |  o  o  o                         PIXATTICA OS    |",
    " |--------------------------------------------------|",
    " |  booting...                                      |",
    " |  mounting books archive...                       |",
    " |  indexing cats of the world...                   |",
    " |  linking collage maker...                        |",
    " |                                                  |",
    " |   [ PIXATTICA ]                                  |",
    " |   [    O S    ]                                  |",
    " |                                                  |",
    " |  shell ready. type `help`.                       |",
    " '--------------------------------------------------'",
].join("\n");

export const BOOT_STEPS: BootStep[] = [
    { id: "boot-1", text: "booting PIXATTICA OS v0.1..." },
    {
        id: "boot-2",
        preloadAppId: "books",
        renderMode: "instant",
        text: "mounting books archive...",
    },
    {
        id: "boot-3",
        preloadAppId: "cats",
        renderMode: "instant",
        text: "indexing cats of the world...",
    },
    {
        id: "boot-4",
        preloadAppId: "collage",
        renderMode: "instant",
        text: "linking collage maker...",
    },
    { id: "boot-5", renderMode: "instant", text: PIXATTICA_OS_BANNER },
    { id: "boot-6", renderMode: "instant", text: "shell ready. type `help`." },
];

export const BOOT_SEQUENCE: TranscriptEntry[] = BOOT_STEPS.map((step) => ({
    id: step.id,
    kind: "system",
    text: step.text,
}));

export const APP_MODULES: AppModule[] = [
    {
        id: "about",
        command: "about",
        label: "about.app",
        title: "About Module",
    },
    {
        id: "books",
        command: "books",
        label: "books.app",
        title: "Books Module",
    },
    {
        id: "cats",
        command: "cats",
        label: "cats.app",
        title: "Cats Module",
    },
    {
        id: "collage",
        command: "collage",
        label: "collage.app",
        title: "Collage Maker",
    },
];
