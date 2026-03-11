export function getHistoryInlineCompletion(input: string, commandHistory: string[]): string | null {
    const normalizedInput = input.toLowerCase();
    if (!normalizedInput.trim()) {
        return null;
    }

    for (let index = commandHistory.length - 1; index >= 0; index -= 1) {
        const candidate = commandHistory[index];
        if (!candidate) {
            continue;
        }

        const normalizedCandidate = candidate.toLowerCase();
        if (
            normalizedCandidate.startsWith(normalizedInput) &&
            normalizedCandidate.length > normalizedInput.length
        ) {
            return candidate;
        }
    }

    return null;
}
