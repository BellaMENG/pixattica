const ABOUT_ME_URL = import.meta.env.VITE_ABOUT_ME_URL ?? "/about-me/";
const PIXEL_COLLAGE_URL = import.meta.env.VITE_PIXEL_COLLAGE_URL ?? "/pixel-collage/";

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
    href: string;
    actionLabel: string;
};

export const PROMPT = "bella@pixattica:~$";
export const SHELL_LABEL = "PIXATTICA OS // home shell";
export const HELP_TEXT =
    "available commands: help, about, books, cats, collage, open <app>, clear, reboot";

export const BOOT_SEQUENCE: TranscriptEntry[] = [
    { id: "boot-1", kind: "system", text: "booting PIXATTICA OS v0.1..." },
    { id: "boot-2", kind: "system", text: "mounting books archive..." },
    { id: "boot-3", kind: "system", text: "indexing cats of the world..." },
    { id: "boot-4", kind: "system", text: "linking collage maker..." },
    { id: "boot-5", kind: "system", text: "shell ready. type `help`." },
];

export const APP_MODULES: AppModule[] = [
    {
        id: "about",
        command: "about",
        label: "about.app",
        title: "About Module",
        href: ABOUT_ME_URL,
        actionLabel: "Open About Me",
    },
    {
        id: "books",
        command: "books",
        label: "books.app",
        title: "Books Module",
        href: ABOUT_ME_URL,
        actionLabel: "Open Books",
    },
    {
        id: "cats",
        command: "cats",
        label: "cats.app",
        title: "Cats Module",
        href: ABOUT_ME_URL,
        actionLabel: "Open Cats of the World",
    },
    {
        id: "collage",
        command: "collage",
        label: "collage.app",
        title: "Collage Maker",
        href: PIXEL_COLLAGE_URL,
        actionLabel: "Open Collage Maker",
    },
];

export const INITIAL_TRANSCRIPT: TranscriptEntry[] = [
    ...BOOT_SEQUENCE,
    { id: "demo-1", kind: "command", text: "help" },
    { id: "demo-2", kind: "output", text: HELP_TEXT },
    { id: "demo-3", kind: "command", text: "open cats" },
    {
        id: "demo-4",
        kind: "output",
        text: "launch request accepted: cats.app",
    },
];
