import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "pixel-collage:";

function readFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeToStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
        // localStorage may be full or unavailable; silently skip
    }
}

export function useLocalStorage<T>(
    key: string,
    fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => readFromStorage(key, fallback));

    useEffect(() => {
        writeToStorage(key, state);
    }, [key, state]);

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setState(value);
    }, []);

    return [state, setValue];
}
