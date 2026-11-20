# ART-097C1 — Premières lumières locales de Nhal

**Date :** 20 novembre 2026. **État :** PR de développement ; pas de fusion avant validation.
**Base :** ART-097B2 / PR #53 fusionnée, commit `abdf705`, checkpoint `3fc1150`.
**Référence :** maquette dark fantasy UI/ART-097.

## Audit du moteur

`docs/terrain-art.js` contient six variantes de sol et 16×3 variantes
de murs SVG 24×24, déterministes et sûres vis-à-vis du brouillard.
`docs/interaction-art.js` contient une **Arche turquoise réelle**
et une **Faille cramoisie réelle**, mais **aucune torche persistante**
n'existait en objet de carte.

Le renderer `docs/tiles.js` calcule les cases visibles avec
`hasFog(run)?visibleCells(run):null`, puis distingue les cases visibles,
mémorisées et inconnues. Un nouveau système d'éclairage ne doit jamais
lire une information cachée pour prédire des objets ou colorer une
case inconnue.

## Implémentation graphique fonctionnellement neutre

1. `docs/nhal-lighting.js` :
   - sconce SVG original **24×24** (flamme ambre et applique ferronnée),
     transparent, décoratif uniquement, sans objet/interaction.
   - le mur est choisi par `terrainHash(seed,x,y)%13===0` et doit
     être **visible** avec une case `"." ` voisine également **visible**.
     Les voisins ne sont lus qu'après le garde `visible(nx,ny)`.
   - une source `E` **actuellement visible** donne un éclat turquoise,
     une source `^` **actuellement visible** un accent cramoisi ;
     les planchers adjacents éclairés sont eux aussi visibles.
     Aucune lumière diagonale, à travers un mur ou dans une zone cachée.
   - aucune lecture des ennemis, récompenses, pièges ou secrets.
     Aucun RNG utilisé et aucune modification du monde/sauvegarde.
2. `docs/tiles.js` : six classes de lumière affectées aux **vrais
   éléments de carte** `data-knowledge="visible"`. L'applique est une
   image transparente décorative `aria-hidden`, et **jamais**
   `spriteId="sconce"` ni un élément d'interaction.
3. `docs/art097c1.css` : éclairage local statique par ombre **inset**
   sur une case, sans flou plein écran, overlay qui masque les cases,
   `@keyframes`, filtre GPU ou animation infinie. Image de torch
   avec `pointer-events:none`, style responsive existant intact.
4. `docs/sw.js` et `docs/index.html` : PWA offline, feuille/version
   de cache actualisées ; `package.json` inscrit les nouveaux tests.
5. `tests/art097c1-lighting.test.mjs` : le helper ne lit aucun
   voisin caché (Proxy de mur interdit), priorité des sources,
   sconce stable, SVG 24px, absence de mutation du run.
6. `tests/mobile-browser.test.mjs` : rendu Chromium à 11×11 avec
   torche visible, Arche réelle et Faille réelle, aucun éclairage
   sur cellule mémorisée ou inconnue, aucune modification de
   sauvegarde/tour. Capture `art097c1-visible-lighting.png`.

## Budget et invariants

- Pas de cycle de lumières, particules, shadow DOM, filtres CSS ou
  `requestAnimationFrame`. Le système observe uniquement les
  121 cellules rendues (carte 11×11) et leurs quatre voisines proches.
- Les sprites de terrain, les personnages Sprite C, les 3 ennemis
  et les 15 clés interactives restent inchangés.
- `SAVE_KEY=rogov-web-v1`, `SCHEMA_VERSION=1`, tours, ennemis,
  portée, IA, brouillard, combat, portails, portes, pièges, carte
  générée, mode ASCII, six accès et commandes tactiles inchangés.
- Les torches sont purement décoratives : elles n'élargissent pas la
  portée de vision, ne créent ni chaleur exploitable ni nouveaux
  points de lumière utilisables par la simulation.

## Critères avant fusion

- `test-web` : Node/Chromium portrait 320×640, 360×780, 393×704,
  nouveau fixture de torche réelle, Arche/Faille, fog/no-spoiler.
- `android-web` : Chrome Android 13 en émulateur.
- `build` : compilation, signature, installation et lancement APK.
- Inspection de la capture : les sources et lueurs sont discrètes,
  il n'y a pas d'artefact masquant les icônes, ni contour lumineux
  du PJ, ni changement des cases non révélées.
- QA sur téléphone physique, autonomie/performance, contraste de
  l'écran et campagne de **5 participants × 2 descentes** : ouvertes.

**Étape suivante :** ART-097C2 uniquement si nécessaire, éclairage
plus nuancé selon retour de test, toujours sans mécanique.
