# ART-106C — Nhal : pierre sculptée, piliers et lumière de proximité

**Projet :** ROGOV, référence visuelle screenshot utilisateur du 22/11/2026  
**Base :** UI/ART-106B fusionnée (PR #77, commit `da8fc92`)  
**Statut :** développé sur branche dédiée, tests et captures à valider

## Objectif

Après la composition du HUD (106A) et les matériaux des panneaux (106B), ce lot améliore **les vraies tuiles de la carte jouable**, conformément à l'objectif dark fantasy/pixel art du screenshot. Il ne remplace pas la grille par une illustration de synthèse.

## Ce qui change dans les assets réellement rendus

- **Sols** : six variantes de pierre taillée 24×24 conservées, avec creux, rainures, bas-reliefs, jointures vieillies, mousse discrète, shale et débris légers. L'art s'ajoute aux six tuiles `TERRAIN_SVGS.floor` existantes.
- **Murs** : seize masques de bordures connues × trois variantes de façades conservés (48 images). Capstones plus épais, saillie sombre et lignes de brique hiérarchisées. Chaque trait de bordure n'utilise **que** le masque `wallEdgeMask()` calculé avec connaissance du brouillard.
- **Piliers autonomes** : lorsque les quatre côtés de mur sont **déjà connus** comme des cellules franchissables (`mask===15`), la tuile reçoit un véritable piédestal et fût de colonne. Cela n'ajoute pas un pilier au donjon et ne change aucune collision.
- **Torches** : nouvelle couronne de fer, braises pixel art et noyau ambré, tout en conservant `SCONCE_SVG` et la règle `visible&&ambience==="sconce"`.
- **Lumière locale** : uniquement sur les classes existantes calculées par `localLightAt` : torche ambrée, Arche cyan et faille plus verte pour correspondre au screenshot. Aucun éclairage extérieur au champ de vision ni à travers les murs.

**Nouveaux fichiers** : `docs/art106c-masonry.js` (couches SVG intégrées dans le moteur de rendu d'origine), `docs/art106c-terrain.css` (éclairage restreint aux cases visibles), `tests/art106c-masonry.test.mjs`.

**Fichiers modifiés** : `terrain-art.js`, `nhal-lighting.js`, `index.html`, `sw.js`, `package.json`, `mobile-browser.test.mjs`.

## Contrats préservés

- `TERRAIN_SVGS.floor.length===6`, `wall.length===16`, chaque mur a trois variantes ; 54 identités différentes.
- Tuiles `24×24`, SVG original embarqué en data URI et utilisable sans réseau.
- `terrainHash()` inchangé ; génération, RNG, inventaire, chemins, brouillard de guerre, IA, tours et stockage `rogov-web-v1` inchangés.
- Aucune illustration supplémentaire dans une case `unknown`; aucune torche sur case mémorisée, cachée ou inconnue.
- Les sprites d'ennemi, le PJ Sprite C et les interactifs ne changent **pas** dans ce lot : ils relèvent d'**ART-106D**.

## Vérification

- [ ] Tests unités 106C et hérités : atlas 54 tuiles, bordures connues uniquement, génération stable, aucune mutation de sauvegarde.
- [ ] Captures Chromium Nhal `qa106c-nhal-360.png`, `qa106c-nhal-412.png`.
- [ ] Aucun débordement horizontal, carte non masquée par D-pad, interactions et onglets intacts.
- [ ] Tests 4/4 sur Web/Chromium, Chrome Android 13, APK classique et WebView moderne.
- [ ] Comparaison manuelle sur téléphone physique avec **le screenshot original**, en notant les écarts (pas d'affirmation de ressemblance parfaite sans constat).

## Suite

**ART-106D** : retravailler Sprite C, Gardien déchu, Charognard, Larve, coffres, failles, Arche, portes et états tactiques, avec la même densité pixel-art et sans cadres colorés autour des personnages.
