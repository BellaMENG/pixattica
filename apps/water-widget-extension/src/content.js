(() => {
    if (window.top !== window) return;

    const SETTINGS_KEY = "waterSettings";
    const PROGRESS_KEY = "waterProgress";
    const PING_KEY = "waterPing";

    const DEFAULT_SETTINGS = {
        enabled: true,
        reminderMinutes: 45,
        dailyGoalMl: 2000,
        sipAmountMl: 250,
    };

    const WIDGET_ID = "pixattica-water-widget";

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
            reminderMinutes: clampInt(
                base.reminderMinutes,
                15,
                240,
                DEFAULT_SETTINGS.reminderMinutes,
            ),
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

    function sendRuntimeMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, () => resolve());
        });
    }

    function createWidget() {
        const existing = document.getElementById(WIDGET_ID);
        if (existing) return existing;

        const host = document.createElement("div");
        host.id = WIDGET_ID;
        host.innerHTML = `
            <div class="pw-header">
                <div class="pw-title">Hydration</div>
                <button class="pw-btn pw-btn-ghost" type="button" data-action="minimize">_</button>
            </div>
            <div class="pw-body">
                <div class="pw-glass-wrap">
                    <div class="pw-glass">
                        <div class="pw-fill" data-node="fill"></div>
                        <div class="pw-highlight"></div>
                    </div>
                    <div class="pw-percentage" data-node="percentage">0%</div>
                </div>
                <div class="pw-copy">
                    <div data-node="intake">0 / 2000 ml</div>
                    <div class="pw-sub" data-node="message">Keep sipping throughout the day.</div>
                </div>
                <div class="pw-actions">
                    <button class="pw-btn" type="button" data-action="sip">+250 ml</button>
                    <button class="pw-btn pw-btn-ghost" type="button" data-action="snooze">Snooze 10m</button>
                </div>
            </div>
        `;

        const style = document.createElement("style");
        style.textContent = `
            #${WIDGET_ID} {
                position: fixed;
                right: 16px;
                bottom: 16px;
                z-index: 8000;
                width: 238px;
                background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(254,205,211,0.62));
                border: 2px solid #ec4899;
                box-shadow: 0 10px 24px rgba(190,24,93,0.26), inset 0 0 0 2px rgba(255,255,255,0.4);
                border-radius: 14px;
                color: #9d174d;
                font: 11px/1.45 "Press Start 2P", "Courier New", monospace;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                letter-spacing: 0.02em;
            }

            #${WIDGET_ID}.pw-minimized .pw-body {
                display: none;
            }

            #${WIDGET_ID}.pw-reminder {
                animation: pw-pulse 0.6s steps(2, end) 0s 3;
            }

            #${WIDGET_ID} .pw-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 10px 8px;
                border-bottom: 1px solid rgba(190,24,93,0.2);
            }

            #${WIDGET_ID} .pw-title {
                color: #be185d;
            }

            #${WIDGET_ID} .pw-body {
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            #${WIDGET_ID} .pw-glass-wrap {
                display: flex;
                align-items: flex-end;
                gap: 10px;
            }

            #${WIDGET_ID} .pw-glass {
                position: relative;
                width: 40px;
                height: 64px;
                border: 2px solid #db2777;
                border-bottom-width: 3px;
                border-radius: 8px 8px 10px 10px;
                overflow: hidden;
                background: rgba(255,255,255,0.5);
            }

            #${WIDGET_ID} .pw-fill {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 0;
                background: linear-gradient(180deg, #f472b6, #ec4899);
                transition: height 0.3s ease;
            }

            #${WIDGET_ID} .pw-highlight {
                position: absolute;
                top: 6px;
                left: 6px;
                width: 8px;
                height: 22px;
                border-radius: 8px;
                background: rgba(255,255,255,0.65);
            }

            #${WIDGET_ID} .pw-copy {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            #${WIDGET_ID} .pw-sub {
                color: #be185d;
                opacity: 0.85;
                font-size: 9px;
            }

            #${WIDGET_ID} .pw-actions {
                display: flex;
                gap: 6px;
            }

            #${WIDGET_ID} .pw-btn {
                appearance: none;
                border: 2px solid #db2777;
                background: #ec4899;
                color: #fff;
                border-radius: 8px;
                padding: 6px 8px;
                font: inherit;
                cursor: pointer;
            }

            #${WIDGET_ID} .pw-btn-ghost {
                background: rgba(255,255,255,0.8);
                color: #9d174d;
            }

            @keyframes pw-pulse {
                0% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
                100% { transform: translateY(0); }
            }
        `;

        document.documentElement.append(style);
        document.body.append(host);
        return host;
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

    function percentage(intakeMl, goalMl) {
        if (goalMl <= 0) return 0;
        return Math.min(Math.round((intakeMl / goalMl) * 100), 100);
    }

    async function init() {
        const widget = createWidget();

        const fillNode = widget.querySelector('[data-node="fill"]');
        const pctNode = widget.querySelector('[data-node="percentage"]');
        const intakeNode = widget.querySelector('[data-node="intake"]');
        const messageNode = widget.querySelector('[data-node="message"]');
        const sipButton = widget.querySelector('[data-action="sip"]');
        const snoozeButton = widget.querySelector('[data-action="snooze"]');
        const minimizeButton = widget.querySelector('[data-action="minimize"]');

        let state = {
            settings: DEFAULT_SETTINGS,
            progress: { date: getTodayKey(), intakeMl: 0 },
        };

        function render() {
            const intakeMl = state.progress.intakeMl;
            const goalMl = state.settings.dailyGoalMl;
            const pct = percentage(intakeMl, goalMl);

            fillNode.style.height = `${pct}%`;
            pctNode.textContent = `${pct}%`;
            intakeNode.textContent = `${intakeMl} / ${goalMl} ml`;
            sipButton.textContent = `+${state.settings.sipAmountMl} ml`;
            widget.style.display = state.settings.enabled ? "block" : "none";

            if (pct >= 100) {
                messageNode.textContent = "Goal hit. Great hydration.";
            } else {
                messageNode.textContent = "Keep sipping throughout the day.";
            }
        }

        async function refreshState() {
            const stored = await getLocal([SETTINGS_KEY, PROGRESS_KEY]);
            const settings = normalizeSettings(stored[SETTINGS_KEY]);
            const progress = normalizeProgress(stored[PROGRESS_KEY]);

            state = { settings, progress };
            await setLocal({ [SETTINGS_KEY]: settings, [PROGRESS_KEY]: progress });
            render();
        }

        async function addSip() {
            const nextIntake = state.progress.intakeMl + state.settings.sipAmountMl;
            state.progress = { date: getTodayKey(), intakeMl: nextIntake };
            await setLocal({ [PROGRESS_KEY]: state.progress });
            render();
        }

        function bumpReminderUi() {
            widget.classList.remove("pw-reminder");
            void widget.offsetWidth;
            widget.classList.add("pw-reminder");
            messageNode.textContent = "Reminder: drink water now.";
            setTimeout(() => {
                render();
            }, 4000);
        }

        sipButton.addEventListener("click", addSip);
        snoozeButton.addEventListener("click", async () => {
            await sendRuntimeMessage({ type: "SNOOZE_REMINDER", minutes: 10 });
            messageNode.textContent = "Snoozed for 10 minutes.";
            setTimeout(() => render(), 2500);
        });

        minimizeButton.addEventListener("click", () => {
            const minimized = widget.classList.toggle("pw-minimized");
            minimizeButton.textContent = minimized ? "+" : "_";
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== "local") return;

            if (changes[SETTINGS_KEY]) {
                state.settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
                render();
            }

            if (changes[PROGRESS_KEY]) {
                state.progress = normalizeProgress(changes[PROGRESS_KEY].newValue);
                render();
            }

            if (changes[PING_KEY]) {
                bumpReminderUi();
            }
        });

        await refreshState();
    }

    init();
})();
