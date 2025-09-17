# RBQ Exams — EN/FR with Restart + Save + Saved Exams

**Updated:** 2025-09-17

## What’s new
- **Restart** button (both EN/FR) resets answers, timer, and position.
- **Save** button prompts for a name and stores a snapshot (questions, answers, index, time).
- **Saved Exams** button opens a list to **Open** or **Delete** saved snapshots.
- Works in both languages, and snapshots remember their language.

## How it saves
- Stored in `localStorage` under `rbq_saved_exams_v1`.
- Each snapshot includes: `id`, `name`, `lang`, `examNumber`, `questions`, `answers`, `currentIndex`, `timeLeft`, `savedAt`.

## Loading from Home
- Click **Saved Exams** on the home page to see all snapshots across languages.
- Click **Open** to jump into the exam page and load the snapshot.

## Notes
- Snapshots are browser‑local; they won’t sync across devices.
- LocalStorage size is ~5–10MB depending on the browser; delete old saves if you hit limits.
