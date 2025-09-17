# RBQ Exams – Deployment & Editing Guide

**Last updated:** 2025-09-17

This site contains **10 exams × 50 questions** for the RBQ *Administration* module.
Features: countdown **timer**, **keyboard navigation** (←/→), **auto‑save** with localStorage, and a **review mode** after submission.

---

## Deploy with GitHub Desktop (Windows/Mac)

1. **Install GitHub Desktop**  
   Download: https://desktop.github.com/ and sign in.

2. **Create a repo on GitHub**  
   https://github.com/new → Name: `rbq-exams` → Public → Create.

3. **Clone it in GitHub Desktop**  
   *File → Clone repository…* → choose `rbq-exams` → select a local folder.

4. **Copy project files**  
   Unzip this archive and copy **all files** into the local repo folder (ensure `index.html` is at the root and the `questions/` folder is intact).

5. **Commit & Push**  
   Add a summary like “Initial site” → **Commit to main** → **Push origin**.

6. **Enable GitHub Pages**  
   On github.com → repo **Settings → Pages** → *Deploy from a branch* → **Branch = main**, **Folder = /(root)** → Save.  
   Open `https://YOUR-USERNAME.github.io/rbq-exams/`

---

## Edit Questions

- Files: `questions/exam1.json` … `questions/exam10.json` (50 questions each).
- Format per question:
```json
{
  "question": "Text",
  "choices": ["A","B","C","D"],
  "answer": 0   // index of the correct choice
}
```
- Change exam duration by editing the default in `script.js` (`90*60` seconds).

---

## Tips

- **Keyboard:** ← previous, → next.
- **Auto‑save:** progress is saved every 5 seconds and on page unload.
- **Retry/Clear:** After submit, use the buttons to restart or clear saved answers.
- **Disclaimer:** Practice content only; verify with current RBQ regulations.
