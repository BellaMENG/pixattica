import "@testing-library/jest-dom/vitest";
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

        expect(screen.getByRole("heading", { name: SLIDES[0].title })).toBeInTheDocument();
        expect(container.querySelector(".reading-placeholder-title")).not.toBeInTheDocument();
    });

    it("moves to the next slide when next is clicked", async () => {
        render(<App />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(screen.getByRole("heading", { name: SLIDES[1].title })).toBeInTheDocument();
    });

    it("jumps to the last slide with the end key", async () => {
        const { container } = render(<App />);
        const user = userEvent.setup();

        await user.keyboard("{End}");

        expect(
            screen.getByRole("heading", { name: SLIDES[SLIDES.length - 1].title }),
        ).toBeInTheDocument();
        expect(container.querySelector(".reading-placeholder-body")).not.toBeInTheDocument();
        expect(container.querySelector(".reading-placeholder-footer")).not.toBeInTheDocument();
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

        expect(screen.getByText("A real subtitle")).toBeInTheDocument();
        expect(screen.getByText("Phone in another room.")).toBeInTheDocument();
        expect(screen.getByText("Read")).toBeInTheDocument();
        expect(screen.getByText("Rest")).toBeInTheDocument();
    });

    it("supports explicitly centered slides with longer content", async () => {
        const { container } = render(<App />);
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(screen.getByRole("heading", { name: "What Worked for Me!" })).toBeInTheDocument();
        expect(container.querySelector(".reading-slide-body-centered")).toBeInTheDocument();
    });
});
