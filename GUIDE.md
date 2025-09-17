# RBQ Exams — Bilingual (EN/FR) Guide

**Updated:** 2025-09-17

This bundle includes **English and French** interfaces and **10 exams × 50 questions** for each language.

## Language Toggle
- On the home page, click **EN** or **FR** (top right), or add `?lang=en` or `?lang=fr` to the URL.
- Exam pages carry `lang` in the query string, e.g. `exam.html?exam=3&lang=fr`.

## Files
- English exams: `questions/exam1.json` … `questions/exam10.json`
- French exams: `questions_fr/exam1.json` … `questions_fr/exam10.json`
- UI: `index.html`, `exam.html`, `style.css`, `script.js`

## Deploy (GitHub Desktop)
1. Create/clone your repo (e.g., `rbq-exams`).
2. Copy ALL files/folders from this zip into the repo.
3. Commit + Push.
4. Enable **Pages** (Settings → Pages → Deploy from branch → `main` → `/(root)`).
5. Home page: `https://YOUR-USERNAME.github.io/rbq-exams/?lang=en` or `?lang=fr`.

## Notes
- Timer defaults to **120 minutes** per exam.
- Autosave per language/exam (`localStorage` keys include the language).
- These are **practice** items, not official RBQ content.
