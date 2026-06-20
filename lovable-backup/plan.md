# Focusdoro — Pomodoro PWA

This is a large scope. I'll build it in one pass but prioritize a polished, working core (timer + tasks + onboarding + settings + analytics) and stub the heavier extras (Lottie lion, full i18n for 6 langs, react-window virtualization, service-worker background sync) with lightweight equivalents that can be upgraded next.

## Stack
- TanStack Start (already the template) + React 19 + TS
- Tailwind v4 (CSS-first) + Framer Motion + Recharts
- Dexie.js for IndexedDB, localStorage for flags/settings
- i18next + react-i18next, 6 locales (EN/ES/FR/DE/JA/PT)
- PWA: manifest + icons (manifest-only home-screen install per Lovable PWA guidance — no app-shell SW in preview; background-safe timer via `Date.now()` + Page Visibility API instead of SW sync)

## Routes
- `/` → onboarding gate: if `onboarded` flag set → redirect `/timer`, else carousel
- `/timer` — circular SVG ring, neumorphic controls, useReducer state machine
- `/tasks` — list + filter tabs + bottom-sheet creator
- `/analytics` — Daily/Weekly/Monthly toggle, bar chart, stat cards
- `/stats` — 12-week heatmap, monthly bars, streaks
- `/settings` — instant-save preferences, language modal

Shared bottom tab nav on `/timer`, `/tasks`, `/analytics`, `/stats`, `/settings`.

## Data (Dexie)
- `sessions { id, type, startedAt, durationSec, completed }`
- `tasks { id, title, category, categoryColor, tags[], subtasks[], priority, emoji, color, recurring, recurDays[], completed, createdAt }`
- Daily session count derived from `sessions` by date.

## Free-tier limit
5 active tasks; 6th attempt opens Pro upsell modal (no payments wired).

## Onboarding
3 full-screen cards with framer-motion slide transitions. Mascot: animated SVG lion (lightweight Lottie alternative — keeps bundle small; can swap to lottie-react later). Skip + Get Started both set `onboarded=true` and route to `/timer`.

## Timer engine
`useReducer` with states `idle|running|paused`; persists `endsAt` (epoch ms) to localStorage so backgrounding/tab-switch resumes accurately. Tick via `setInterval(250ms)` + `visibilitychange` resync. Auto-advances Focus → Short Break (every 4th → Long Break). Increments today's session count in Dexie on completion.

## Tasks
Virtualized via `react-window` (FixedSizeList). Color-coded left border by category. Subtask progress bar = done/total. Bottom-sheet modal with snap points 55%/92% (framer-motion drag), quick-fill chips, priority chips, 8×6 emoji grid, 10-color row, recurring toggle revealing weekday selector, autofocus title.

## Analytics
- Daily: hourly bar chart (0-23) of focus sessions today
- Weekly/Monthly: aggregate by day
- Stat cards: total focus, total break, avg session, session count
- Memoized with `useMemo`, formatted `2h 15m`

## Stats
12-week heatmap (7 rows × 12 cols), color scale `transparent → #EF4444`. Click cell → filtered session list for that day (sheet). Monthly bar chart + streak cards (current, longest, total completions).

## Settings
Instant-save: timer presets (15/25/50), dark mode (system + manual override in localStorage), daily goal stepper, language modal (blue #007AFF border + check on active, auto-detect on first launch, fallback EN).

## i18n
`/locales/{en,es,fr,de,ja,pt}/common.json`. All strings keyed. Persist `lang` in localStorage; no reload.

## PWA
- `public/manifest.webmanifest` with name/short_name/theme/bg/icons/display=standalone
- Apple touch icons + theme-color meta in `__root.tsx`
- No app-shell service worker (Lovable preview safety). Add-to-home-screen works via manifest.
- Background-safe timer doesn't need SW (uses epoch + visibility API).

## Design system
- Neumorphic light + dark mode
- Accent `#007AFF` (iOS blue), focus red `#EF4444`
- Tokens in `src/styles.css` via `@theme inline`
- Font: Inter (system fallback for JA)

## What I'm deferring / simplifying
- **Lottie lion** → animated SVG mascot (no extra deps, same vibe). Easy swap later.
- **Service-worker background sync** → not needed for timer accuracy with the epoch approach; also blocked in Lovable preview.
- **react-window** → included, but list will work without it under 5-task free cap.

Building now.