const SETTINGS_KEY = "waterSettings";
const PROGRESS_KEY = "waterProgress";

const DEFAULT_SETTINGS = {
    enabled: true,
    reminderMinutes: 45,
    dailyGoalMl: 2000,
    sipAmountMl: 250,
};

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
}

function normalizeSettings(input) {
    const base = input && typeof input === "object" ? input : {};
    return {
        enabled: Boolean(base.enabled ?? DEFAULT_SETTINGS.enabled),
        reminderMinutes: clampInt(base.reminderMinutes, 15, 240, DEFAULT_SETTINGS.reminderMinutes),
        dailyGoalMl: clampInt(base.dailyGoalMl, 500, 8000, DEFAULT_SETTINGS.dailyGoalMl),
        sipAmountMl: clampInt(base.sipAmountMl, 50, 1000, DEFAULT_SETTINGS.sipAmountMl),
    };
}

function normalizeProgress(progress) {
    const today = getTodayKey();
    if (!progress || progress.date !== today) {
        return { date: today, intakeMl: 0 };
    }
    return {
        date: today,
        intakeMl: Math.max(0, clampInt(progress.intakeMl, 0, 50000, 0)),
    };
}

function getLocal(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items) => resolve(items));
    });
}

function setLocal(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => resolve());
    });
}

function sendRuntimeMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, () => resolve());
    });
}

function percentage(intakeMl, goalMl) {
    if (goalMl <= 0) return 0;
    return Math.min(Math.round((intakeMl / goalMl) * 100), 100);
}

const refs = {
    percent: document.getElementById("percent"),
    progressCopy: document.getElementById("progressCopy"),
    fill: document.getElementById("glassFill"),
    status: document.getElementById("status"),
    enabled: document.getElementById("enabled"),
    reminderMinutes: document.getElementById("reminderMinutes"),
    dailyGoalMl: document.getElementById("dailyGoalMl"),
    sipAmountMl: document.getElementById("sipAmountMl"),
    drinkBtn: document.getElementById("drinkBtn"),
    resetBtn: document.getElementById("resetBtn"),
    saveBtn: document.getElementById("saveBtn"),
    remindNow: document.getElementById("remindNow"),
};

let settings = { ...DEFAULT_SETTINGS };
let progress = { date: getTodayKey(), intakeMl: 0 };

function render() {
    const pct = percentage(progress.intakeMl, settings.dailyGoalMl);

    refs.percent.textContent = `${pct}%`;
    refs.progressCopy.textContent = `${progress.intakeMl} / ${settings.dailyGoalMl} ml`;
    refs.fill.style.height = `${pct}%`;
    refs.drinkBtn.textContent = `+${settings.sipAmountMl} ml`;

    refs.enabled.checked = settings.enabled;
    refs.reminderMinutes.value = String(settings.reminderMinutes);
    refs.dailyGoalMl.value = String(settings.dailyGoalMl);
    refs.sipAmountMl.value = String(settings.sipAmountMl);
}

function setStatus(text) {
    refs.status.textContent = text;
}

async function loadState() {
    const stored = await getLocal([SETTINGS_KEY, PROGRESS_KEY]);
    settings = normalizeSettings(stored[SETTINGS_KEY]);
    progress = normalizeProgress(stored[PROGRESS_KEY]);

    await setLocal({
        [SETTINGS_KEY]: settings,
        [PROGRESS_KEY]: progress,
    });

    render();
}

async function saveSettings() {
    settings = normalizeSettings({
        enabled: refs.enabled.checked,
        reminderMinutes: refs.reminderMinutes.value,
        dailyGoalMl: refs.dailyGoalMl.value,
        sipAmountMl: refs.sipAmountMl.value,
    });

    await setLocal({ [SETTINGS_KEY]: settings });
    render();
    setStatus("Saved");
}

async function addSip() {
    progress = {
        date: getTodayKey(),
        intakeMl: progress.intakeMl + settings.sipAmountMl,
    };

    await setLocal({ [PROGRESS_KEY]: progress });
    render();
    setStatus("Logged");
}

async function resetProgress() {
    progress = { date: getTodayKey(), intakeMl: 0 };
    await setLocal({ [PROGRESS_KEY]: progress });
    render();
    setStatus("Reset");
}

refs.saveBtn.addEventListener("click", saveSettings);
refs.drinkBtn.addEventListener("click", addSip);
refs.resetBtn.addEventListener("click", resetProgress);
refs.remindNow.addEventListener("click", async () => {
    await sendRuntimeMessage({ type: "TRIGGER_REMINDER_NOW" });
    setStatus("Reminder sent");
});

loadState().then(() => setStatus("Ready"));
