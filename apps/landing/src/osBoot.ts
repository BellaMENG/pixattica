import { BOOT_STEPS, type TranscriptEntry } from "./osData";
import { preloadOsAppWindow } from "./osAppContent";

type RunBootSequenceOptions = {
    lineIndexStart: number;
    onEntryAdd: (entry: TranscriptEntry) => void;
    onEntryUpdate: (entryId: string, text: string) => void;
    shouldCancel: () => boolean;
};

const BOOT_STEP_DELAY_MS = 220;
const BOOT_TYPING_DELAY_MS = 8;

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

async function renderBootStep(
    step: (typeof BOOT_STEPS)[number],
    entryId: string,
    onEntryUpdate: (entryId: string, text: string) => void,
    shouldCancel: () => boolean,
) {
    if (step.renderMode === "instant") {
        if (!shouldCancel()) {
            onEntryUpdate(entryId, step.text);
        }
        return;
    }

    await typeBootText(entryId, step.text, onEntryUpdate, shouldCancel);
}

function getStepPreloadAppIds(step: (typeof BOOT_STEPS)[number]) {
    if (step.preloadAppIds?.length) {
        return step.preloadAppIds;
    }

    return step.preloadAppId ? [step.preloadAppId] : [];
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
            renderBootStep(step, entryId, onEntryUpdate, shouldCancel),
            Promise.all(getStepPreloadAppIds(step).map((appId) => preloadOsAppWindow(appId))),
        ]);

        await wait(BOOT_STEP_DELAY_MS);
    }
}
