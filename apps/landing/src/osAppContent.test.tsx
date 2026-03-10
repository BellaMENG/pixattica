import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OsAppContent } from "./osAppContent";
import { APP_MODULES } from "./osData";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

vi.mock("@pixattica/pixel-collage", () => ({
    PixelCollageApp: ({ embedded }: { embedded?: boolean }) => (
        <div data-testid="pixel-collage-app" data-embedded={embedded ? "true" : "false"}>
            mock collage app
        </div>
    ),
}));

describe("OsAppContent", () => {
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

    it("renders the collage package directly instead of an iframe wrapper", async () => {
        const collageModule = APP_MODULES.find((module) => module.id === "collage");
        expect(collageModule).toBeDefined();

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        const rootInstance = root;

        await act(async () => {
            rootInstance.render(
                <OsAppContent
                    activeModule={collageModule!}
                    onLaunchApp={() => {
                        // No-op for this unit test.
                    }}
                />,
            );
        });

        await act(async () => {
            await Promise.resolve();
        });

        const embeddedApp = container.querySelector('[data-testid="pixel-collage-app"]');
        expect(embeddedApp).not.toBeNull();
        expect(embeddedApp?.getAttribute("data-embedded")).toBe("true");
        expect(container.querySelector("iframe")).toBeNull();
    });
});
