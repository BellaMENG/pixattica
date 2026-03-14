import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useLocalStorage } from "./useLocalStorage";
import { LOCAL_STORAGE_PREFIX } from "../config";

beforeEach(() => {
    localStorage.clear();
});

describe("useLocalStorage", () => {
    it("returns the fallback when localStorage is empty", () => {
        const { result } = renderHook(() => useLocalStorage("key", "default"));
        expect(result.current[0]).toBe("default");
    });

    it("returns the fallback for array types when localStorage is empty", () => {
        const { result } = renderHook(() => useLocalStorage<string[]>("items", []));
        expect(result.current[0]).toEqual([]);
    });

    it("restores state from localStorage on mount", () => {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}key`, JSON.stringify("stored-value"));
        const { result } = renderHook(() => useLocalStorage("key", "default"));
        expect(result.current[0]).toBe("stored-value");
    });

    it("restores an array from localStorage on mount", () => {
        const items = [{ id: "1", name: "test" }];
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}items`, JSON.stringify(items));
        const { result } = renderHook(() =>
            useLocalStorage<{ id: string; name: string }[]>("items", []),
        );
        expect(result.current[0]).toEqual(items);
    });

    it("saves state to localStorage when value changes", () => {
        const { result } = renderHook(() => useLocalStorage("key", "initial"));

        act(() => {
            result.current[1]("updated");
        });

        expect(JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}key`)!)).toBe("updated");
    });

    it("saves arrays to localStorage when value changes", () => {
        const { result } = renderHook(() => useLocalStorage<string[]>("items", []));

        act(() => {
            result.current[1](["a", "b"]);
        });

        expect(JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}items`)!)).toEqual([
            "a",
            "b",
        ]);
    });

    it("supports functional updates", () => {
        const { result } = renderHook(() => useLocalStorage("count", 0));

        act(() => {
            result.current[1]((prev) => prev + 1);
        });

        expect(result.current[0]).toBe(1);
        expect(JSON.parse(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}count`)!)).toBe(1);
    });

    it("falls back to default when localStorage contains invalid JSON", () => {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}key`, "not-valid-json{{{");
        const { result } = renderHook(() => useLocalStorage("key", "fallback"));
        expect(result.current[0]).toBe("fallback");
    });

    it("persists across remounts", () => {
        const { result, unmount } = renderHook(() => useLocalStorage("key", "default"));

        act(() => {
            result.current[1]("persisted");
        });

        unmount();

        const { result: result2 } = renderHook(() => useLocalStorage("key", "default"));
        expect(result2.current[0]).toBe("persisted");
    });

    it("uses separate storage for different keys", () => {
        const { result: hook1 } = renderHook(() => useLocalStorage("key1", "default1"));
        const { result: hook2 } = renderHook(() => useLocalStorage("key2", "default2"));

        act(() => {
            hook1.current[1]("value1");
        });

        expect(hook1.current[0]).toBe("value1");
        expect(hook2.current[0]).toBe("default2");
    });

    it("returns null error when storage succeeds", () => {
        const { result } = renderHook(() => useLocalStorage("key", "default"));
        expect(result.current[2]).toBeNull();
    });
});

describe("useLocalStorage quota exceeded handling", () => {
    let setItemSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        setItemSpy?.mockRestore();
    });

    it("surfaces an error when localStorage.setItem throws QuotaExceededError", () => {
        const { result } = renderHook(() => useLocalStorage("key", "small"));

        setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("quota exceeded", "QuotaExceededError");
        });

        act(() => {
            result.current[1]("a-very-large-value");
        });

        expect(result.current[0]).toBe("a-very-large-value");
        expect(result.current[2]).not.toBeNull();
        expect(result.current[2]!.message).toMatch(/quota/i);
    });

    it("clears the error after a successful write", () => {
        const { result } = renderHook(() => useLocalStorage("key", "initial"));

        setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("quota exceeded", "QuotaExceededError");
        });

        act(() => {
            result.current[1]("big-value");
        });

        expect(result.current[2]).not.toBeNull();

        setItemSpy.mockRestore();

        act(() => {
            result.current[1]("small-value");
        });

        expect(result.current[2]).toBeNull();
    });

    it("still updates in-memory state even when persistence fails", () => {
        const { result } = renderHook(() => useLocalStorage("key", "initial"));

        setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("quota exceeded", "QuotaExceededError");
        });

        act(() => {
            result.current[1]("new-value");
        });

        expect(result.current[0]).toBe("new-value");
    });
});
