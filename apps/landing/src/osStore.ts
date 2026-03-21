import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { AppId, TranscriptEntry } from "./osData";
import {
    clampWindowFrame,
    getPreferredWindowFrame,
    type AppWindowFrame,
    type OsWindow,
    type WindowBounds,
} from "./osWindowing";

export type OsStore = {
    activeModuleId: AppId;
    commandHistory: string[];
    commandInput: string;
    draftBeforeHistory: string;
    focusedWindowId: string | null;
    historyIndex: number | null;
    isBooting: boolean;
    nextWindowNumber: number;
    transcript: TranscriptEntry[];
    windows: OsWindow[];
    appendTranscriptEntries: (entries: TranscriptEntry[]) => void;
    appendTranscriptEntry: (entry: TranscriptEntry) => void;
    bringWindowToFront: (windowId: string) => void;
    clearCommandInput: () => void;
    clearTranscript: () => void;
    clearWindows: () => void;
    closeWindow: (windowId: string) => void;
    focusOrOpenWindow: (appId: AppId, bounds: WindowBounds) => "focused" | "opened";
    focusShell: () => void;
    recordCommand: (command: string) => void;
    recallNextCommand: () => void;
    recallPreviousCommand: () => void;
    resetSession: (nextModuleId: AppId) => void;
    setActiveModuleId: (appId: AppId) => void;
    setCommandInput: (value: string) => void;
    setIsBooting: (value: boolean) => void;
    syncWindowFrames: (bounds: WindowBounds) => void;
    updateTranscriptEntry: (entryId: string, text: string) => void;
    updateWindowFrame: (windowId: string, frame: AppWindowFrame, bounds: WindowBounds) => void;
};

export const INITIAL_OS_STATE = {
    activeModuleId: "about" as AppId,
    commandHistory: [] as string[],
    commandInput: "",
    draftBeforeHistory: "",
    focusedWindowId: null as string | null,
    historyIndex: null as number | null,
    isBooting: true,
    nextWindowNumber: 1,
    transcript: [] as TranscriptEntry[],
    windows: [] as OsWindow[],
};

function createOsStoreState() {
    return createStore<OsStore>()((set, get) => ({
        ...INITIAL_OS_STATE,

        setActiveModuleId: (appId) => set({ activeModuleId: appId }),
        setCommandInput: (value) => set({ commandInput: value }),
        clearCommandInput: () => set({ commandInput: "" }),
        setIsBooting: (value) => set({ isBooting: value }),
        focusShell: () => set({ focusedWindowId: null }),

        appendTranscriptEntry: (entry) =>
            set((state) => ({
                transcript: [...state.transcript, entry],
            })),
        appendTranscriptEntries: (entries) =>
            set((state) => ({
                transcript: [...state.transcript, ...entries],
            })),
        updateTranscriptEntry: (entryId, text) =>
            set((state) => ({
                transcript: state.transcript.map((entry) =>
                    entry.id === entryId ? { ...entry, text } : entry,
                ),
            })),
        clearTranscript: () => set({ transcript: [] }),

        recordCommand: (command) =>
            set((state) => ({
                commandHistory: [...state.commandHistory, command],
                draftBeforeHistory: "",
                historyIndex: null,
            })),
        recallPreviousCommand: () =>
            set((state) => {
                if (state.commandHistory.length === 0) {
                    return {};
                }

                if (state.historyIndex === null) {
                    const nextIndex = state.commandHistory.length - 1;
                    return {
                        commandInput: state.commandHistory[nextIndex],
                        draftBeforeHistory: state.commandInput,
                        historyIndex: nextIndex,
                    };
                }

                const nextIndex = Math.max(0, state.historyIndex - 1);
                return {
                    commandInput: state.commandHistory[nextIndex],
                    historyIndex: nextIndex,
                };
            }),
        recallNextCommand: () =>
            set((state) => {
                if (state.historyIndex === null) {
                    return {};
                }

                const nextIndex = state.historyIndex + 1;
                if (nextIndex >= state.commandHistory.length) {
                    return {
                        commandInput: state.draftBeforeHistory,
                        historyIndex: null,
                    };
                }

                return {
                    commandInput: state.commandHistory[nextIndex],
                    historyIndex: nextIndex,
                };
            }),

        bringWindowToFront: (windowId) =>
            set((state) => {
                const windowIndex = state.windows.findIndex(
                    (windowItem) => windowItem.id === windowId,
                );
                if (windowIndex === -1) {
                    return {};
                }

                if (windowIndex === state.windows.length - 1) {
                    return { focusedWindowId: windowId };
                }

                const nextWindows = [...state.windows];
                const [windowItem] = nextWindows.splice(windowIndex, 1);
                nextWindows.push(windowItem);

                return {
                    focusedWindowId: windowId,
                    windows: nextWindows,
                };
            }),
        focusOrOpenWindow: (appId, bounds) => {
            const existingWindow = get().windows.find(
                (windowItem) => windowItem.moduleId === appId,
            );
            if (existingWindow) {
                get().bringWindowToFront(existingWindow.id);
                set({ activeModuleId: appId });
                return "focused";
            }

            set((state) => {
                const windowId = `window-${state.nextWindowNumber}`;
                const nextWindow: OsWindow = {
                    id: windowId,
                    moduleId: appId,
                    frame: getPreferredWindowFrame(appId, bounds, {
                        index: state.windows.length,
                    }),
                };

                return {
                    activeModuleId: appId,
                    focusedWindowId: windowId,
                    nextWindowNumber: state.nextWindowNumber + 1,
                    windows: [...state.windows, nextWindow],
                };
            });

            return "opened";
        },
        closeWindow: (windowId) =>
            set((state) => {
                const nextWindows = state.windows.filter(
                    (windowItem) => windowItem.id !== windowId,
                );
                return {
                    focusedWindowId:
                        nextWindows.length > 0
                            ? (nextWindows[nextWindows.length - 1]?.id ?? null)
                            : null,
                    windows: nextWindows,
                };
            }),
        clearWindows: () => set({ focusedWindowId: null, windows: [] }),
        updateWindowFrame: (windowId, frame, bounds) =>
            set((state) => ({
                windows: state.windows.map((windowItem) =>
                    windowItem.id === windowId
                        ? {
                              ...windowItem,
                              frame: clampWindowFrame(frame, bounds, windowItem.moduleId),
                          }
                        : windowItem,
                ),
            })),
        syncWindowFrames: (bounds) =>
            set((state) => ({
                windows: state.windows.map((windowItem) => ({
                    ...windowItem,
                    frame: clampWindowFrame(windowItem.frame, bounds, windowItem.moduleId),
                })),
            })),

        resetSession: (nextModuleId) =>
            set({
                activeModuleId: nextModuleId,
                commandInput: "",
                draftBeforeHistory: "",
                focusedWindowId: null,
                historyIndex: null,
                transcript: [],
                windows: [],
            }),
    }));
}

export function createOsStore() {
    return createOsStoreState();
}

export const osStore = createOsStore();

export function useOsStore<T>(selector: (state: OsStore) => T) {
    return useStore(osStore, selector);
}
