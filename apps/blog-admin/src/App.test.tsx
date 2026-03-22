import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createAdminPost, getAdminSession, listAdminPosts, loginAdmin } from "./api";

vi.mock("./api", () => ({
    createAdminPost: vi.fn(),
    deleteAdminPost: vi.fn(),
    getAdminSession: vi.fn(),
    listAdminPosts: vi.fn(),
    loginAdmin: vi.fn(),
    logoutAdmin: vi.fn(),
    publishAdminPost: vi.fn(),
    unpublishAdminPost: vi.fn(),
    updateAdminPost: vi.fn(),
}));

const SAMPLE_POST = {
    bodyMarkdown: "Hello world",
    createdAt: "2026-03-21T10:00:00.000Z",
    id: 1,
    publishedAt: null,
    slug: "hello-world",
    status: "draft" as const,
    title: "Hello world",
    updatedAt: "2026-03-21T10:00:00.000Z",
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminSession).mockResolvedValue(false);
    vi.mocked(listAdminPosts).mockResolvedValue([]);
    vi.mocked(loginAdmin).mockResolvedValue();
    vi.mocked(createAdminPost).mockResolvedValue(SAMPLE_POST);
});

afterEach(() => {
    cleanup();
});

describe("blog admin app", () => {
    it("shows the login screen first and loads the dashboard after sign in", async () => {
        vi.mocked(listAdminPosts).mockResolvedValue([SAMPLE_POST]);

        render(<App />);
        const user = userEvent.setup();

        expect(await screen.findByLabelText("Password")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Password"), "test-password");
        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByRole("heading", { name: "Thoughts" })).toBeInTheDocument();
        expect(screen.getByLabelText("Title")).toHaveValue("Hello world");
        expect(screen.getByLabelText("Markdown body")).toHaveValue("Hello world");
    });

    it("creates a new draft from the editor state", async () => {
        vi.mocked(getAdminSession).mockResolvedValue(true);
        vi.mocked(listAdminPosts).mockResolvedValueOnce([]).mockResolvedValueOnce([SAMPLE_POST]);

        render(<App />);
        const user = userEvent.setup();

        expect(await screen.findByRole("button", { name: "Create draft" })).toBeInTheDocument();

        await user.type(screen.getByLabelText("Title"), "Hello world");
        await user.type(screen.getByLabelText("Markdown body"), "Hello world");
        await user.click(screen.getByRole("button", { name: "Create draft" }));

        await waitFor(() => {
            expect(createAdminPost).toHaveBeenCalledWith({
                bodyMarkdown: "Hello world",
                title: "Hello world",
            });
        });
    });
});
