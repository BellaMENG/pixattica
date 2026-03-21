import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OsAppContent } from "./osAppContent";
import { APP_MODULES } from "./osData";

Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);

vi.mock("@pixattica/pixel-collage", () => ({
    PixelCollageApp: ({
        embedded,
        assetBaseUrl,
    }: {
        embedded?: boolean;
        assetBaseUrl?: string;
    }) => (
        <div
            data-testid="pixel-collage-app"
            data-embedded={embedded ? "true" : "false"}
            data-asset-base-url={assetBaseUrl ?? ""}
        >
            mock collage app
        </div>
    ),
}));

vi.mock("./osApps/BbsApp", () => ({
    default: () => <div data-testid="dialtone-bbs-app">mock dialtone bbs</div>,
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
            rootInstance.render(<OsAppContent activeModule={collageModule!} />);
        });

        await act(async () => {
            await Promise.resolve();
        });

        const embeddedApp = container.querySelector('[data-testid="pixel-collage-app"]');
        expect(embeddedApp).not.toBeNull();
        expect(embeddedApp?.getAttribute("data-embedded")).toBe("true");
        expect(embeddedApp?.getAttribute("data-asset-base-url")).toBe("/");
        expect(container.querySelector("iframe")).toBeNull();
    });

    it("renders the dialtone bbs window shell through the shared app loader", async () => {
        const bbsModule = APP_MODULES.find((module) => module.id === "bbs");
        expect(bbsModule).toBeDefined();

        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        const rootInstance = root;

        await act(async () => {
            rootInstance.render(<OsAppContent activeModule={bbsModule!} />);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(container.querySelector('[data-testid="dialtone-bbs-app"]')).not.toBeNull();
    });
});
