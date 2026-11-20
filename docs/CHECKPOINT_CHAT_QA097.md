# CHECKPOINT — ROGOV QA-097 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`.
**Base auditée :** `main 87c8fdacfad7113713936b3210f4fb467854dec3`.
**Dernier chantier fusionné :** ART-097C1, PR #54, `1dca3fd`,
GitHub Pages et build APK publiés ; **385/385 Node et 59/59 Chromium**
sur la PR, Chrome Android 13 et APK émulateurs verts.

**Branche QA fusionnée :** `qa/qa097-android-acceptance`, PR #55,
commit `903ec158a97d7b3a3d5dfd413e32cb4d79c6af1f`.
**Statut : GO technique automatisé, NO-GO artistique** ; aucun test
physique ni résultat 5×2 revendiqué.

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
manipulation Android réelle. GO technique constaté après trois CI verts
`test-web`, `android-web`, `build`, mais **NO-GO artistique**
tant que l'ergonomie, l'autonomie/fluidité et les sessions 5×2 ne
sont pas constatées. Les notes provisoires DA **6/10** et Alpha
**7,5/10** ne doivent pas changer sans preuves humaines.

**Suite :** inspecter les artefacts, trier les défauts réels,
corriger un lot UI/ART prioritaire si nécessaire, puis valider avec
l'utilisateur. Le portage PC/Godot reste reporté.

## Résultats automatiques vérifiés — QA-097

- `test-web` : **385/385 Node**, **60/60 Chromium**.
- `android-web` : Chrome Android 13 émulé **succès**.
- `build` : APK émulé **succès**.
- 320×640 : carte 220 CSS px, largeur minimale de touche 47 px,
  médiane/p95 0,9/1,6 ms.
- 360×780 : carte 335,4 CSS px, largeur minimale de touche 52,5 px,
  médiane/p95 0,8/1,6 ms.
- 393×704 : carte 284 CSS px, largeur minimale de touche 57,3 px,
  médiane/p95 0,8/1,5 ms.
- Les 13 centres tactiles touchables à chaque format, hauteur minimale
  44 px ; 44 cases non visibles dans chaque scène, zéro fuite
  de lumière/ennemi, 22 redraws sans modification de save ou tour.
- Artefact `qa096-chromium-portraits` du
  [run 44706385938](https://github.com/MAthiks/Rogov-Android/actions/runs/44706385938).

**Les temps de redraw sont un diagnostic Chromium CI et non des FPS
de l'appareil.** Après ce lot, vérifier le déploiement `main`
indépendamment, demander la recette physique et la campagne 5×2.
Ne pas déclarer un GO artistique à partir de cette CI.
