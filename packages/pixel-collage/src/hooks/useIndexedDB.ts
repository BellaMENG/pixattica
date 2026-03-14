import { useState, useEffect, useCallback, useRef } from "react";
import { loadValue, saveValue } from "../utils/imageStorage";

export function useIndexedDB<T>(
    key: string,
    fallback: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
    const [state, setState] = useState<T>(fallback);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        let cancelled = false;
        loadValue(key, fallback).then((loaded) => {
            if (!cancelled) {
                setState(loaded);
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        });
        return () => {
            cancelled = true;
        };
    }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isInitialLoad.current) return;
        saveValue(key, state);
    }, [key, state]);

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setState(value);
    }, []);

    return [state, setValue, isLoading];
}
