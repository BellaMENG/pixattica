import { BBS_COPY, BBS_MOCK_POSTS } from "./bbsContent";

export default function BbsApp() {
    return (
        <section className="flex h-full min-h-0 flex-col gap-4">
            <div className="rounded-xl border-2 border-pink-300 bg-pink-100/80 p-5 shadow-[4px_4px_0px_#f9a8d4]">
                <p className="os-accent-font text-[10px] uppercase tracking-[0.08em] text-pink-500">
                    {BBS_COPY.sublabel}
                </p>
                <h2 className="mt-3 os-accent-font text-sm sm:text-base">{BBS_COPY.heading}</h2>
                <p className="mt-3 text-[11px] leading-relaxed text-pink-700 sm:text-xs">
                    {BBS_COPY.body}
                </p>
            </div>

            <div className="rounded-xl border-2 border-pink-300 bg-pink-50 px-4 py-3 shadow-[4px_4px_0px_#f9a8d4]">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-pink-600 sm:text-[11px]">
                    {BBS_COPY.statusPills.map((status) => (
                        <span
                            key={status}
                            className="rounded border border-pink-300 bg-pink-100 px-2 py-1"
                        >
                            {status}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <section className="rounded-xl border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="os-accent-font text-[10px] uppercase tracking-[0.08em] text-pink-500">
                                {BBS_COPY.composerSectionLabel}
                            </p>
                            <h3 className="mt-3 os-accent-font text-[11px] sm:text-xs">
                                {BBS_COPY.composerHeading}
                            </h3>
                        </div>
                        <span className="rounded border border-pink-300 bg-pink-100 px-2 py-1 text-[10px] text-pink-500">
                            {BBS_COPY.composerBadge}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                        <label className="grid gap-2 text-[10px] text-pink-600 sm:text-[11px]">
                            handle
                            <input
                                disabled
                                type="text"
                                value={BBS_COPY.composerStarterHandle}
                                className="rounded border-2 border-pink-300 bg-pink-100 px-3 py-2 text-pink-500"
                                aria-label="Dialtone handle"
                            />
                        </label>

                        <label className="grid gap-2 text-[10px] text-pink-600 sm:text-[11px]">
                            message
                            <textarea
                                disabled
                                rows={5}
                                value={BBS_COPY.composerMessage}
                                className="rounded border-2 border-pink-300 bg-pink-100 px-3 py-2 text-pink-500"
                                aria-label="Dialtone message"
                            />
                        </label>

                        <button
                            type="button"
                            disabled
                            className="os-button-font rounded border-2 border-pink-300 bg-pink-100 px-3 py-2 text-[10px] text-pink-500"
                        >
                            {BBS_COPY.composerButton}
                        </button>
                    </div>
                </section>

                <section className="flex min-h-0 flex-col rounded-xl border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="os-accent-font text-[10px] uppercase tracking-[0.08em] text-pink-500">
                                {BBS_COPY.feedSectionLabel}
                            </p>
                            <h3 className="mt-3 os-accent-font text-[11px] sm:text-xs">
                                {BBS_COPY.feedHeading}
                            </h3>
                        </div>
                        <span className="rounded border border-pink-300 bg-pink-100 px-2 py-1 text-[10px] text-pink-500">
                            {BBS_COPY.feedBadge}
                        </span>
                    </div>

                    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-1">
                        {BBS_MOCK_POSTS.map((post) => (
                            <article
                                key={`${post.handle}-${post.postedAt}`}
                                className="rounded-lg border-2 border-pink-300 bg-pink-100/80 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-pink-500 sm:text-[11px]">
                                    <p className="os-accent-font">{post.handle}</p>
                                    <p>{post.postedAt}</p>
                                </div>
                                <p className="mt-3 text-[11px] leading-relaxed text-pink-700 sm:text-xs">
                                    {post.text}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
}
