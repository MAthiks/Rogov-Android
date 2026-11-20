# CHECKPOINT — ROGOV ART-097B1 : Personnages (20 novembre 2026)

**Repo** `MAthiks/Rogov-Android`.
**Dernier merge confirmé : ART-097B1 / PR #52**, commit `58e981aa3617adae0cc665c4794a581bc9b9bcb5`.
**Précédent :** UI-097A2 / PR #51 (`38323e4`), checkpoint `569d601`.
**Branche de production :** `feature/art097b1-character-silhouette-polish`, fusionnée.

## Objectif

Accroître le relief matériel à 24×24 sans changer les 4 orientations
du PJ (capuche Sprite C) ni les 3 identités ennemies (Charognard
horizontal asymétrique, Gardien large en pierre/masse, Larve segmentée).
L'image de maquette UI/ART-097 reste le cap artistique.

## Diff livré

`docs/hero-art.js` : semelles, manteau, attache, harnais, bord de capuche.
`docs/enemy-art.js` : barbes/plumage, armures fendues, chitinisation.
`tests/art097b1-character-polish.test.mjs` et galerie navigateur
`qa096-screenshots/art097b1-seven-character-views.png`.
`docs/sw.js` cache PWA versionné ; `package.json` inclus.

Mêmes identifiants de sprites et d'entités, même composition de la carte 11×11,
pas de nouveaux états ni de save fields, SVG transparent 24×24, FOV/ASCII,
gameplay et vraie interface Android inchangés.

## Gates et suite

**Validé :** `test-web` 378/378 Node et 57/57 Chromium, `android-web` Chrome Android 13,
`build` APK émulé verts. Galerie de 7 sprites et captures 320×640,
360×780, 393×704 inspectées.
**Aucun Android physique ou test 5×2 revendiqué**. Après ART-097B1 :
évaluer animations ART-097B2 ou ART-097C lumières selon performance.
Voir [contrat](ART097B1_CHARACTER_FIDELITY.md), [roadmap](../ROADMAP.md).

## Reprise

La PR #52 est fusionnée et les sprites sont intégrés à `main`.
Les workflows de publication de `main` sont à contrôler indépendamment.
Prochaine priorité possible : **ART-097B2** animations légères avec
budget Android déterministe, ou **ART-097C** éclairages sobrement
couplés au brouillard. Préserver Sprite C et les sauvegardes.
