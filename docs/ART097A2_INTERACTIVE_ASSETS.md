# ART-097A2 — Objets interactifs de Nhal, fidélité et états

**Date :** 20 novembre 2026. **Statut :** branche de développement, fusion à valider.
**Base :** ART-097A1 / PR #48 fusionnée (2ab130a), UI-096D / PR #47 fusionnée.
**Référence :** maquette dark fantasy fournie dans la conversation.

## Objectif

Approcher la maquette en 24×24 sans transformer les cellules en simples images
décoratives : le rendu est toujours choisi par les états réels du moteur. Six
sprites existants reçoivent du relief et des détails à fort contraste :

| Sprites existants | Modification visuelle | Contrat de lecture |
| --- | --- | --- |
| `door_open` | claveaux et seuil en pierre | ouverture vide, passable |
| `door_closed` | ferronneries, rivets, anneau | vantail opaque, bloquant |
| `loot` | angles dorés et serrure | coffre fermé, récupérable |
| `chest_open` | charnières et cavité sombre | coffre déjà ouvert, vide |
| `exit` | pierres sculptées, rune turquoise, seuil lumineux | Arche de sortie réelle |
| `hazard` | branches de fracture et éclats cramoisis | Faille dangereuse, non franchissable comme une Arche |

La Faille demeure cramoisie, contrairement au halo vert de la maquette, pour
éviter une confusion avec la seule Arche turquoise ; couleur **et** silhouette
doivent distinguer les deux. Aucun coffre décoratif, fausse porte, torche
interagissable ou nouvelle mécanique n'est créé. Les autres neuf sprites,
notamment les **quatre états des pièges**, sont conservés à l'identique.

## Changements

- `docs/interaction-art.js` : couches SVG originales légères, uniquement
  geometry/rect/path/circle, sans filtre ou animation ; 15 clés inchangées.
- `tests/art097a2-interactives.test.mjs` : vérifie détails, distinction
  structurelle, même clé vers la carte et légende, absence de ressources
  externes, sauvegarde inchangée et respect du brouillard.
- `docs/sw.js`, `package.json` : nouveaux assets en cache versionné et
  tests dans CI.
- `ROADMAP.md` et checkpoint : progression des lots, dépendances et limites.

## QA avant fusion

- Node, Playwright Chromium portrait (320×640, 360×780, 393×704).
- Chrome Android 13 en émulateur, compilation/signature/installation APK.
- Comparaison visuelle des sprites à taille réelle : 17–30 CSS px/cellule ;
  ne pas promettre que tous les détails d'une maquette >800px sont visibles à
  résolution de jeu.
- À observer humainement : portes ouvertes vs fermées, coffres pleins vs
  vides, Arche vs Faille, pièges révélés vs cachés et brouillard.
- Test physique et cinq joueurs × deux descentes restent nécessaires
  pour une validation artistique globale.

**Invariants :** même `SAVE_KEY`, schéma 1, 15 identifiants, RNG, carte,
visibilité, comportement des portes/coffres, contrôle tactile, offline, ASCII.
Pas de Godot, pas de mécanique supplémentaire.
