# CHECKPOINT — ROGOV QA-097 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`.
**Base auditée :** `main 87c8fdacfad7113713936b3210f4fb467854dec3`.
**Dernier chantier fusionné :** ART-097C1, PR #54, `1dca3fd`,
GitHub Pages et build APK publiés ; **385/385 Node et 59/59 Chromium**
sur la PR, Chrome Android 13 et APK émulateurs verts.

**Branche QA en cours :** `qa/qa097-android-acceptance`.
**Statut :** revue automatisée et recette de terrain en cours ;
**aucun test physique ni 5×2 résultats revendiqués**.

## Lot QA-097

- Pas de changement de gameplay, graphismes, moteur, cache PWA,
  sauvegardes ou sources HTML/CSS/JS du jeu.
- `tests/mobile-browser.test.mjs` : trois portraits Chromium
  320×640 / 360×780 / 393×704 avec 13 centres de touches **réellement**
  ciblables par `elementFromPoint`, ≥44×44 CSS px, carte 11×11 sans
  occlusion, brouillard et effets visuels sans fuite.
- 22 rendus de carte réels par format : médiane/p95/max mesurés
  uniquement à titre diagnostique. Vérification save et numéro
  de tour immuables, une seule silhouette PJ.
- Livrables : `qa096-screenshots/qa097-report.json` et captures
  `qa097-nhal-WxH.png` depuis GitHub Actions.
- `docs/QA097_ANDROID_ACCEPTANCE.md` : recette technique et physique,
  critères de GO/NO-GO P0/P1/P2.
- `docs/QA097_FIELD_REPORT_TEMPLATE.md` : fiche à compléter sur vrai
  téléphone et par 5 participants × 2 descentes.

## Décision du studio

Aucun score nouveau ni « qualité commerciale » attestée avant
manipulation Android réelle. GO technique possible après trois CI verts
`test-web`, `android-web`, `build`, mais **NO-GO artistique**
tant que l'ergonomie, l'autonomie/fluidité et les sessions 5×2 ne
sont pas constatées. Les notes provisoires DA **6/10** et Alpha
**7,5/10** ne doivent pas changer sans preuves humaines.

**Suite :** inspecter les artefacts, trier les défauts réels,
corriger un lot UI/ART prioritaire si nécessaire, puis valider avec
l'utilisateur. Le portage PC/Godot reste reporté.
