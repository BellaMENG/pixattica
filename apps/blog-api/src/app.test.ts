import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { unstable_dev, type Unstable_DevWorker } from "wrangler";

type TestWorkerOptions = {
    persistTo?: string;
    seedPlaceholder?: boolean;
};

type TestWorkerRequestInit = NonNullable<Parameters<Unstable_DevWorker["fetch"]>[1]> & {
    origin?: string;
};

type TestWorkerContext = {
    cleanup: () => Promise<void>;
    request: (
        pathname: string,
        init?: TestWorkerRequestInit,
    ) => Promise<Awaited<ReturnType<Unstable_DevWorker["fetch"]>>>;
};

const ADMIN_ORIGIN = "https://admin.pixattica.test";
const TEST_CORS_ORIGINS = [
    ADMIN_ORIGIN,
    "http://localhost:4177",
    "http://127.0.0.1:4177",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
].join(",");
const testDir = path.dirname(fileURLToPath(import.meta.url));
const workerEntrypoint = path.join(testDir, "index.ts");
const wranglerConfigPath = path.join(path.dirname(testDir), "wrangler.jsonc");
const cleanupCallbacks: Array<() => Promise<void>> = [];

function registerCleanup(cleanup: () => Promise<void>) {
    cleanupCallbacks.push(cleanup);
}

function normalizeHeaders(headersInit: TestWorkerRequestInit["headers"]): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!headersInit) {
        return headers;
    }

    if (Array.isArray(headersInit)) {
        for (const [key, value] of headersInit) {
            headers[key] = value;
        }

        return headers;
    }

    if (
        typeof headersInit === "object" &&
        headersInit !== null &&
        "entries" in headersInit &&
        typeof headersInit.entries === "function"
    ) {
        for (const [key, value] of headersInit.entries()) {
            headers[key] = value;
        }

        return headers;
    }

    for (const [key, value] of Object.entries(headersInit)) {
        if (typeof value === "string") {
            headers[key] = value;
        }
    }

    return headers;
}

function getCookieHeader(setCookieHeader: string | null) {
    if (!setCookieHeader) {
        throw new Error("Expected a session cookie.");
    }

    return setCookieHeader.split(";")[0];
}

async function createTestWorker(options: TestWorkerOptions = {}): Promise<TestWorkerContext> {
    const persistTo =
        options.persistTo ?? mkdtempSync(path.join(tmpdir(), "pixattica-blog-api-worker-"));
    const worker = await unstable_dev(workerEntrypoint, {
        config: wranglerConfigPath,
        envFiles: [],
        local: true,
        logLevel: "error",
        persistTo,
        vars: {
            ADMIN_PASSWORD: "change-me",
            CORS_ORIGINS: TEST_CORS_ORIGINS,
            SEED_PLACEHOLDER: options.seedPlaceholder === false ? "false" : "true",
            SESSION_SECRET: "test-session-secret",
        },
        experimental: {
            disableExperimentalWarning: true,
            forceLocal: true,
            showInteractiveDevSession: false,
            watch: false,
        },
    });
    let stopped = false;

    const cleanup = async () => {
        if (stopped) {
            return;
        }

        stopped = true;
        await worker.stop();

        if (!options.persistTo) {
            rmSync(persistTo, { force: true, recursive: true });
        }
    };

    registerCleanup(cleanup);

    return {
        cleanup,
        request(pathname, init) {
            const headers = normalizeHeaders(init?.headers);
            if (init?.origin) {
                headers.Origin = init.origin;
            }

            return worker.fetch(`http://127.0.0.1:${worker.port}${pathname}`, {
                ...init,
                headers,
            });
        },
    };
}

async function loginAdmin(context: TestWorkerContext) {
    const response = await context.request("/api/admin/session", {
        body: JSON.stringify({
            password: "change-me",
        }),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        origin: ADMIN_ORIGIN,
    });

    return {
        cookieHeader: getCookieHeader(response.headers.get("set-cookie")),
        response,
    };
}

afterEach(async () => {
    while (cleanupCallbacks.length > 0) {
        const cleanup = cleanupCallbacks.pop();
        if (cleanup) {
            await cleanup();
        }
    }
});

describe("blog api worker", () => {
    it("protects admin routes with the signed session cookie", async () => {
        const context = await createTestWorker({ seedPlaceholder: false });

        const initialSessionResponse = await context.request("/api/admin/session", {
            method: "GET",
            origin: ADMIN_ORIGIN,
        });

        expect(initialSessionResponse.status).toBe(200);
        expect(await initialSessionResponse.json()).toEqual({
            authenticated: false,
        });

        const unauthorizedResponse = await context.request("/api/admin/posts", {
            method: "GET",
            origin: ADMIN_ORIGIN,
        });

        expect(unauthorizedResponse.status).toBe(401);
        expect(await unauthorizedResponse.json()).toEqual({
            error: "Unauthorized",
        });

        const { cookieHeader, response: loginResponse } = await loginAdmin(context);

        expect(loginResponse.status).toBe(200);
        expect(await loginResponse.json()).toEqual({
            authenticated: true,
        });

        const authenticatedSessionResponse = await context.request("/api/admin/session", {
            headers: {
                Cookie: cookieHeader,
            },
            method: "GET",
            origin: ADMIN_ORIGIN,
        });

        expect(authenticatedSessionResponse.status).toBe(200);
        expect(await authenticatedSessionResponse.json()).toEqual({
            authenticated: true,
        });

        const authorizedResponse = await context.request("/api/admin/posts", {
            headers: {
                Cookie: cookieHeader,
            },
            method: "GET",
            origin: ADMIN_ORIGIN,
        });

        expect(authorizedResponse.status).toBe(200);
        expect(await authorizedResponse.json()).toEqual({
            posts: [],
        });

        const logoutResponse = await context.request("/api/admin/session", {
            headers: {
                Cookie: cookieHeader,
            },
            method: "DELETE",
            origin: ADMIN_ORIGIN,
        });

        expect(logoutResponse.status).toBe(200);
        expect(await logoutResponse.json()).toEqual({
            authenticated: false,
        });
    });

    it("supports the draft to published post lifecycle", async () => {
        const context = await createTestWorker({ seedPlaceholder: false });
        const { cookieHeader } = await loginAdmin(context);

        const createdResponse = await context.request("/api/admin/posts", {
            body: JSON.stringify({
                bodyMarkdown: "Hello **world**",
                title: "A first backend note",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "POST",
            origin: ADMIN_ORIGIN,
        });

        expect(createdResponse.status).toBe(201);
        const createdBody = (await createdResponse.json()) as {
            post: {
                id: number;
                slug: string;
                status: string;
            };
        };
        const createdPost = createdBody.post;
        expect(createdPost.slug).toBe("a-first-backend-note");
        expect(createdPost.status).toBe("draft");

        const initialPublicResponse = await context.request("/api/posts");
        expect(await initialPublicResponse.json()).toEqual({ posts: [] });

        const updatedResponse = await context.request(`/api/admin/posts/${createdPost.id}`, {
            body: JSON.stringify({
                bodyMarkdown: "Updated markdown body",
                title: "A better backend note",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "PATCH",
            origin: ADMIN_ORIGIN,
        });

        expect(updatedResponse.status).toBe(200);
        const updatedBody = (await updatedResponse.json()) as {
            post: {
                title: string;
            };
        };
        expect(updatedBody.post.title).toBe("A better backend note");

        const adminPostsAfterUpdateResponse = await context.request("/api/admin/posts", {
            headers: {
                Cookie: cookieHeader,
            },
            method: "GET",
            origin: ADMIN_ORIGIN,
        });
        const adminPostsAfterUpdateBody = (await adminPostsAfterUpdateResponse.json()) as {
            posts: Array<{
                slug: string;
            }>;
        };
        expect(adminPostsAfterUpdateBody.posts[0]?.slug).toBe("a-first-backend-note");

        const publishResponse = await context.request(
            `/api/admin/posts/${createdPost.id}/publish`,
            {
                headers: {
                    Cookie: cookieHeader,
                },
                method: "POST",
                origin: ADMIN_ORIGIN,
            },
        );

        expect(publishResponse.status).toBe(200);
        const publishBody = (await publishResponse.json()) as {
            post: {
                status: string;
            };
        };
        expect(publishBody.post.status).toBe("published");

        const publishedPostsResponse = await context.request("/api/posts");
        expect(publishedPostsResponse.status).toBe(200);
        const publishedPostsBody = (await publishedPostsResponse.json()) as {
            posts: Array<{
                title: string;
            }>;
        };
        expect(publishedPostsBody.posts).toHaveLength(1);
        expect(publishedPostsBody.posts[0]?.title).toBe("A better backend note");

        const publishedPostResponse = await context.request(`/api/posts/${createdPost.slug}`);
        expect(publishedPostResponse.status).toBe(200);
        const publishedPostBody = (await publishedPostResponse.json()) as {
            post: {
                slug: string;
            };
        };
        expect(publishedPostBody.post.slug).toBe(createdPost.slug);

        const unpublishResponse = await context.request(
            `/api/admin/posts/${createdPost.id}/unpublish`,
            {
                headers: {
                    Cookie: cookieHeader,
                },
                method: "POST",
                origin: ADMIN_ORIGIN,
            },
        );

        expect(unpublishResponse.status).toBe(200);
        const unpublishBody = (await unpublishResponse.json()) as {
            post: {
                status: string;
            };
        };
        expect(unpublishBody.post.status).toBe("draft");

        const publicAfterUnpublishResponse = await context.request("/api/posts");
        expect(await publicAfterUnpublishResponse.json()).toEqual({ posts: [] });

        const deleteResponse = await context.request(`/api/admin/posts/${createdPost.id}`, {
            headers: {
                Cookie: cookieHeader,
            },
            method: "DELETE",
            origin: ADMIN_ORIGIN,
        });
        expect(deleteResponse.status).toBe(204);

        const adminPostsResponse = await context.request("/api/admin/posts", {
            headers: {
                Cookie: cookieHeader,
            },
            method: "GET",
            origin: ADMIN_ORIGIN,
        });
        expect(await adminPostsResponse.json()).toEqual({ posts: [] });
    });

    it("rejects malformed post ids instead of matching their numeric prefix", async () => {
        const context = await createTestWorker({ seedPlaceholder: false });
        const { cookieHeader } = await loginAdmin(context);

        const createdResponse = await context.request("/api/admin/posts", {
            body: JSON.stringify({
                bodyMarkdown: "Hello **world**",
                title: "A first backend note",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "POST",
            origin: ADMIN_ORIGIN,
        });

        expect(createdResponse.status).toBe(201);

        const malformedUpdateResponse = await context.request("/api/admin/posts/1abc", {
            body: JSON.stringify({
                title: "This update should fail",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "PATCH",
            origin: ADMIN_ORIGIN,
        });

        expect(malformedUpdateResponse.status).toBe(400);
        expect(await malformedUpdateResponse.json()).toEqual({
            error: "Invalid post id.",
        });
    });

    it("adds numeric suffixes when slugs collide", async () => {
        const context = await createTestWorker({ seedPlaceholder: false });
        const { cookieHeader } = await loginAdmin(context);

        const firstCreateResponse = await context.request("/api/admin/posts", {
            body: JSON.stringify({
                bodyMarkdown: "One",
                title: "Repeated title",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "POST",
            origin: ADMIN_ORIGIN,
        });

        const secondCreateResponse = await context.request("/api/admin/posts", {
            body: JSON.stringify({
                bodyMarkdown: "Two",
                title: "Repeated title",
            }),
            headers: {
                "Content-Type": "application/json",
                Cookie: cookieHeader,
            },
            method: "POST",
            origin: ADMIN_ORIGIN,
        });

        expect(firstCreateResponse.status).toBe(201);
        expect(secondCreateResponse.status).toBe(201);

        const firstPost = (await firstCreateResponse.json()) as {
            post: {
                slug: string;
            };
        };
        const secondPost = (await secondCreateResponse.json()) as {
            post: {
                slug: string;
            };
        };

        expect(firstPost.post.slug).toBe("repeated-title");
        expect(secondPost.post.slug).toBe("repeated-title-2");
    });

    it("seeds the placeholder post on a fresh database without duplicating it across restarts", async () => {
        const persistTo = mkdtempSync(path.join(tmpdir(), "pixattica-blog-api-state-"));
        registerCleanup(async () => {
            rmSync(persistTo, { force: true, recursive: true });
        });

        const firstWorker = await createTestWorker({ persistTo });
        const firstPublicPostsResponse = await firstWorker.request("/api/posts");
        expect(firstPublicPostsResponse.status).toBe(200);
        const firstBody = (await firstPublicPostsResponse.json()) as {
            posts: Array<{
                title: string;
            }>;
        };
        expect(firstBody.posts).toHaveLength(1);
        expect(firstBody.posts[0]?.title).toBe("First note in the notebook");

        await firstWorker.cleanup();

        const secondWorker = await createTestWorker({ persistTo });
        const secondPublicPostsResponse = await secondWorker.request("/api/posts");
        expect(secondPublicPostsResponse.status).toBe(200);
        const secondBody = (await secondPublicPostsResponse.json()) as {
            posts: Array<unknown>;
        };
        expect(secondBody.posts).toHaveLength(1);
    });

    it("rejects disallowed cross-origin requests", async () => {
        const context = await createTestWorker({ seedPlaceholder: false });

        const response = await context.request("/api/admin/session", {
            method: "GET",
            origin: "https://evil.example",
        });

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({
            error: "Origin https://evil.example is not allowed.",
        });
    });
});
