# ART-097C2 — Lisibilité des matériaux de Nhal et silhouettes Sprite C

**20 novembre 2026 · lot graphique uniquement · branche `art/art097c2-material-silhouette-contrast`**

## Pourquoi

Le dernier jalon UI-098B1 a corrigé sur Android le bas des panneaux Sac/Combat
qui passait sous le pavé de commande, et a été fusionné via la PR #57.
Le présent lot retourne à l'identité dark fantasy / low magic de Nhal,
sans détourner le projet de son dungeon crawler roguelike.

Le problème ciblé est la **hiérarchie visuelle à petite échelle** :
à 24×24 pixels natifs, les joints de pierre, les capuches et les ennemis
ne doivent pas se confondre, particulièrement sur des écrans Android
de largeur 320–393 CSS px.

## Ce qui change exactement

- **Six sols existants** : contraste des dalles intérieures atténué,
  joints supérieurs et latéraux soulignés par une micro-ligne neutre.
  Le sol devient un support de lecture, pas un faux signal d'interaction.
- **48 murs existants** (16 masques × 3 matériaux) : relief de la
  corniche claire et creux du parement séparés par des lignes statiques
  de 1 pixel, quelle que soit la variante.
- **Sprite C, quatre directions** : lecture de la capuche et du volume
  du manteau accentuée **à l'intérieur de la silhouette** ; aucune
  bordure verte, case surlignée, ombre magique ou nouveau modèle.
  La vue droite reste le miroir exact de la vue gauche.
- **Charognard/Gardien/Larve** : ponctuation originale d'un pixel sur
  le bec et l'aile, les épaules/poitrine, et les trois segments
  horizontaux. Les formes, tailles et familles restent reconnaissables.
- **Cache PWA** : numéro de cache renouvelé ; mêmes assets embarqués
  par l'APK WebView via `webapp/`. Pas d'image distante.

Fichiers de production : `docs/terrain-art.js`, `docs/hero-art.js`,
`docs/enemy-art.js`, `docs/sw.js`. L'interface, le pavé, les tiroirs
validés et les commandes ne changent pas.

## Contrats inchangés

- **54 textures terrain, 4 vues du héros et 3 types d'ennemis** :
  pas de nouvelle tuile mécanique ou classe ennemie ;
  `viewBox=24×24`, `shape-rendering=crispEdges`, SVG local uniquement.
- Terrain strictement déterministe à partir du seed déjà enregistré,
  sans consommation de RNG ni modification des coordonnées/murs/portes.
- **Brouillard** : aucune lecture de connexion murale non connue ; aucun
  ennemi, halo, asset ou information de piège ajoutés aux cases cachées.
- **Sauvegarde** : `rogov-web-v1`, schéma `1` ; ni migration ni écriture
  au rendu. La sauvegarde de l'APK de recette PR #57 reste indépendante.
- Aucune animation, `filter`, shader, nouvelle ressource, action
  combat, règle de loot ou modification de l'ASCII.
- APK historique de compatibilité et portage Godot/PC hors périmètre.

## Recette avant fusion

1. `node --check docs/terrain-art.js` et les deux modules personnages ;
   `npm run test:web` doit inclure `tests/art097c2-material-contrast.test.mjs`
   et valider les 54 variantes, la FOV et les sauvegardes.
2. Suite Chromium tactile sur **320×640, 360×780, 393×704** ;
   conserver les tests QA-097 et UI-098B1 ; inspection de la nouvelle
   galerie `art097c2-material-silhouette-gallery.png` dans l'artefact
   `qa096-chromium-portraits`.
3. Workflow `android-web` pour Chrome Android 13 ; `modern-apk`
   pour WebView Android 13 réelle en émulation ; `build` pour la
   compatibilité Kotlin/ASCII.
4. **Téléphone physique** : distinguer à taille de jeu les dalles des
   murs ; reconnaître sans hésitation Sprite C de face/dos/profil,
   les trois ennemis, une Arche/Faille ; aucun panneau recouvert,
   aucun ralentissement sensible, aucune révélation à travers le
   brouillard ; sauvegarde et PWA offline à vérifier.
5. Comparer captures et retours humains, puis seulement autoriser une
   fusion. La campagne 5 testeurs × 2 descentes et le GO artistique
   global restent ouverts.

**Statut au dépôt initial :** en développement sur branche de PR,
tests et recette Android à obtenir ; aucune validation physique
ne doit être déduite de la réussite d'un émulateur.
