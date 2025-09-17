# RBQ Exams – GitHub Desktop Guide (Realistic Practice)

**Updated:** 2025-09-17

This package includes **10 exams × 50 questions** with Québec‑specific administration context (RBQ, CCQ, CNESST, AMP, BSDQ, taxes, bonds, holdbacks, etc.).
It’s a static site (HTML/CSS/JS/JSON).

## Deploy with GitHub Desktop

1. Install GitHub Desktop → https://desktop.github.com/
2. Create a public repo `rbq-exams` on GitHub.
3. Clone it in GitHub Desktop.
4. Copy these files into the local repo (make sure `index.html` is at the root and `questions/` folder stays intact).
5. Commit → Push.
6. On GitHub: **Settings → Pages** → Deploy from a branch → Branch: `main`, Folder: `/ (root)` → Save.
7. Open `https://YOUR-USERNAME.github.io/rbq-exams/`

## Edit Questions

- Files: `questions/exam1.json` … `exam10.json`
- Format:
```json
{
  "question": "Text",
  "choices": ["A","B","C","D"],
  "answer": 0
}
```
- Duration is set to **120 minutes** in `script.js`. Change it if needed.

## Notes

- These are **practice** items, not official RBQ questions.
- Keyboard: ← previous, → next.
- Auto‑save every 5s and on page unload. Review mode after submit.
