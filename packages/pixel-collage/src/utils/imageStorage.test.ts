import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { loadValue, saveValue, deleteValue } from "./imageStorage";

beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
});

describe("imageStorage", () => {
    describe("loadValue", () => {
        it("returns the fallback when key does not exist", async () => {
            const result = await loadValue("missing", []);
            expect(result).toEqual([]);
        });

        it("returns the stored value after saving", async () => {
            const images = [{ id: "1", src: "data:image/png;base64,abc", name: "photo.png" }];
            await saveValue("images", images);
            const result = await loadValue("images", []);
            expect(result).toEqual(images);
        });
    });

    describe("saveValue", () => {
        it("overwrites a previously stored value", async () => {
            await saveValue("key", "first");
            await saveValue("key", "second");
            const result = await loadValue("key", "default");
            expect(result).toBe("second");
        });

        it("stores complex objects with nested data", async () => {
            const cutouts = [
                { id: "c-1", src: "data:image/png;base64,big-data", sourceImageId: "img-1" },
                { id: "c-2", src: "data:image/png;base64,more-data", sourceImageId: "img-2" },
            ];
            await saveValue("cutouts", cutouts);
            const result = await loadValue("cutouts", []);
            expect(result).toEqual(cutouts);
        });
    });

    describe("deleteValue", () => {
        it("removes a stored value so fallback is returned", async () => {
            await saveValue("key", "value");
            await deleteValue("key");
            const result = await loadValue("key", "fallback");
            expect(result).toBe("fallback");
        });

        it("does not throw when deleting a non-existent key", async () => {
            await expect(deleteValue("nonexistent")).resolves.toBeUndefined();
        });
    });

    describe("isolation between keys", () => {
        it("stores and retrieves independent keys without interference", async () => {
            await saveValue("a", [1, 2, 3]);
            await saveValue("b", [4, 5, 6]);

            expect(await loadValue("a", [])).toEqual([1, 2, 3]);
            expect(await loadValue("b", [])).toEqual([4, 5, 6]);
        });
    });
});
