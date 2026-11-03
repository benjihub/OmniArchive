# OmniArchive Chrome Extension

The Manifest V3 extension lives separately from the Next.js marketing site in this directory.

## Development

```bash
npm install
npm run dev
```

Load the generated extension from the Vite output in `chrome://extensions` with Developer mode enabled.

## Structure

- `src/background/` — service worker, message routing, and sync orchestration
- `src/content/` — platform detection, extractors, and live DOM observation
- `src/db/` — Dexie database, schemas, and repositories
- `src/sidepanel/` — React side panel UI
- `src/utils/` — shared Markdown and LaTeX helpers

All chat and prompt data is designed to remain local in IndexedDB.
