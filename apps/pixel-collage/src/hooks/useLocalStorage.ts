import { useState, useEffect, useCallback } from "react";
import { LOCAL_STORAGE_PREFIX } from "../config";

export interface StorageError {
    message: string;
    key: string;
}

function readFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeToStorage<T>(key: string, value: T): StorageError | null {
    try {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
        return null;
    } catch (error: unknown) {
        const message = extractErrorMessage(error);
        return { message, key };
    }
}

function extractErrorMessage(error: unknown): string {
    if (error instanceof DOMException) return error.message;
    if (error instanceof Error) return error.message;
    return "Failed to write to localStorage";
}

export function useLocalStorage<T>(
    key: string,
    fallback: T,
): [T, (value: T | ((prev: T) => T)) => void, StorageError | null] {
    const [state, setState] = useState<T>(() => readFromStorage(key, fallback));
    const [error, setError] = useState<StorageError | null>(null);

    useEffect(() => {
        const writeError = writeToStorage(key, state);
        setError(writeError);
    }, [key, state]);

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setState(value);
    }, []);

    return [state, setValue, error];
}
