import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { resolveConfig, type BlogApiConfig } from "./config.js";
import { createBlogRepository } from "./database.js";

type BuildAppOptions = {
    config?: Partial<BlogApiConfig>;
    logger?: boolean;
};

type CreatePostBody = {
    bodyMarkdown?: unknown;
    title?: unknown;
};

type LoginBody = {
    password?: unknown;
};

type UpdatePostBody = {
    bodyMarkdown?: unknown;
    title?: unknown;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Something went wrong.";
}

function parseId(value: string) {
    const parsedId = Number.parseInt(value, 10);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
        throw new Error("Invalid post id.");
    }

    return parsedId;
}

function parseStringField(value: unknown, fieldName: string) {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be a string.`);
    }

    return value;
}

export function buildApp(options: BuildAppOptions = {}) {
    const config = resolveConfig(options.config);
    const repository = createBlogRepository({
        databaseUrl: config.databaseUrl,
        seedPlaceholder: config.seedPlaceholder,
    });

    const app = Fastify({
        logger: options.logger ?? true,
    });

    void app.register(cookie, {
        hook: "onRequest",
        secret: config.sessionSecret,
    });

    void app.register(cors, {
        credentials: true,
        origin(origin, callback) {
            if (!origin || config.corsOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origin ${origin} is not allowed.`), false);
        },
    });

    app.addHook("onClose", async () => {
        repository.close();
    });

    function isAuthenticated(request: FastifyRequest) {
        const sessionCookie = request.cookies[config.cookieName];
        if (!sessionCookie) {
            return false;
        }

        const unsignedCookie = request.unsignCookie(sessionCookie);
        return unsignedCookie.valid && unsignedCookie.value === "admin";
    }

    async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
        if (!isAuthenticated(request)) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
    }

    app.get("/api/health", async () => ({ ok: true }));

    app.get("/api/posts", async () => ({
        posts: repository.listPublishedPosts(),
    }));

    app.get("/api/posts/:slug", async (request, reply) => {
        const { slug } = request.params as { slug: string };
        const post = repository.getPublishedPostBySlug(slug);

        if (!post) {
            return reply.code(404).send({ error: "Post not found." });
        }

        return { post };
    });

    app.get("/api/admin/session", async (request) => ({
        authenticated: isAuthenticated(request),
    }));

    app.post("/api/admin/session", async (request, reply) => {
        const { password } = request.body as LoginBody;
        if (typeof password !== "string" || password !== config.adminPassword) {
            return reply.code(401).send({ error: "Invalid password." });
        }

        reply.setCookie(config.cookieName, "admin", {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            signed: true,
        });

        return { authenticated: true };
    });

    app.delete("/api/admin/session", async (_request, reply) => {
        reply.clearCookie(config.cookieName, {
            path: "/",
        });

        return { authenticated: false };
    });

    app.get(
        "/api/admin/posts",
        {
            preHandler: requireAdmin,
        },
        async () => ({
            posts: repository.listAllPosts(),
        }),
    );

    app.post(
        "/api/admin/posts",
        {
            preHandler: requireAdmin,
        },
        async (request, reply) => {
            try {
                const { title, bodyMarkdown } = request.body as CreatePostBody;
                const post = repository.createPost({
                    bodyMarkdown:
                        bodyMarkdown === undefined
                            ? ""
                            : parseStringField(bodyMarkdown, "bodyMarkdown"),
                    title: parseStringField(title, "title"),
                });

                reply.code(201);
                return { post };
            } catch (error) {
                return reply.code(400).send({ error: getErrorMessage(error) });
            }
        },
    );

    app.patch(
        "/api/admin/posts/:id",
        {
            preHandler: requireAdmin,
        },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const { title, bodyMarkdown } = request.body as UpdatePostBody;
                const post = repository.updatePost(parseId(id), {
                    bodyMarkdown:
                        bodyMarkdown === undefined
                            ? undefined
                            : parseStringField(bodyMarkdown, "bodyMarkdown"),
                    title: title === undefined ? undefined : parseStringField(title, "title"),
                });

                if (!post) {
                    return reply.code(404).send({ error: "Post not found." });
                }

                return { post };
            } catch (error) {
                return reply.code(400).send({ error: getErrorMessage(error) });
            }
        },
    );

    app.delete(
        "/api/admin/posts/:id",
        {
            preHandler: requireAdmin,
        },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const deleted = repository.deletePost(parseId(id));

                if (!deleted) {
                    return reply.code(404).send({ error: "Post not found." });
                }

                reply.code(204);
                return reply.send();
            } catch (error) {
                return reply.code(400).send({ error: getErrorMessage(error) });
            }
        },
    );

    app.post(
        "/api/admin/posts/:id/publish",
        {
            preHandler: requireAdmin,
        },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const post = repository.publishPost(parseId(id));

                if (!post) {
                    return reply.code(404).send({ error: "Post not found." });
                }

                return { post };
            } catch (error) {
                return reply.code(400).send({ error: getErrorMessage(error) });
            }
        },
    );

    app.post(
        "/api/admin/posts/:id/unpublish",
        {
            preHandler: requireAdmin,
        },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const post = repository.unpublishPost(parseId(id));

                if (!post) {
                    return reply.code(404).send({ error: "Post not found." });
                }

                return { post };
            } catch (error) {
                return reply.code(400).send({ error: getErrorMessage(error) });
            }
        },
    );

    return app;
}
