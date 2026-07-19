<div align="center">

# Sport Tracker

**A fast, offline-first workout tracker for iOS and Android.**

Log sets in seconds, watch your streak grow, and see real progress —
no account, no cloud, no noise. Your data lives on your device.

<br />

`Expo` · `React Native` · `TypeScript` · `SQLite` · `Zustand`

</div>

---

## Why

Most fitness apps get in the way: sign-ups, subscriptions, sync spinners, cluttered screens. Sport Tracker is built around one idea — **logging a set should take less time than resting between sets.** Everything else (charts, streaks, records) is derived from that data, computed locally, instantly.

## Features

**Frictionless logging**
A stepper-based quick input for reps and weight — no keyboard wrestling mid-workout. Supports drop sets and optional RPE per set. Sessions are tracked live through a lightweight Zustand store, with haptic feedback on every action.

**A dashboard that reads like Apple Fitness**
Activity heatmap over the last months, current training streak, period summaries (sets, volume, sessions), and your most-trained muscle group — each with a trend delta against the previous equivalent period. Declines are shown in neutral tones, never as failures.

**Progress you can actually see**
Per-exercise line charts across three metrics — top weight, estimated 1RM, and total volume — alongside your all-time personal record. Rendered with a custom SVG chart, smooth and dependency-light.

**A curated exercise library**
Ships with the essential compound and isolation lifts grouped by muscle, and lets you add your own custom exercises on top.

**Truly offline**
All data is stored in a local SQLite database (WAL mode, foreign keys, indexed queries). The app works identically on a plane, in a basement gym, or with airplane mode on. Nothing ever leaves your phone.

## Architecture

The codebase follows a thin, layered design — screens never touch SQL directly.

```
src/
├── app/                  File-based routes (expo-router)
│   ├── index.tsx         Active workout session
│   ├── dashboard.tsx     Heatmap, streak, period stats
│   ├── progress.tsx      Per-exercise charts and PRs
│   └── settings.tsx
├── components/           Quick set input, heatmap, line chart, modals
├── db/
│   ├── client.ts         Schema, migrations, seed data
│   └── repositories/     Typed query layer (workouts, sets, exercises, stats)
├── store/                Zustand session state
├── lib/                  Date helpers, grouping utilities
└── theme/                Design tokens (colors, spacing, radius)
```

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| Runtime | Expo SDK 54 · React Native 0.81 | One codebase, native feel |
| Language | TypeScript (strict) | Typed from SQL row to screen |
| Routing | expo-router | File-based, zero config |
| State | Zustand | Session state without ceremony |
| Storage | expo-sqlite (sync API) | Instant reads, no async waterfalls |
| Animation | Reanimated 4 · Gesture Handler | 60 fps interactions |

## Getting started

```bash
npm install

# iOS simulator
npm run ios

# Android emulator
npm run android

# Dev server (Expo Go / dev build)
npm start
```

The database is created and seeded automatically on first launch — there is no setup step.

## Roadmap

- AI-assisted insights: training suggestions and plateau detection built on the local stats layer
- Rest timer integrated into the quick set input
- Workout templates and routine planning
- Data export

## License

MIT
