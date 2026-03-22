import { rmSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

type TestAppContext = {
    cleanup: () => Promise<void>;
    cookieHeader: string;
    inject: ReturnType<typeof buildApp>["inject"];
};

function getCookieHeader(setCookieHeader: string | string[] | undefined) {
    if (!setCookieHeader) {
        throw new Error("Expected a session cookie.");
    }

    const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    return cookieStrings.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function createTestApp(): Promise<TestAppContext> {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "pixattica-blog-api-"));
    const databasePath = path.join(tempDirectory, "blog.sqlite");
    const app = buildApp({
        config: {
            adminPassword: "test-password",
            corsOrigins: [],
            databaseUrl: databasePath,
            seedPlaceholder: false,
            sessionSecret: "test-session-secret",
        },
        logger: false,
    });

    const loginResponse = await app.inject({
        method: "POST",
        payload: {
            password: "test-password",
        },
        url: "/api/admin/session",
    });

    return {
        cleanup: async () => {
            await app.close();
            rmSync(tempDirectory, { force: true, recursive: true });
        },
        cookieHeader: getCookieHeader(loginResponse.headers["set-cookie"]),
        inject: app.inject.bind(app),
    };
}

describe("blog api", () => {
    const cleanups: Array<() => Promise<void>> = [];

    afterEach(async () => {
        while (cleanups.length > 0) {
            const cleanup = cleanups.pop();
            if (cleanup) {
                await cleanup();
            }
        }
    });

    it("protects admin routes with the session cookie", async () => {
        const tempDirectory = mkdtempSync(path.join(tmpdir(), "pixattica-blog-api-"));
        const app = buildApp({
            config: {
                adminPassword: "test-password",
                corsOrigins: [],
                databaseUrl: path.join(tempDirectory, "blog.sqlite"),
                seedPlaceholder: false,
                sessionSecret: "test-session-secret",
            },
            logger: false,
        });

        cleanups.push(async () => {
            await app.close();
            rmSync(tempDirectory, { force: true, recursive: true });
        });

        const unauthorizedResponse = await app.inject({
            method: "GET",
            url: "/api/admin/posts",
        });

        expect(unauthorizedResponse.statusCode).toBe(401);

        const loginResponse = await app.inject({
            method: "POST",
            payload: {
                password: "test-password",
            },
            url: "/api/admin/session",
        });

        expect(loginResponse.statusCode).toBe(200);

        const authorizedResponse = await app.inject({
            headers: {
                cookie: getCookieHeader(loginResponse.headers["set-cookie"]),
            },
            method: "GET",
            url: "/api/admin/posts",
        });

        expect(authorizedResponse.statusCode).toBe(200);
        expect(authorizedResponse.json()).toEqual({
            posts: [],
        });
    });

    it("supports the draft to published post lifecycle", async () => {
        const context = await createTestApp();
        cleanups.push(context.cleanup);

        const createdResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "POST",
            payload: {
                bodyMarkdown: "Hello **world**",
                title: "A first backend note",
            },
            url: "/api/admin/posts",
        });

        expect(createdResponse.statusCode).toBe(201);
        const createdPost = createdResponse.json().post as {
            id: number;
            slug: string;
            status: string;
        };
        expect(createdPost.slug).toBe("a-first-backend-note");
        expect(createdPost.status).toBe("draft");

        const initialPublicResponse = await context.inject({
            method: "GET",
            url: "/api/posts",
        });
        expect(initialPublicResponse.json()).toEqual({ posts: [] });

        const updatedResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "PATCH",
            payload: {
                bodyMarkdown: "Updated markdown body",
                title: "A better backend note",
            },
            url: `/api/admin/posts/${createdPost.id}`,
        });

        expect(updatedResponse.statusCode).toBe(200);
        expect(updatedResponse.json().post.title).toBe("A better backend note");
        expect(updatedResponse.json().post.slug).toBe("a-first-backend-note");

        const publishResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "POST",
            url: `/api/admin/posts/${createdPost.id}/publish`,
        });

        expect(publishResponse.statusCode).toBe(200);
        expect(publishResponse.json().post.status).toBe("published");

        const publishedPostsResponse = await context.inject({
            method: "GET",
            url: "/api/posts",
        });
        expect(publishedPostsResponse.statusCode).toBe(200);
        expect(publishedPostsResponse.json().posts).toHaveLength(1);
        expect(publishedPostsResponse.json().posts[0]?.title).toBe("A better backend note");

        const publishedPostResponse = await context.inject({
            method: "GET",
            url: `/api/posts/${createdPost.slug}`,
        });
        expect(publishedPostResponse.statusCode).toBe(200);
        expect(publishedPostResponse.json().post.slug).toBe(createdPost.slug);

        const unpublishResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "POST",
            url: `/api/admin/posts/${createdPost.id}/unpublish`,
        });

        expect(unpublishResponse.statusCode).toBe(200);
        expect(unpublishResponse.json().post.status).toBe("draft");

        const publicAfterUnpublishResponse = await context.inject({
            method: "GET",
            url: "/api/posts",
        });
        expect(publicAfterUnpublishResponse.json()).toEqual({ posts: [] });

        const deleteResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "DELETE",
            url: `/api/admin/posts/${createdPost.id}`,
        });
        expect(deleteResponse.statusCode).toBe(204);

        const adminPostsResponse = await context.inject({
            headers: {
                cookie: context.cookieHeader,
            },
            method: "GET",
            url: "/api/admin/posts",
        });
        expect(adminPostsResponse.json()).toEqual({ posts: [] });
    });
});
