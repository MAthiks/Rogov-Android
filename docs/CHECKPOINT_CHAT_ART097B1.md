# CHECKPOINT — ROGOV ART-097B1 : Personnages (20 novembre 2026)

**Repo** `MAthiks/Rogov-Android`.
**Dernier merge confirmé** UI-097A2 / PR #51 (`38323e4`), checkpoint
`569d601`, GitHub Pages et APK publiés.
**Lot en développement** ART-097B1 sur
`feature/art097b1-character-silhouette-polish`.

## Objectif

Accroître le relief matériel à 24×24 sans changer les 4 orientations
du PJ (capuche Sprite C) ni les 3 identités ennemies (Charognard
horizontal asymétrique, Gardien large en pierre/masse, Larve segmentée).
L'image de maquette UI/ART-097 reste le cap artistique.

## Diff en cours

`docs/hero-art.js` : semelles, manteau, attache, harnais, bord de capuche.
`docs/enemy-art.js` : barbes/plumage, armures fendues, chitinisation.
`tests/art097b1-character-polish.test.mjs` et galerie navigateur
`qa096-screenshots/art097b1-seven-character-views.png`.
`docs/sw.js` cache PWA versionné ; `package.json` inclus.

Mêmes identifiants de sprites et d'entités, même composition de la carte 11×11,
pas de nouveaux états ni de save fields, SVG transparent 24×24, FOV/ASCII,
gameplay et vraie interface Android inchangés.

## Gates et suite

Valider `test-web`, `android-web`, `build`, galerie et captures avant fusion.
**Aucun Android physique ou test 5×2 revendiqué**. Après ART-097B1 :
évaluer animations ART-097B2 ou ART-097C lumières selon performance.
Voir [contrat](ART097B1_CHARACTER_FIDELITY.md), [roadmap](../ROADMAP.md).
