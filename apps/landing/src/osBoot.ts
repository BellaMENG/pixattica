import { BOOT_STEPS, type TranscriptEntry } from "./osData";
import { preloadOsAppWindow } from "./osAppContent";

type RunBootSequenceOptions = {
    lineIndexStart: number;
    onEntryAdd: (entry: TranscriptEntry) => void;
    onEntryUpdate: (entryId: string, text: string) => void;
    shouldCancel: () => boolean;
};

const BOOT_STEP_DELAY_MS = 220;
const BOOT_TYPING_DELAY_MS = 16;

function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function typeBootText(
    entryId: string,
    text: string,
    onEntryUpdate: (entryId: string, text: string) => void,
    shouldCancel: () => boolean,
) {
    let currentText = "";

    for (const character of text) {
        if (shouldCancel()) {
            return;
        }

        currentText += character;
        onEntryUpdate(entryId, currentText);
        await wait(BOOT_TYPING_DELAY_MS);
    }
}

export async function runBootSequence({
    lineIndexStart,
    onEntryAdd,
    onEntryUpdate,
    shouldCancel,
}: RunBootSequenceOptions) {
    for (const [index, step] of BOOT_STEPS.entries()) {
        if (shouldCancel()) {
            return;
        }

        const entryId = `reboot-${lineIndexStart + index}`;
        onEntryAdd({
            id: entryId,
            kind: "system",
            text: "",
        });

        await Promise.all([
            typeBootText(entryId, step.text, onEntryUpdate, shouldCancel),
            step.preloadAppId ? preloadOsAppWindow(step.preloadAppId) : Promise.resolve(),
        ]);

        await wait(BOOT_STEP_DELAY_MS);
    }
}
