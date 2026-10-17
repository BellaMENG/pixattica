import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { SLIDES } from "./slides";

vi.mock("@pixattica/ui", () => ({
    AnimatedCursor: () => null,
}));

const ORIGINAL_SLIDES = structuredClone(SLIDES);

afterEach(() => {
    cleanup();
    SLIDES.splice(0, SLIDES.length, ...structuredClone(ORIGINAL_SLIDES));
});

describe("reading app", () => {
    it("renders the first slide on load", () => {
        const { container } = render(<App />);

        expect(screen.getByRole("heading", { name: SLIDES[0].title })).toBeTruthy();
        expect(container.querySelector(".reading-placeholder-title")).toBeNull();
    });

    it("moves to the next slide when next is clicked", async () => {
        render(<App />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(screen.getByRole("heading", { name: SLIDES[1].title })).toBeTruthy();
    });

    it("jumps to the last slide with the end key", async () => {
        const { container } = render(<App />);
        const user = userEvent.setup();

        await user.keyboard("{End}");

        expect(screen.getByRole("heading", { name: SLIDES[SLIDES.length - 1].title })).toBeTruthy();
        expect(container.querySelector(".reading-placeholder-body")).toBeNull();
        expect(container.querySelector(".reading-placeholder-footer")).toBeNull();
    });

    it("renders subtitle and bullet blocks when a slide has content", () => {
        SLIDES[0] = {
            ...SLIDES[0],
            blocks: [
                {
                    items: ["Phone in another room.", "Read", "Rest"],
                },
            ],
            subtitle: "A real subtitle",
        };

        render(<App />);

        expect(screen.getByText("A real subtitle")).toBeTruthy();
        expect(screen.getByText("Phone in another room.")).toBeTruthy();
        expect(screen.getByText("Read")).toBeTruthy();
        expect(screen.getByText("Rest")).toBeTruthy();
    });

    it("supports explicitly centered slides with longer content", async () => {
        const { container } = render(<App />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(screen.getByRole("heading", { name: "What Worked for Me!" })).toBeTruthy();
        expect(container.querySelector(".reading-slide-body-centered")).toBeTruthy();
    });
});
