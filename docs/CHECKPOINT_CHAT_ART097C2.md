# CHECKPOINT — ROGOV ART-097C2 (20 novembre 2026)

**Projet :** ROGOV, dungeon crawler PWA / APK Android, `MAthiks/Rogov-Android`.
**Référence avant chantier :** `main` après UI-098B1 PR #57,
merge `299b410`, puis deux commits de documentation pour le GO Android.
**Branche active :** `art/art097c2-material-silhouette-contrast`.
**Statut :** améliorations graphiques en revue, sans fusion.

## Réalisation

- 6 SVG de sol : centres moins chargés et joints plus lisibles.
- 48 SVG de mur : corniches éclaircies et face sous corniche plus profonde.
- 4 capuches Sprite C : lisibilité interne du bord de capuche
  et du manteau, profil droit toujours miroir du gauche.
- Charognard, Gardien et Larve : micro-accents d'1 pixel sur
  les formes existantes, sans nouvelle entité ou animation.
- PWA et WebView embarquant les mêmes modules ; cache hors ligne révisé.
- Contrat et protocole :
  [ART097C2_MATERIAL_SILHOUETTE_READABILITY.md](ART097C2_MATERIAL_SILHOUETTE_READABILITY.md).

## Tests nouvellement ajoutés

- `tests/art097c2-material-contrast.test.mjs` ajouté au `test:web` :
  54 textures, sept personnages, 24×24, Fog of War,
  rendu déterministe, RNG/sauvegardes inchangés, offline.
- `tests/mobile-browser.test.mjs` : galerie de contrôle
  `qa096-screenshots/art097c2-material-silhouette-gallery.png` à
  résolution Android portrait et contrôle absence de sauvegarde modifiée.
- La CI Web / Chromium / Chrome Android 13 / WebView Android 13 /
  APK historique doit passer avant une éventuelle fusion.

## Règles du projet à conserver

WIP=1, orientation dark fantasy low magic, 11×11 Nhal, Sprite C capuche
4 faces, ennemi/visibilité inchangés, ASCII, sauvegarde `rogov-web-v1`
schéma 1, pavé fixe et tiroirs UI-098B1 valides. Le GDD PC/Godot est
conservé mais le portage est reporté.

**Ne pas attribuer de GO artistique ni de test sur Android physique**
sans retour réel. Après CI, fournir à l'utilisateur la PR et la PWA
de recette ; fusion seulement après validation demandée.
