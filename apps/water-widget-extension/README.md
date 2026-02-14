# Water Widget Extension

Chrome extension (Manifest V3) that shows a pink pixel-art hydration widget on web pages.

## Build

```bash
yarn workspace @pixattica/water-widget-extension build
```

Then load `apps/water-widget-extension/dist` in `chrome://extensions` with **Developer mode** enabled.

## Features

- Glass-style floating widget on pages (`content.js`)
- Repeating reminders via alarms + notifications (`background.js`)
- Popup controls for goal, interval, sip size, and progress (`popup.html` + `popup.js`)
