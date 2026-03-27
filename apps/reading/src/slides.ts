export type SlideTemplate = "closing" | "standard" | "title";

export type SlideBlock = {
    items: string[];
};

export type Slide = {
    align?: "center" | "start";
    blocks?: SlideBlock[];
    eyebrow: string;
    id: string;
    subtitle?: string;
    template: SlideTemplate;
    title: string;
};

export const SLIDES: Slide[] = [
    {
        eyebrow: "reading",
        id: "opening-why",
        subtitle: "(from my perspective)",
        template: "title",
        title: "All about reading",
    },
    {
        eyebrow: "why",
        id: "why",
        template: "title",
        title: "why?",
        subtitle: "because you want to",
    },
    {
        eyebrow: "stats",
        id: "stats",
        template: "standard",
        title: "Stats",
        blocks: [
            {
                items: [
                    "screen time went from 6 hrs/day to less than 1 hour/day",
                    "read 62 books in 2025",
                ],
            },
        ],
    },
    {
        eyebrow: "what-didnt-work",
        id: "what-didnt-work",
        template: "standard",
        title: "What Didn't Work :(",
        blocks: [
            {
                items: [
                    'putting a time limit on apps like instagram (i get so used to click "15 minutes more")',
                    "deleting instagram (i'll just install it again)",
                    "switching to dumb phones (v unrealistic) -> it's not the phone, it's yourself that you need to control",
                ],
            },
        ],
    },
    {
        eyebrow: "what-worked",
        id: "how",
        align: "center",
        template: "standard",
        title: "What Worked for Me!",
        blocks: [
            {
                items: [
                    "start reading genres you like",
                    "when i want to pick up my phone, I pick up a book instead",
                    "gamify book reading (goodreads reading challenge)",
                    "instagram being the biggest offender -> use chrome",
                    "read in different formats, kindle, physical book",
                    "make sure to always have a book on hand (one of the reasons why you always pick up your phone is because your phone is always next to you)",
                    "when there is no book, but you have free time, just enjoy the free time",
                    "have compassion for yourself -> stop being overly self critical",
                    'sometimes you need to "just do it!"',
                    `kept telling myself that "i hate my phone" and i actually don't like it that much anymore.`,
                ],
            },
        ],
    },
    {
        eyebrow: "more",
        id: "more",
        template: "standard",
        title: "More on this...",
        blocks: [
            {
                items: ["Four Thousand Weeks by Oliver Burkeman"],
            },
        ],
    },
    {
        eyebrow: "Closing",
        id: "you-should-try-it-too",
        template: "closing",
        title: "You Should Try It Too!",
    },
];
