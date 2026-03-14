import { describe, expect, it } from "vitest";
import {
    getPixelHeartsBackgroundStyle,
    getSampleManifestUrl,
    resolveCollageAssetSrc,
} from "./assetPaths";

describe("assetPaths", () => {
    it("prefixes sample assets with the configured asset base", () => {
        expect(resolveCollageAssetSrc("/samples/default/image.jpg", "/pixel-collage/")).toBe(
            "/pixel-collage/samples/default/image.jpg",
        );
        expect(resolveCollageAssetSrc("samples/default/image.jpg", "/pixel-collage")).toBe(
            "/pixel-collage/samples/default/image.jpg",
        );
    });

    it("leaves already-normalized and external assets unchanged", () => {
        expect(
            resolveCollageAssetSrc("/pixel-collage/samples/default/image.jpg", "/pixel-collage/"),
        ).toBe("/pixel-collage/samples/default/image.jpg");
        expect(resolveCollageAssetSrc("data:image/png;base64,abc", "/pixel-collage/")).toBe(
            "data:image/png;base64,abc",
        );
        expect(resolveCollageAssetSrc("https://cdn.example.com/image.jpg", "/pixel-collage/")).toBe(
            "https://cdn.example.com/image.jpg",
        );
    });

    it("builds the sample manifest and heart background URLs from the asset base", () => {
        expect(getSampleManifestUrl("/pixel-collage/")).toBe(
            "/pixel-collage/samples/default/manifest.json",
        );
        expect(getPixelHeartsBackgroundStyle("/pixel-collage/")).toBe(
            "url('/pixel-collage/bg-pixel-hearts.svg') repeat",
        );
    });
});
