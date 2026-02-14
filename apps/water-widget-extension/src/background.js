const SETTINGS_KEY = "waterSettings";
const PROGRESS_KEY = "waterProgress";
const PING_KEY = "waterPing";

const REMINDER_ALARM = "water-reminder";
const SNOOZE_ALARM = "water-snooze";

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

async function ensureTodayProgress() {
    const { [PROGRESS_KEY]: progress } = await getLocal([PROGRESS_KEY]);
    const today = getTodayKey();

    if (!progress || progress.date !== today) {
        await setLocal({ [PROGRESS_KEY]: { date: today, intakeMl: 0 } });
        return { date: today, intakeMl: 0 };
    }

    return {
        date: today,
        intakeMl: Math.max(0, clampInt(progress.intakeMl, 0, 50000, 0)),
    };
}

function createRepeatingAlarm(settings) {
    chrome.alarms.clear(REMINDER_ALARM, () => {
        if (!settings.enabled) return;
        chrome.alarms.create(REMINDER_ALARM, {
            delayInMinutes: settings.reminderMinutes,
            periodInMinutes: settings.reminderMinutes,
        });
    });
}

async function notifyReminder() {
    chrome.notifications.create(`water-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/water-48.png",
        title: "Hydration Reminder",
        message: "Take a few sips of water.",
        priority: 2,
    });

    const { [PING_KEY]: ping } = await getLocal([PING_KEY]);
    const nextCount = clampInt(ping?.count, 0, Number.MAX_SAFE_INTEGER, 0) + 1;

    await setLocal({
        [PING_KEY]: {
            count: nextCount,
            timestamp: Date.now(),
        },
    });
}

chrome.runtime.onInstalled.addListener(async () => {
    const stored = await getLocal([SETTINGS_KEY]);
    const settings = normalizeSettings(stored[SETTINGS_KEY]);

    await setLocal({ [SETTINGS_KEY]: settings });
    await ensureTodayProgress();
    createRepeatingAlarm(settings);
});

chrome.runtime.onStartup.addListener(async () => {
    const stored = await getLocal([SETTINGS_KEY]);
    const settings = normalizeSettings(stored[SETTINGS_KEY]);

    await setLocal({ [SETTINGS_KEY]: settings });
    await ensureTodayProgress();
    createRepeatingAlarm(settings);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (!changes[SETTINGS_KEY]) return;

    const settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    createRepeatingAlarm(settings);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== REMINDER_ALARM && alarm.name !== SNOOZE_ALARM) return;

    const { [SETTINGS_KEY]: rawSettings } = await getLocal([SETTINGS_KEY]);
    const settings = normalizeSettings(rawSettings);
    if (!settings.enabled && alarm.name === REMINDER_ALARM) return;

    await ensureTodayProgress();
    await notifyReminder();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "SNOOZE_REMINDER") {
        const minutes = clampInt(message.minutes, 1, 60, 10);
        chrome.alarms.clear(SNOOZE_ALARM, () => {
            chrome.alarms.create(SNOOZE_ALARM, {
                delayInMinutes: minutes,
            });
            sendResponse({ ok: true });
        });
        return true;
    }

    if (message.type === "TRIGGER_REMINDER_NOW") {
        notifyReminder().then(() => sendResponse({ ok: true }));
        return true;
    }
});
