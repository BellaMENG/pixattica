import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { loadConfig, type CloudflareBindings } from "./config.js";
import { createBlogRepository } from "./database.js";

type AppEnvironment = {
    Bindings: CloudflareBindings;
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
    if (!/^[1-9]\d*$/.test(value)) {
        throw new Error("Invalid post id.");
    }

    const parsedId = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsedId)) {
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

async function readJsonBody<T>(context: Context<AppEnvironment>) {
    return (await context.req.json().catch(() => {
        throw new Error("Invalid JSON body.");
    })) as T;
}

function isAllowedOrigin(origin: string | undefined, requestUrl: string, corsOrigins: string[]) {
    if (!origin) {
        return true;
    }

    const requestOrigin = new URL(requestUrl).origin;
    return origin === requestOrigin || corsOrigins.includes(origin);
}

function setCorsHeaders(context: Context<AppEnvironment>, origin: string) {
    context.header("Access-Control-Allow-Credentials", "true");
    context.header("Access-Control-Allow-Headers", "Content-Type");
    context.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    context.header("Access-Control-Allow-Origin", origin);
    context.header("Vary", "Origin");
}

function getSessionCookieOptions(context: Context<AppEnvironment>) {
    const requestUrl = new URL(context.req.url);
    const origin = context.req.header("Origin");
    const isCrossOrigin = Boolean(origin && origin !== requestUrl.origin);
    const isSecureContext =
        requestUrl.protocol === "https:" ||
        requestUrl.hostname === "localhost" ||
        requestUrl.hostname === "127.0.0.1";

    return {
        path: "/",
        sameSite: isCrossOrigin ? ("None" as const) : ("Lax" as const),
        secure: isCrossOrigin || isSecureContext,
    };
}

async function getRepository(context: Context<AppEnvironment>) {
    const config = loadConfig(context.env);
    const repository = createBlogRepository({
        database: context.env.DB,
        seedPlaceholder: config.seedPlaceholder,
    });

    await repository.initialize();
    return repository;
}

async function isAuthenticated(context: Context<AppEnvironment>) {
    const config = loadConfig(context.env);
    const sessionCookie = await getSignedCookie(context, config.sessionSecret, config.cookieName);

    return sessionCookie === "admin";
}

const applyCors: MiddlewareHandler<AppEnvironment> = async (context, next) => {
    const config = loadConfig(context.env);
    const origin = context.req.header("Origin");

    if (!isAllowedOrigin(origin, context.req.url, config.corsOrigins)) {
        return context.json({ error: `Origin ${origin} is not allowed.` }, 403);
    }

    if (origin) {
        setCorsHeaders(context, origin);
    }

    if (context.req.method === "OPTIONS") {
        return context.body(null, 204);
    }

    await next();
};

const requireAdmin: MiddlewareHandler<AppEnvironment> = async (context, next) => {
    if (!(await isAuthenticated(context))) {
        return context.json({ error: "Unauthorized" }, 401);
    }

    await next();
};

export function buildApp() {
    const app = new Hono<AppEnvironment>();

    app.use("/api/*", applyCors);
    app.use("/api/admin/posts", requireAdmin);
    app.use("/api/admin/posts/*", requireAdmin);

    app.get("/api/health", (context) => context.json({ ok: true }));

    app.get("/api/posts", async (context) => {
        const repository = await getRepository(context);
        return context.json({
            posts: await repository.listPublishedPosts(),
        });
    });

    app.get("/api/posts/:slug", async (context) => {
        const repository = await getRepository(context);
        const post = await repository.getPublishedPostBySlug(context.req.param("slug"));

        if (!post) {
            return context.json({ error: "Post not found." }, 404);
        }

        return context.json({ post });
    });

    app.get("/api/admin/session", async (context) =>
        context.json({
            authenticated: await isAuthenticated(context),
        }),
    );

    app.post("/api/admin/session", async (context) => {
        const config = loadConfig(context.env);
        const { password } = await readJsonBody<LoginBody>(context);

        if (typeof password !== "string" || password !== config.adminPassword) {
            return context.json({ error: "Invalid password." }, 401);
        }

        await setSignedCookie(context, config.cookieName, "admin", config.sessionSecret, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            ...getSessionCookieOptions(context),
        });

        return context.json({ authenticated: true });
    });

    app.delete("/api/admin/session", (context) => {
        const config = loadConfig(context.env);
        deleteCookie(context, config.cookieName, getSessionCookieOptions(context));

        return context.json({ authenticated: false });
    });

    app.get("/api/admin/posts", async (context) => {
        const repository = await getRepository(context);
        return context.json({
            posts: await repository.listAllPosts(),
        });
    });

    app.post("/api/admin/posts", async (context) => {
        try {
            const repository = await getRepository(context);
            const { title, bodyMarkdown } = await readJsonBody<CreatePostBody>(context);
            const post = await repository.createPost({
                bodyMarkdown:
                    bodyMarkdown === undefined
                        ? ""
                        : parseStringField(bodyMarkdown, "bodyMarkdown"),
                title: parseStringField(title, "title"),
            });

            return context.json({ post }, 201);
        } catch (error) {
            return context.json({ error: getErrorMessage(error) }, 400);
        }
    });

    app.patch("/api/admin/posts/:id", async (context) => {
        try {
            const repository = await getRepository(context);
            const { title, bodyMarkdown } = await readJsonBody<UpdatePostBody>(context);
            const post = await repository.updatePost(parseId(context.req.param("id")), {
                bodyMarkdown:
                    bodyMarkdown === undefined
                        ? undefined
                        : parseStringField(bodyMarkdown, "bodyMarkdown"),
                title: title === undefined ? undefined : parseStringField(title, "title"),
            });

            if (!post) {
                return context.json({ error: "Post not found." }, 404);
            }

            return context.json({ post });
        } catch (error) {
            return context.json({ error: getErrorMessage(error) }, 400);
        }
    });

    app.delete("/api/admin/posts/:id", async (context) => {
        try {
            const repository = await getRepository(context);
            const deleted = await repository.deletePost(parseId(context.req.param("id")));

            if (!deleted) {
                return context.json({ error: "Post not found." }, 404);
            }

            return context.body(null, 204);
        } catch (error) {
            return context.json({ error: getErrorMessage(error) }, 400);
        }
    });

    app.post("/api/admin/posts/:id/publish", async (context) => {
        try {
            const repository = await getRepository(context);
            const post = await repository.publishPost(parseId(context.req.param("id")));

            if (!post) {
                return context.json({ error: "Post not found." }, 404);
            }

            return context.json({ post });
        } catch (error) {
            return context.json({ error: getErrorMessage(error) }, 400);
        }
    });

    app.post("/api/admin/posts/:id/unpublish", async (context) => {
        try {
            const repository = await getRepository(context);
            const post = await repository.unpublishPost(parseId(context.req.param("id")));

            if (!post) {
                return context.json({ error: "Post not found." }, 404);
            }

            return context.json({ post });
        } catch (error) {
            return context.json({ error: getErrorMessage(error) }, 400);
        }
    });

    return app;
}
