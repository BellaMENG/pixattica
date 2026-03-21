import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import AboutApp from "./osApps/AboutApp";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

describe("AboutApp", () => {
    let container: HTMLDivElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;

    afterEach(async () => {
        if (!root) return;

        await act(async () => {
            root?.unmount();
        });
        root = null;
        container?.remove();
        container = null;
    });

    it("exposes Bella Meng portfolio copy and contact links", async () => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root?.render(<AboutApp />);
        });

        const heading = container.querySelector("h1");
        const linkedInLink = container.querySelector(
            'a[href="https://www.linkedin.com/in/bella-meng/"]',
        );
        const emailLink = container.querySelector('a[href="mailto:bellamengzihan@gmail.com"]');
        const shortcutButtons = container.querySelectorAll("button");
        const textContent = container.textContent?.replace(/\s+/g, " ").trim() ?? "";

        expect(heading?.textContent).toBe("Bella Meng");
        expect(textContent.startsWith("Bella Meng")).toBe(true);
        expect(textContent).toContain(
            "Bella Meng, software engineer, (product engineer?), based in London.",
        );
        expect(textContent.endsWith("bellamengzihan@gmail.com")).toBe(true);
        expect(linkedInLink?.textContent).toBe("LinkedIn");
        expect(emailLink?.textContent).toBe("bellamengzihan@gmail.com");
        expect(shortcutButtons).toHaveLength(0);
    });
});
