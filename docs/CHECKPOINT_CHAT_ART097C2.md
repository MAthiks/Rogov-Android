# CHECKPOINT — ROGOV ART-097C2 (20 novembre 2026)

**Projet :** ROGOV, dungeon crawler PWA / APK Android, `MAthiks/Rogov-Android`.
**Référence avant chantier :** `main` après UI-098B1 PR #57,
merge `299b410`, puis deux commits de documentation pour le GO Android.
**Branche de développement :** `art/art097c2-material-silhouette-contrast`.
**Statut :** **FUSIONNÉ dans `main`, PR #58, le 20 novembre 2026, commit `340aa218f94d044771ee206673d132384444c146`**.
**Décision :** l'utilisateur a autorisé la fusion directe après échec du téléchargement de l'APK de recette. La validation graphique sur téléphone réel reste ouverte.

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
- **CI vérifiée avant fusion : 4/4 workflows réussis**. Node **390/390**,
  Chromium **63/63**, Chrome Android 13, WebView Android 13 et APK historique verts.
  WebView a réussi après relance d'un émulateur qui avait démarré tardivement.
  Galerie de comparaison dans l'artefact `qa096-chromium-portraits` du run `44729877795`.

## Règles du projet à conserver

WIP=1, orientation dark fantasy low magic, 11×11 Nhal, Sprite C capuche
4 faces, ennemi/visibilité inchangés, ASCII, sauvegarde `rogov-web-v1`
schéma 1, pavé fixe et tiroirs UI-098B1 valides. Le GDD PC/Godot est
conservé mais le portage est reporté.

**Ne pas attribuer de GO artistique ni de test sur Android physique**
sans retour réel. Le code est fusionné à la demande de l'utilisateur ;
la recette graphique réelle, la vérification d'une version APK principale
avec ce code et la campagne 5 testeurs × 2 descentes restent ouvertes.
L'APK précédent n'est pas automatiquement mis à jour sur le téléphone par la fusion.
