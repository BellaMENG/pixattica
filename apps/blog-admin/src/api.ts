export type BlogPostStatus = "draft" | "published";

export type AdminBlogPost = {
    bodyMarkdown: string;
    createdAt: string;
    id: number;
    publishedAt: string | null;
    slug: string;
    status: BlogPostStatus;
    title: string;
    updatedAt: string;
};

const BLOG_API_BASE_URL = import.meta.env.VITE_BLOG_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${BLOG_API_BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const responseBody = (await response.json()) as { authenticated?: boolean; error?: string };
    if (!response.ok) {
        throw new Error(responseBody.error ?? "Request failed.");
    }

    return responseBody as T;
}

export async function getAdminSession() {
    const response = await request<{ authenticated: boolean }>("/admin/session", {
        method: "GET",
    });

    return response.authenticated;
}

export async function loginAdmin(password: string) {
    await request("/admin/session", {
        body: JSON.stringify({ password }),
        method: "POST",
    });
}

export async function logoutAdmin() {
    await request("/admin/session", {
        method: "DELETE",
    });
}

export async function listAdminPosts() {
    const response = await request<{ posts: AdminBlogPost[] }>("/admin/posts", {
        method: "GET",
    });

    return response.posts;
}

export async function createAdminPost(input: { bodyMarkdown: string; title: string }) {
    const response = await request<{ post: AdminBlogPost }>("/admin/posts", {
        body: JSON.stringify(input),
        method: "POST",
    });

    return response.post;
}

export async function updateAdminPost(id: number, input: { bodyMarkdown: string; title: string }) {
    const response = await request<{ post: AdminBlogPost }>(`/admin/posts/${id}`, {
        body: JSON.stringify(input),
        method: "PATCH",
    });

    return response.post;
}

export async function publishAdminPost(id: number) {
    const response = await request<{ post: AdminBlogPost }>(`/admin/posts/${id}/publish`, {
        method: "POST",
    });

    return response.post;
}

export async function unpublishAdminPost(id: number) {
    const response = await request<{ post: AdminBlogPost }>(`/admin/posts/${id}/unpublish`, {
        method: "POST",
    });

    return response.post;
}

export async function deleteAdminPost(id: number) {
    await request(`/admin/posts/${id}`, {
        method: "DELETE",
    });
}
