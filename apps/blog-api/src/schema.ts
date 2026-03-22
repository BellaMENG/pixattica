import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const blogPosts = sqliteTable("blog_posts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    bodyMarkdown: text("body_markdown").notNull(),
    status: text("status", { enum: ["draft", "published"] }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    publishedAt: text("published_at"),
});

export type BlogPostStatus = (typeof blogPosts.$inferSelect)["status"];
export type BlogPostRecord = typeof blogPosts.$inferSelect;

export type AdminBlogPost = BlogPostRecord;
export type PublicBlogPost = Omit<BlogPostRecord, "publishedAt" | "status"> & {
    publishedAt: string;
};
