import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { listPublishedBlogPosts, type PublicBlogPost } from "../blogApi";

type LoadState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; posts: PublicBlogPost[] };

const sectionClassName = "flex min-h-0 flex-1 flex-col p-5";
const sectionTitleClassName = "os-accent-font text-sm sm:text-base";
const stateCardClassName =
    "mt-5 rounded-lg border-2 border-pink-300 bg-pink-50 p-4 text-[10px] leading-relaxed " +
    "shadow-[4px_4px_0px_#f9a8d4] sm:p-5 sm:text-[11px]";
const postsGridClassName = "mt-5 grid gap-4";
const postCardClassName =
    "rounded-lg border-2 border-pink-300 bg-pink-50 p-4 shadow-[4px_4px_0px_#f9a8d4] sm:p-5";
const postHeaderClassName = "flex flex-wrap items-start justify-between gap-3";
const postTitleClassName = "os-accent-font text-[11px] leading-relaxed sm:text-xs";
const postDateClassName = "text-[10px] uppercase tracking-[0.08em] text-pink-500";
const markdownTextClassName = "text-[10px] leading-relaxed sm:text-[11px]";
const linkClassName = "underline decoration-pink-400 underline-offset-2 hover:text-pink-500";

const markdownComponents: Components = {
    a: ({ children, href }) => (
        <a href={href} target="_blank" rel="noreferrer" className={linkClassName}>
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-pink-300 pl-4 italic text-pink-700">
            {children}
        </blockquote>
    ),
    code: ({ children, className }) =>
        className ? (
            <code className={className}>{children}</code>
        ) : (
            <code className="rounded bg-pink-100 px-1 py-0.5 text-[0.95em] text-pink-700">
                {children}
            </code>
        ),
    h1: ({ children }) => <h4 className="os-accent-font text-[11px] sm:text-xs">{children}</h4>,
    h2: ({ children }) => <h4 className="os-accent-font text-[11px] sm:text-xs">{children}</h4>,
    h3: ({ children }) => <h4 className="os-accent-font text-[11px] sm:text-xs">{children}</h4>,
    li: ({ children }) => <li>{children}</li>,
    ol: ({ children }) => (
        <ol className={`grid list-decimal gap-2 pl-5 ${markdownTextClassName}`}>{children}</ol>
    ),
    p: ({ children }) => <p className={markdownTextClassName}>{children}</p>,
    pre: ({ children }) => (
        <pre className="overflow-x-auto rounded border border-pink-300 bg-pink-100 p-3 text-[10px] leading-relaxed text-pink-700">
            {children}
        </pre>
    ),
    strong: ({ children }) => <strong className="font-semibold text-pink-700">{children}</strong>,
    ul: ({ children }) => (
        <ul className={`grid list-disc gap-2 pl-5 ${markdownTextClassName}`}>{children}</ul>
    ),
};

function formatDateLabel(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
    }).format(new Date(value));
}

export default function BlogsApp() {
    const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;

        async function loadPosts() {
            try {
                const posts = await listPublishedBlogPosts();
                if (cancelled) {
                    return;
                }

                setLoadState({ status: "ready", posts });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setLoadState({
                    status: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to load blog posts right now.",
                });
            }
        }

        void loadPosts();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className={sectionClassName}>
            <h2 className={sectionTitleClassName}>random thoughts</h2>

            {loadState.status === "loading" ? (
                <div className={stateCardClassName}>loading thoughts...</div>
            ) : null}

            {loadState.status === "error" ? (
                <div className={stateCardClassName}>{loadState.message}</div>
            ) : null}

            {loadState.status === "ready" && loadState.posts.length === 0 ? (
                <div className={stateCardClassName}>No published posts yet.</div>
            ) : null}

            {loadState.status === "ready" && loadState.posts.length > 0 ? (
                <div className={postsGridClassName}>
                    {loadState.posts.map((post) => (
                        <article
                            key={post.id}
                            className={postCardClassName}
                            data-testid="blog-post"
                        >
                            <div className={postHeaderClassName}>
                                <h3 className={postTitleClassName}>{post.title}</h3>
                                <time className={postDateClassName} dateTime={post.publishedAt}>
                                    {formatDateLabel(post.publishedAt)}
                                </time>
                            </div>
                            <div className="mt-4 grid gap-3">
                                <ReactMarkdown
                                    components={markdownComponents}
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {post.bodyMarkdown}
                                </ReactMarkdown>
                            </div>
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
