import type { AppId } from "../osData";

type AboutAppProps = {
    onLaunchApp: (appId: AppId) => void;
};

export default function AboutApp({ onLaunchApp }: AboutAppProps) {
    const shortcutCards: Array<{ id: AppId; label: string; summary: string }> = [
        {
            id: "books",
            label: "books.app",
            summary: "book covers, reviews, and the 2025 reading shelf",
        },
        {
            id: "cats",
            label: "cats.app",
            summary: "map-based cat archive with country-by-country photos",
        },
        {
            id: "collage",
            label: "collage.app",
            summary: "the collage maker, opened as its own desktop window",
        },
        {
            id: "bbs",
            label: "dialtone.app",
            summary: "a cute little dial-up guestbook shell with handles and public notes",
        },
    ];

    return (
        <section className="flex flex-col gap-6">
            <div className="rounded-xl border-2 border-pink-300 bg-pink-100/80 p-5 shadow-[4px_4px_0px_#f9a8d4]">
                <h2 className="os-accent-font text-sm sm:text-base">about me</h2>
                <p className="mt-3 text-[11px] leading-relaxed sm:text-xs">
                    Hi, I&apos;m Bella. PIXATTICA OS is turning the old site sections into actual
                    little desktop apps, so this window becomes the home directory instead of a
                    separate page.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed sm:text-xs">
                    Use the shell to open apps, or jump from here into books, cats, the collage
                    maker, or the new Dialtone BBS shell.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {shortcutCards.map((card) => (
                    <button
                        key={card.id}
                        type="button"
                        onClick={() => onLaunchApp(card.id)}
                        className="rounded-xl border-2 border-pink-300 bg-pink-50 p-4 text-left shadow-[4px_4px_0px_#f9a8d4] hover:bg-pink-100"
                    >
                        <p className="os-accent-font text-[10px] text-pink-500">{card.label}</p>
                        <p className="mt-3 text-[11px] leading-relaxed text-pink-700 sm:text-xs">
                            {card.summary}
                        </p>
                    </button>
                ))}
            </div>
        </section>
    );
}
