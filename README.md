# MIDI Game Event Authoring UI

A React + Vite application for designing the `GAME_EVENTS` MIDI track described in the focused
spec. It provides a form-driven workflow to author beat-aligned gameplay triggers, validate event
payloads, and export/import the resulting Text Meta Event lines.

## Features

- Interactive form for configuring beat positions, event types, and event-specific parameters.
- Live validation against the focused event catalog (color changes, hit windows, camera shakes,
  scripted actions, and more).
- Timeline view that keeps events sorted by beat for quick inspection.
- Project settings panel for tempo, PPQ, track naming, and channel selection.
- Instant preview of encoded `EVT:<TYPE>|param=value` strings plus a one-click MIDI download.
- Import support so existing meta-event lines can be rehydrated into the editor.
- Local persistence keeps work-in-progress charts safe between sessions.

## Getting Started

```bash
npm install
npm run dev
```

The dev server listens on [http://localhost:5173](http://localhost:5173) by default. Pass
`--host 0.0.0.0 --port <port>` to expose it externally, e.g. when running inside a container.

To generate a production build:

```bash
npm run build
```

## Architecture Notes

- Event definitions live in [`src/eventCatalog.ts`](src/eventCatalog.ts). Extending this object adds
  new event types throughout the UI.
- Helper utilities for encoding, validation, and parsing are collected in
  [`src/utils/eventUtils.ts`](src/utils/eventUtils.ts).
- MIDI export helpers in [`src/utils/midiExport.ts`](src/utils/midiExport.ts) build a
  `GAME_EVENTS` track using `@tonejs/midi`.
- Local storage hydration is handled in [`src/utils/storage.ts`](src/utils/storage.ts).
- UI is composed of small, focused components located in [`src/components`](src/components).
