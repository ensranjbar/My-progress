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

## Deploying to GitHub Pages (access from phone/laptop)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and publishes it to GitHub Pages on every push to `main`.

One-time setup after merging to `main`:

1. Go to the repo **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).
4. The app will be available at `https://ensranjbar.github.io/My-progress/` — open that URL on your phone or laptop and (optionally) "Add to Home Screen" for an app-like experience.

## Notes

- All progress data (logs, checklist, CV) is stored in the browser's `localStorage` — nothing is sent to a server except the CV Builder and Coach features, which call the Anthropic API directly from the browser and require a valid API key/auth setup to work.
