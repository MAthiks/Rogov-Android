# ART-097A1 — Pierre de Nhal, premier lot de la refonte UI/ART-097

**État : fusionnée, PR #48, commit `2ab130a` ; CI Node 367/367, Chromium 53/53, Chrome Android 13 et APK automatisés réussis. Recette artistique physique ouverte.** Date : 20 novembre 2026.
**Base technique :** UI-096D (branche `ui-096d-android-compact-polish`), après QA-096 / PR #46.
**Référence artistique :** maquette haute fidélité transmise dans la conversation. Son image binaire n'est pas incluse dans le dépôt.

## Audit et choix de production

Le moteur actuel rend chaque cellule avec une texture SVG de 24×24 px, choisie
via un hash stable du layout ; six sols, 16 masques de mur × trois patines (54
sprites). La géométrie, la sélection des masques aux voisins **connus** et la
logique des objets visibles se trouvent dans les modules existants.

L'image cible suggère pierre froide épaisse, joints en retrait, lumière rasante
et usure ancienne. Ce lot traite uniquement la **matière du terrain**.
Il ne transpose pas des torches de décor, piliers, portes ou coffres fictifs
depuis l'image dans la carte : ces éléments doivent rester liés à de vrais
états du monde et seront examinés dans des lots dédiés.

## Changements livrés par le code

- `docs/terrain-art.js` : ajout de relief de maçonnerie par pixels,
  joints ombrés et biseaux de dalles ; chaperons de murs plus lisibles,
  joints en retrait et patines sobres. Réutilisation intégrale de la palette
  existante, du hash déterministe et des masques connus seulement.
- `tests/art097a-environment.test.mjs` : 54 SVG distincts, détails
  structuraux, sûreté des ressources inline, absence de fuite via
  les voisins inconnus, non-mutation et contrat de sauvegarde.
- `docs/sw.js` : cache hors ligne versionné pour rafraîchir les textures.
- `package.json` : ajout du test au jeu de tests Web.
- `ROADMAP.md` : statut et séquence des lots UI/ART-097.

## Invariants

Aucun nouveau terrain mécanique, passage, piège, torche, ennemi ou interaction.
Aucun changement de règles, RNG, déplacements, champ visuel, mode ASCII,
`SAVE_KEY=rogov-web-v1` ou `SCHEMA_VERSION=1`. Images inline hors ligne.
Sprite C et capuche quatre directions inchangés. Pas d'ajout de filtre,
d'animation SVG ou de téléchargement de ressources.

## Validation et suite

Avant fusion : `test-web` (inclut syntaxe et Chromium portrait),
`android-web` (Chrome Android 13 en émulateur) et `build` (APK)
verts ; comparer les captures Nhal en 320×640 / 360×780 / 393×704
et vérifier l'absence de détails parasites autour des pièges/portes.
Une validation esthétique sur téléphone physique reste indispensable.

**Séquence proposée, WIP=1 après ce lot :**
ART-097A2 (interactifs réels, jamais fictifs), ART-097B (personnages),
UI-097A (cadres/HUD/dock et densité tactile), ART-097C (ambiance efficace).
Conserver la référence visuelle comme objectif, non comme élément statique.
