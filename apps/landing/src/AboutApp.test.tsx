import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
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
            root?.render(<AboutApp onLaunchApp={vi.fn()} />);
        });

        const heading = container.querySelector("h1");
        const linkedInLink = container.querySelector(
            'a[href="https://www.linkedin.com/in/bella-meng/"]',
        );
        const emailLink = container.querySelector('a[href="mailto:bellamengzihan@gmail.com"]');

        expect(heading?.textContent).toBe("Bella Meng");
        expect(container.textContent).toContain(
            "software engineer, (product engineer?), based in London",
        );
        expect(linkedInLink?.textContent).toBe("LinkedIn");
        expect(emailLink?.textContent).toBe("bellamengzihan@gmail.com");
    });
});
