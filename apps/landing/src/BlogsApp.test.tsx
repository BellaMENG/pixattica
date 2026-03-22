import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlogsApp from "./osApps/BlogsApp";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

type Deferred<T> = {
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T | PromiseLike<T>) => void;
};

function createDeferred<T>(): Deferred<T> {
    let resolve!: Deferred<T>["resolve"];
    let reject!: Deferred<T>["reject"];
    const promise = new Promise<T>((nextResolve, nextReject) => {
        resolve = nextResolve;
        reject = nextReject;
    });

    return { promise, reject, resolve };
}

describe("BlogsApp", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();

        if (!root) return;

        await act(async () => {
            root?.unmount();
        });
        root = null;
        container?.remove();
        container = null;
    });

    it("shows a loading state before posts resolve", async () => {
        const deferredResponse = createDeferred<Response>();
        fetchMock.mockReturnValue(deferredResponse.promise);

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root?.render(<BlogsApp />);
        });

        expect(container.textContent).toContain("loading thoughts...");

        deferredResponse.resolve(
            new Response(JSON.stringify({ posts: [] }), {
                headers: {
                    "Content-Type": "application/json",
                },
                status: 200,
            }),
        );

        await act(async () => {
            await deferredResponse.promise;
        });
    });

    it("renders published blog posts from the backend api", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    posts: [
                        {
                            bodyMarkdown: "Hello **backend** world.",
                            createdAt: "2026-03-20T10:00:00.000Z",
                            id: 2,
                            publishedAt: "2026-03-21T10:00:00.000Z",
                            slug: "hello-backend-world",
                            title: "Hello backend world",
                            updatedAt: "2026-03-21T10:00:00.000Z",
                        },
                    ],
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            ),
        );

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root?.render(<BlogsApp />);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(fetchMock).toHaveBeenCalledWith("/api/posts");
        expect(container.textContent).toContain("random thoughts");
        expect(container.textContent).toContain("Hello backend world");
        expect(container.textContent).toContain("Hello backend world.");
        expect(container.querySelector("strong")?.textContent).toBe("backend");
        expect(container.querySelectorAll('[data-testid="blog-post"]')).toHaveLength(1);
    });

    it("renders an empty state when no posts have been published yet", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ posts: [] }), {
                headers: {
                    "Content-Type": "application/json",
                },
                status: 200,
            }),
        );

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root?.render(<BlogsApp />);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("No published posts yet.");
    });

    it("renders the backend error message when the fetch fails", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ error: "Blog service unavailable." }), {
                headers: {
                    "Content-Type": "application/json",
                },
                status: 503,
            }),
        );

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root?.render(<BlogsApp />);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.textContent).toContain("Blog service unavailable.");
    });
});
