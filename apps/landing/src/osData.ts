export type AppId = "about" | "books" | "cats" | "collage" | "bbs";
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
    preloadAppIds?: AppId[];
    renderMode?: "instant" | "typed";
    text: string;
};

export const PROMPT = "bella@pixattica:~$";
export const SHELL_LABEL = "PIXATTICA OS // home shell";
const PIXATTICA_OS_BANNER = [
    " .--------------------------------------------------.",
    " |  o  o  o                         PIXATTICA OS    |",
    " |--------------------------------------------------|",
    " |  loading Bella Meng portfolio...                 |",
    " |  mounting project archive...                     |",
    " |  indexing cats of the world...                   |",
    " |  linking pixel collage project...                |",
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
        preloadAppIds: ["about", "books", "cats", "collage"],
        renderMode: "instant",
        text: PIXATTICA_OS_BANNER,
    },
    { id: "boot-3", renderMode: "instant", text: "shell ready. type `help`." },
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
        title: "Bella Meng",
    },
    {
        id: "books",
        command: "books",
        label: "books.app",
        title: "Reading Shelf",
    },
    {
        id: "cats",
        command: "cats",
        label: "cats.app",
        title: "Cats of the World",
    },
    {
        id: "collage",
        command: "collage",
        label: "collage.app",
        title: "Pixel Collage Project",
    },
    {
        id: "bbs",
        command: "bbs",
        label: "dialtone.app",
        title: "Dialtone BBS",
    },
];
