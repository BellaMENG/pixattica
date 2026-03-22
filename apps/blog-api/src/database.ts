import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { blogPosts, type AdminBlogPost, type PublicBlogPost } from "./schema.js";
import { createSlug } from "./slug.js";

type CreatePostInput = {
    bodyMarkdown?: string;
    title: string;
};

type UpdatePostInput = {
    bodyMarkdown?: string;
    title?: string;
};

type CreateBlogRepositoryOptions = {
    databaseUrl: string;
    seedPlaceholder?: boolean;
};

function normalizeDatabaseUrl(databaseUrl: string) {
    if (databaseUrl === ":memory:") {
        return databaseUrl;
    }

    return path.isAbsolute(databaseUrl) ? databaseUrl : path.resolve(process.cwd(), databaseUrl);
}

function normalizeMarkdownBody(bodyMarkdown: string | undefined) {
    return (bodyMarkdown ?? "").replace(/\r\n/g, "\n");
}

function normalizeTitle(title: string) {
    const normalized = title.trim();
    if (!normalized) {
        throw new Error("Title is required.");
    }

    return normalized;
}

function toPublicPost(post: AdminBlogPost): PublicBlogPost {
    if (!post.publishedAt) {
        throw new Error("Published posts must include a published date.");
    }

    return {
        bodyMarkdown: post.bodyMarkdown,
        createdAt: post.createdAt,
        id: post.id,
        publishedAt: post.publishedAt,
        slug: post.slug,
        title: post.title,
        updatedAt: post.updatedAt,
    };
}

export function createBlogRepository({
    databaseUrl,
    seedPlaceholder = true,
}: CreateBlogRepositoryOptions) {
    const resolvedDatabaseUrl = normalizeDatabaseUrl(databaseUrl);

    if (resolvedDatabaseUrl !== ":memory:") {
        fs.mkdirSync(path.dirname(resolvedDatabaseUrl), { recursive: true });
    }

    const client = new Database(resolvedDatabaseUrl);
    if (resolvedDatabaseUrl !== ":memory:") {
        client.pragma("journal_mode = WAL");
    }
    client.pragma("foreign_keys = ON");
    client.exec(`
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            body_markdown TEXT NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            published_at TEXT
        )
    `);

    const database = drizzle(client);

    function getPostById(id: number) {
        const [post] = database.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1).all();
        return post ?? null;
    }

    function slugExists(slug: string) {
        const existingPosts = database
            .select({ id: blogPosts.id })
            .from(blogPosts)
            .where(eq(blogPosts.slug, slug))
            .limit(1)
            .all();

        return existingPosts.length > 0;
    }

    function createUniqueSlug(title: string) {
        const baseSlug = createSlug(title);
        let nextSlug = baseSlug;
        let suffix = 2;

        while (slugExists(nextSlug)) {
            nextSlug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }

        return nextSlug;
    }

    function seedInitialPlaceholder() {
        if (!seedPlaceholder) {
            return;
        }

        const existingPosts = database.select({ id: blogPosts.id }).from(blogPosts).limit(1).all();
        if (existingPosts.length > 0) {
            return;
        }

        const now = new Date().toISOString();
        database
            .insert(blogPosts)
            .values({
                bodyMarkdown:
                    "This is the first note in the notebook.\n\nReplace it with a real thought when you are ready.",
                createdAt: now,
                publishedAt: now,
                slug: "first-note-in-the-notebook",
                status: "published",
                title: "First note in the notebook",
                updatedAt: now,
            })
            .run();
    }

    seedInitialPlaceholder();

    return {
        close() {
            client.close();
        },
        createPost(input: CreatePostInput) {
            const title = normalizeTitle(input.title);
            const now = new Date().toISOString();

            const createdPost = database
                .insert(blogPosts)
                .values({
                    bodyMarkdown: normalizeMarkdownBody(input.bodyMarkdown),
                    createdAt: now,
                    slug: createUniqueSlug(title),
                    status: "draft",
                    title,
                    updatedAt: now,
                })
                .returning()
                .get();

            return createdPost;
        },
        deletePost(id: number) {
            const deleteResult = database.delete(blogPosts).where(eq(blogPosts.id, id)).run();
            return deleteResult.changes > 0;
        },
        getPublishedPostBySlug(slug: string) {
            const [post] = database
                .select()
                .from(blogPosts)
                .where(eq(blogPosts.slug, slug))
                .limit(1)
                .all();

            if (!post || post.status !== "published") {
                return null;
            }

            return toPublicPost(post);
        },
        listAllPosts() {
            return database.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt)).all();
        },
        listPublishedPosts() {
            return database
                .select()
                .from(blogPosts)
                .where(eq(blogPosts.status, "published"))
                .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
                .all()
                .map(toPublicPost);
        },
        publishPost(id: number) {
            const existingPost = getPostById(id);
            if (!existingPost) {
                return null;
            }

            const now = new Date().toISOString();
            database
                .update(blogPosts)
                .set({
                    publishedAt: now,
                    status: "published",
                    updatedAt: now,
                })
                .where(eq(blogPosts.id, id))
                .run();

            return getPostById(id);
        },
        unpublishPost(id: number) {
            const existingPost = getPostById(id);
            if (!existingPost) {
                return null;
            }

            const now = new Date().toISOString();
            database
                .update(blogPosts)
                .set({
                    publishedAt: null,
                    status: "draft",
                    updatedAt: now,
                })
                .where(eq(blogPosts.id, id))
                .run();

            return getPostById(id);
        },
        updatePost(id: number, input: UpdatePostInput) {
            const existingPost = getPostById(id);
            if (!existingPost) {
                return null;
            }

            if (input.title === undefined && input.bodyMarkdown === undefined) {
                throw new Error("Nothing to update.");
            }

            const nextValues: Partial<typeof blogPosts.$inferInsert> = {
                updatedAt: new Date().toISOString(),
            };

            if (input.title !== undefined) {
                nextValues.title = normalizeTitle(input.title);
            }

            if (input.bodyMarkdown !== undefined) {
                nextValues.bodyMarkdown = normalizeMarkdownBody(input.bodyMarkdown);
            }

            database.update(blogPosts).set(nextValues).where(eq(blogPosts.id, id)).run();
            return getPostById(id);
        },
    };
}

export type BlogRepository = ReturnType<typeof createBlogRepository>;
