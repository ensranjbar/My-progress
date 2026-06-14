# Growth OS

A personal growth and career dashboard built with React + Vite. Tracks daily study hours and mood, a six-track learning plan (Azure AZ-900, Python, AI building, German, work automation, architect thinking), a weekly checklist, progress charts, an AI-generated CV builder, and a coaching chat.

## Tech stack

- React 18
- Vite
- Recharts (charts on the Progress screen)

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

## Build

```bash
npm run build
npm run preview
```

## Notes

- All progress data (logs, checklist, CV) is stored in the browser's `localStorage` — nothing is sent to a server except the CV Builder and Coach features, which call the Anthropic API directly from the browser and require a valid API key/auth setup to work.
