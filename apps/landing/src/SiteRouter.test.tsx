import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import SiteRouter from "./SiteRouter";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

describe("SiteRouter", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;

    afterEach(async () => {
        if (root) await act(async () => root?.unmount());
        container?.remove();
        container = null;
        root = null;
        window.history.replaceState(null, "", "/");
        document.documentElement.classList.remove("bag-landing-enabled");
        vi.unstubAllGlobals();
    });

    it("keeps the loaded landing mounted through CV navigation and browser history", async () => {
        await Promise.all([import("./BagLanding"), import("./ResumeApp")]);
        window.history.replaceState(null, "", "/");
        vi.stubGlobal(
            "matchMedia",
            vi.fn(() => ({ matches: true })),
        );
        vi.stubGlobal("scrollTo", vi.fn());
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => root?.render(<SiteRouter />));
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        const bag = container.querySelector(".bag-landing");
        expect(bag).not.toBeNull();
        await act(async () => {
            container?.querySelector(".bag-scene__back")?.dispatchEvent(new Event("load"));
        });

        const laptop = container.querySelector<HTMLAnchorElement>('a[href="/cv"]')!;
        await act(async () => {
            laptop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        });
        expect(window.location.pathname).toBe("/cv");
        expect(document.title).toBe("Bella Meng | CV");
        expect(container.querySelector(".resume-page")).not.toBeNull();
        expect(bag?.parentElement?.hidden).toBe(true);

        const back = container.querySelector<HTMLAnchorElement>('a[href="/"]')!;
        await act(async () => {
            back.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        });
        expect(window.location.pathname).toBe("/");
        expect(container.querySelector(".bag-landing")).toBe(bag);
        expect(bag?.parentElement?.hidden).toBe(false);
        expect(document.title).toBe("Bella Meng | Software Engineer");

        window.history.replaceState(null, "", "/cv");
        await act(async () => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(container.querySelector(".resume-page")?.parentElement?.hidden).toBe(false);
        expect(bag?.parentElement?.hidden).toBe(true);
    });
});
