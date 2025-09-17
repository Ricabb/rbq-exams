# Correctif — Préserver le mode *Apprendre*

**Date : 2025-09-17**

Ce `index.html` met à jour les liens **EN/FR** pour conserver `mode=learn` lors du changement de langue.
- Les liens EN/FR incluent désormais `?lang=..&mode=..`.
- Le sélecteur de mode actualise aussi les liens d’examens et les boutons de langue.
- La préférence `lang` et `mode` est mémorisée dans `localStorage` (`rbq_lang`, `rbq_mode`).

👉 Remplacez simplement votre `index.html` par celui de ce correctif et faites *Commit/Push*.
