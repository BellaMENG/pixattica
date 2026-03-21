import type { AppId } from "../osData";

type AboutAppProps = {
    onLaunchApp: (appId: AppId) => void;
};

export default function AboutApp({ onLaunchApp }: AboutAppProps) {
    const shortcutCards: Array<{ id: AppId; label: string; summary: string }> = [
        {
            id: "books",
            label: "books.app",
            summary: "books I read and loved, with short notes and reviews",
        },
        {
            id: "cats",
            label: "cats.app",
            summary: "travel cat photography archive mapped country by country",
        },
        {
            id: "collage",
            label: "collage.app",
            summary: "a browser-based pixel collage tool I designed and built",
        },
        {
            id: "bbs",
            label: "dialtone.app",
            summary: "a dial-up-style guestbook and shell experiment for public notes",
        },
    ];

    return (
        <section className="flex flex-col gap-6">
            <div className="rounded-xl border-2 border-pink-300 bg-pink-100/80 p-5 shadow-[4px_4px_0px_#f9a8d4]">
                <p className="os-accent-font text-[10px] uppercase tracking-[0.08em] text-pink-500">
                    personal portfolio
                </p>
                <h1 className="mt-3 os-accent-font text-sm sm:text-base">Bella Meng</h1>
                <p className="mt-3 text-[11px] leading-relaxed sm:text-xs">
                    Bella Meng, software engineer, (product engineer?), based in London. I build web
                    products, creative tools, and playful internet projects.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed sm:text-xs">
                    PIXATTICA OS is my personal website and portfolio. Open the apps to explore
                    projects, experiments, books, travel photography, and the internet corners I
                    like making.
                </p>
                <p className="mt-3 text-[11px] leading-relaxed sm:text-xs">
                    <a
                        href="https://www.linkedin.com/in/bella-meng/"
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-pink-400 underline-offset-2 hover:text-pink-500"
                    >
                        LinkedIn
                    </a>
                    {" · "}
                    <a
                        href="mailto:bellamengzihan@gmail.com"
                        className="underline decoration-pink-400 underline-offset-2 hover:text-pink-500"
                    >
                        bellamengzihan@gmail.com
                    </a>
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
