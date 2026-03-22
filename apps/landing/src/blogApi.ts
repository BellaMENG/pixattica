export type PublicBlogPost = {
    bodyMarkdown: string;
    createdAt: string;
    id: number;
    publishedAt: string;
    slug: string;
    title: string;
    updatedAt: string;
};

type ErrorResponse = {
    error?: string;
};

type ListPublishedBlogPostsResponse = {
    posts: PublicBlogPost[];
};

const BLOG_API_BASE_URL = import.meta.env.VITE_BLOG_API_BASE_URL ?? "/api";

function getApiUrl(pathname: string) {
    const normalizedBaseUrl = BLOG_API_BASE_URL.endsWith("/")
        ? BLOG_API_BASE_URL.slice(0, -1)
        : BLOG_API_BASE_URL;

    return `${normalizedBaseUrl}${pathname}`;
}

async function readResponseBody<T>(response: Response) {
    const body = (await response.json().catch(() => null)) as T | ErrorResponse | null;

    if (!response.ok) {
        const errorMessage =
            body && typeof body === "object" && "error" in body && typeof body.error === "string"
                ? body.error
                : "Unable to load blog posts right now.";

        throw new Error(errorMessage);
    }

    return body as T;
}

export async function listPublishedBlogPosts() {
    const response = await fetch(getApiUrl("/posts"));
    const body = await readResponseBody<ListPublishedBlogPostsResponse>(response);
    return body.posts;
}
