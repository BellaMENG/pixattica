export type BbsPost = {
    handle: string;
    postedAt: string;
    text: string;
};

export const BBS_COPY = {
    body:
        "A playful dial-up guestbook for handles, tiny notes, and public internet feelings. " +
        "This window is the first shell: the board is staged, the lights are on, and posting " +
        "comes online next.",
    composerBadge: "soon",
    composerButton: "transmit note",
    composerHeading: "composer warming up",
    composerMessage:
        "dial-up sounds good tonight. leaving a hello for the next person on the line...",
    composerSectionLabel: "leave a note",
    composerStarterHandle: "moonmilk",
    feedBadge: "static preview",
    feedHeading: "recent public notes",
    feedSectionLabel: "board feed",
    heading: "Dialtone BBS",
    statusPills: ["connected to dialtone node", "public board", "handles only"],
    sublabel: "dialtone.bbs",
} as const;

export const BBS_MOCK_POSTS: BbsPost[] = [
    {
        handle: "moonmilk",
        postedAt: "03.17.96  22:14",
        text: "hello from the public board. leaving a note here feels like pinning a postcard to someone's cork wall.",
    },
    {
        handle: "velvetmodem",
        postedAt: "03.18.96  00:02",
        text: "requesting one warm mug of tea, one rainy window, and one tiny place on the internet to say hi.",
    },
    {
        handle: "catfax",
        postedAt: "03.18.96  08:41",
        text: "future feature wish list: handles, moods, replies, and a suspiciously dramatic away message.",
    },
];
