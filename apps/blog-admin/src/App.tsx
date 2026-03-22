import { useEffect, useState } from "react";
import {
    createAdminPost,
    deleteAdminPost,
    getAdminSession,
    listAdminPosts,
    loginAdmin,
    logoutAdmin,
    publishAdminPost,
    type AdminBlogPost,
    unpublishAdminPost,
    updateAdminPost,
} from "./api";

type EditorState = {
    bodyMarkdown: string;
    title: string;
};

type SessionState = "authenticated" | "loading" | "unauthenticated";

const EMPTY_EDITOR_STATE: EditorState = {
    bodyMarkdown: "",
    title: "",
};

function formatDateLabel(value: string | null) {
    if (!value) {
        return "Draft";
    }

    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function App() {
    const [editorState, setEditorState] = useState<EditorState>(EMPTY_EDITOR_STATE);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [loginPassword, setLoginPassword] = useState("");
    const [notice, setNotice] = useState<string | null>(null);
    const [posts, setPosts] = useState<AdminBlogPost[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [sessionState, setSessionState] = useState<SessionState>("loading");

    const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;

    useEffect(() => {
        const nextEditorState = selectedPost
            ? {
                  bodyMarkdown: selectedPost.bodyMarkdown,
                  title: selectedPost.title,
              }
            : EMPTY_EDITOR_STATE;

        setEditorState(nextEditorState);
    }, [selectedPost]);

    useEffect(() => {
        let cancelled = false;

        async function bootstrapAdmin() {
            try {
                const isAuthenticated = await getAdminSession();
                if (cancelled) {
                    return;
                }

                if (!isAuthenticated) {
                    setSessionState("unauthenticated");
                    return;
                }

                const nextPosts = await listAdminPosts();
                if (cancelled) {
                    return;
                }

                setPosts(nextPosts);
                setSelectedPostId(nextPosts[0]?.id ?? null);
                setSessionState("authenticated");
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setErrorMessage(error instanceof Error ? error.message : "Unable to load admin.");
                setSessionState("unauthenticated");
            }
        }

        void bootstrapAdmin();

        return () => {
            cancelled = true;
        };
    }, []);

    async function refreshPosts(preferredPostId?: number | null) {
        const nextPosts = await listAdminPosts();
        setPosts(nextPosts);
        setSelectedPostId((currentPostId) => {
            if (preferredPostId !== undefined) {
                if (
                    preferredPostId !== null &&
                    nextPosts.some((post) => post.id === preferredPostId)
                ) {
                    return preferredPostId;
                }

                return nextPosts[0]?.id ?? null;
            }

            if (currentPostId !== null && nextPosts.some((post) => post.id === currentPostId)) {
                return currentPostId;
            }

            return nextPosts[0]?.id ?? null;
        });
    }

    async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsBusy(true);
        setErrorMessage(null);
        setNotice(null);

        try {
            await loginAdmin(loginPassword);
            await refreshPosts();
            setLoginPassword("");
            setSessionState("authenticated");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
            setSessionState("unauthenticated");
        } finally {
            setIsBusy(false);
        }
    }

    async function handleLogout() {
        setIsBusy(true);
        setErrorMessage(null);
        setNotice(null);

        try {
            await logoutAdmin();
            setEditorState(EMPTY_EDITOR_STATE);
            setPosts([]);
            setSelectedPostId(null);
            setSessionState("unauthenticated");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to sign out.");
        } finally {
            setIsBusy(false);
        }
    }

    async function handleSave() {
        setIsBusy(true);
        setErrorMessage(null);

        try {
            if (selectedPost) {
                const updatedPost = await updateAdminPost(selectedPost.id, editorState);
                await refreshPosts(updatedPost.id);
                setNotice("Draft updated.");
                return;
            }

            const createdPost = await createAdminPost(editorState);
            await refreshPosts(createdPost.id);
            setNotice("Draft created.");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to save post.");
        } finally {
            setIsBusy(false);
        }
    }

    async function handleTogglePublish() {
        if (!selectedPost) {
            return;
        }

        setIsBusy(true);
        setErrorMessage(null);

        try {
            if (selectedPost.status === "draft") {
                const publishedPost = await publishAdminPost(selectedPost.id);
                await refreshPosts(publishedPost.id);
                setNotice("Post published.");
                return;
            }

            const unpublishedPost = await unpublishAdminPost(selectedPost.id);
            await refreshPosts(unpublishedPost.id);
            setNotice("Post moved back to draft.");
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Unable to change publish state.",
            );
        } finally {
            setIsBusy(false);
        }
    }

    async function handleDelete() {
        if (!selectedPost || !window.confirm(`Delete "${selectedPost.title}"?`)) {
            return;
        }

        setIsBusy(true);
        setErrorMessage(null);

        try {
            await deleteAdminPost(selectedPost.id);
            await refreshPosts();
            setNotice("Post deleted.");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to delete post.");
        } finally {
            setIsBusy(false);
        }
    }

    if (sessionState === "loading") {
        return (
            <main className="admin-shell">
                <section className="admin-panel">
                    <h1 className="admin-title">Pixattica Blog Admin</h1>
                    <p className="admin-copy">Checking admin session...</p>
                </section>
            </main>
        );
    }

    if (sessionState === "unauthenticated") {
        return (
            <main className="admin-shell">
                <section className="admin-panel max-w-md">
                    <p className="admin-kicker">blog admin</p>
                    <h1 className="admin-title">Pixattica Blog Admin</h1>
                    <p className="admin-copy">
                        Sign in with the single admin password to create, edit, publish, and delete
                        blog posts.
                    </p>
                    <form className="mt-6 grid gap-4" onSubmit={handleLoginSubmit}>
                        <label className="grid gap-2 text-sm text-rose-700">
                            Password
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={(event) => setLoginPassword(event.target.value)}
                                className="admin-input"
                                autoComplete="current-password"
                            />
                        </label>
                        <button type="submit" className="admin-button" disabled={isBusy}>
                            {isBusy ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                    {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
                </section>
            </main>
        );
    }

    return (
        <main className="admin-shell">
            <section className="admin-layout">
                <aside className="admin-sidebar">
                    <div>
                        <p className="admin-kicker">blog admin</p>
                        <h1 className="admin-title">Thoughts</h1>
                        <p className="admin-copy">Draft first, publish when you are ready.</p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            className="admin-button"
                            onClick={() => {
                                setSelectedPostId(null);
                                setEditorState(EMPTY_EDITOR_STATE);
                                setNotice(null);
                                setErrorMessage(null);
                            }}
                        >
                            New draft
                        </button>
                        <button
                            type="button"
                            className="admin-button admin-button-secondary"
                            onClick={handleLogout}
                            disabled={isBusy}
                        >
                            Log out
                        </button>
                    </div>

                    <div className="mt-6 min-h-0 flex-1 overflow-auto">
                        <div className="grid gap-3">
                            {posts.map((post) => (
                                <button
                                    key={post.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedPostId(post.id);
                                        setNotice(null);
                                        setErrorMessage(null);
                                    }}
                                    className={`admin-post-card ${
                                        post.id === selectedPostId ? "admin-post-card-selected" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-left">
                                            <p className="admin-post-title">{post.title}</p>
                                            <p className="admin-post-meta">
                                                {formatDateLabel(post.updatedAt)}
                                            </p>
                                        </div>
                                        <span className="admin-status-pill">{post.status}</span>
                                    </div>
                                </button>
                            ))}
                            {posts.length === 0 ? (
                                <div className="admin-empty-state">
                                    No posts yet. Create the first draft from here.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </aside>

                <section className="admin-panel min-h-[40rem]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="admin-kicker">
                                {selectedPost ? selectedPost.slug : "new draft"}
                            </p>
                            <h2 className="admin-section-title">
                                {selectedPost ? selectedPost.title : "New post"}
                            </h2>
                            <p className="admin-copy mt-2">
                                {selectedPost
                                    ? `Status: ${selectedPost.status} · ${formatDateLabel(
                                          selectedPost.publishedAt ?? selectedPost.updatedAt,
                                      )}`
                                    : "Write a title and markdown body, then save a draft."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="admin-button"
                                onClick={() => void handleSave()}
                                disabled={isBusy}
                            >
                                {selectedPost ? "Save changes" : "Create draft"}
                            </button>
                            {selectedPost ? (
                                <button
                                    type="button"
                                    className="admin-button admin-button-secondary"
                                    onClick={() => void handleTogglePublish()}
                                    disabled={isBusy}
                                >
                                    {selectedPost.status === "draft" ? "Publish" : "Unpublish"}
                                </button>
                            ) : null}
                            {selectedPost ? (
                                <button
                                    type="button"
                                    className="admin-button admin-button-danger"
                                    onClick={() => void handleDelete()}
                                    disabled={isBusy}
                                >
                                    Delete
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-5">
                        <label className="grid gap-2 text-sm text-rose-700">
                            Title
                            <input
                                type="text"
                                value={editorState.title}
                                onChange={(event) =>
                                    setEditorState((currentState) => ({
                                        ...currentState,
                                        title: event.target.value,
                                    }))
                                }
                                className="admin-input"
                                placeholder="A title for the post"
                            />
                        </label>

                        <label className="grid gap-2 text-sm text-rose-700">
                            Markdown body
                            <textarea
                                value={editorState.bodyMarkdown}
                                onChange={(event) =>
                                    setEditorState((currentState) => ({
                                        ...currentState,
                                        bodyMarkdown: event.target.value,
                                    }))
                                }
                                className="admin-textarea"
                                placeholder="Write the note in markdown..."
                                rows={18}
                            />
                        </label>

                        {notice ? <p className="admin-notice">{notice}</p> : null}
                        {errorMessage ? <p className="admin-error">{errorMessage}</p> : null}
                    </div>
                </section>
            </section>
        </main>
    );
}
