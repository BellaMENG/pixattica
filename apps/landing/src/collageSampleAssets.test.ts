import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type SampleAssetItem = {
    src?: string;
};

type SampleManifest = {
    canvasItems?: SampleAssetItem[];
    croppedCutouts?: SampleAssetItem[];
    uploadedImages?: SampleAssetItem[];
};

const PUBLIC_DIR = resolve(import.meta.dirname, "../public");
const MANIFEST_PATH = resolve(PUBLIC_DIR, "samples/default/manifest.json");

describe("default collage sample assets", () => {
    it("keeps every rooted asset reference in the sample manifest available in public/", () => {
        const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as SampleManifest;
        const rootedAssetPaths = [
            ...(manifest.uploadedImages ?? []),
            ...(manifest.croppedCutouts ?? []),
            ...(manifest.canvasItems ?? []),
        ]
            .map((item) => item.src)
            .filter((src): src is string => Boolean(src?.startsWith("/")));

        expect(rootedAssetPaths.length).toBeGreaterThan(0);

        rootedAssetPaths.forEach((src) => {
            expect(existsSync(resolve(PUBLIC_DIR, `.${src}`))).toBe(true);
        });
    });
});
