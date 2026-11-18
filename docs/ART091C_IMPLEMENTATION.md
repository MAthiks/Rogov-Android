# ROGOV — ART-091C : interactifs et lieux de Nhal (Sprite C)

**Référence :** [Direction artistique Sprite C v1](ART_DIRECTION_SPRITE_C_V1.md)
**Dépendances :** ART-091A (PJ), ART-091B (ennemis).
**Portée :** pack graphique 24 × 24 ; aucune nouvelle action ou mécanique.

## Contrat visuel

15 sprites originaux SVG transparents de 24 × 24 px, tous dessinés directement pour le pipeline de ROGOV, palette sombre de Nhal et contrastes sémantiques. Un SVG source = un sprite autonome, sans planche ni dépendance réseau.

| IDs existants | Lecture attendue |
|---|---|
| door_open / door_closed | Ouverture **noire** entre jambages en pierre / vantail de **bois opaque** à traverses |
| loot / chest_open | Couvercle scellé, serrure visible / couvercle **relevé** et cavité noire vide |
| trap_clue / trap_revealed | Fissures **discrètes** / pointes et mécanique **exposées** |
| trap_disabled / trap_triggered | Pointes brisées, barre de neutralisation / mécanisme actionné et usé |
| exit / hazard | **Arche** debout au cœur turquoise / **faille mortelle** fracturée rouge, sans arche |
| secret_open | Percée dans un mur fracturé ; aucun sprite secret dissimulé avant la révélation |
| site_atelier / site_echo / site_cache | Marteau et enclume / anneau rituel / niche-reliquaire |
| site_resolved | Marque d'exploration terminée sur lieu épuisé |

**Priorité :** lire l'état en silhouette, sans dépendre uniquement de la couleur. Aucun symbole de coffre ou piège ne doit pouvoir passer pour un ennemi ou le PJ encapuchonné ; le turquoise de l'Arche ne se confond pas avec le foyer de la Larve.

## Implémentation

- Ajout du module docs/interaction-art.js : 15 SVG originaux exportés aussi en INTERACTIVE_SPRITES (data URI précalculées).
- Raccordement des 15 clés historiques dans docs/tiles.js : **aucun changement** aux identifiants des tiles, à la priorité des superpositions, aux bordures UI ni aux légendes.
- docs/sw.js précache le module et change la version de cache. Anciennes sauvegardes : inchangées.
- Aucun changement à game.js, traps.js, secrets.js, room-events.js, deep-dungeon.js, combat.js, enemy-ai.js, au RNG, aux états de pièges ou aux règles de passage/extraction.

## Recette automatisée

1. tests/interaction-art.test.mjs : 15 SVG originaux 24 px, autonomie/offline, paires de silhouette et états, clés rétrocompatibles, ASCII, sauvegardes, priorité de brouillard.
2. tests/mobile-browser.test.mjs (trois nouveaux scénarios) : décodage des 15 images sur viewport Android 360 px sans débordement ; rendu des états à partir de données de donjon valide sans fuite ; interaction réelle sur porte, changement graphique, coût en tour, ASCII et reprise.
3. CI GitHub : npm run check:web, npm run test:web, Playwright Chrome mobile, émulateur Android 13 + APK, déploiement Pages après fusion.

## Réserve de validation humaine

Contrôler sur **téléphone Android physique** la lisibilité de l'Arche vs faille, coffre ouvert/fermé, indices de piège vs piège identifié, lecture de l'atelier/Écho/cache et contraste sur le sol à l'échelle normale. Un test automatisé vert ne valide pas à lui seul le rendu esthétique.

## ART-091D — prochain lot conservé

**PNJ et objets de Veyr / inventaire :** Gardien du refuge (lanterne), Forgeron de reliques (tablier/outils), Érudite de l'Écho (livre) ; fragment de cendre, bandage, tonique, épée usée et cohérence du sac. **Concepts visuels uniquement** pour les PNJ : aucune apparition dans le gameplay, boutique ou dialogue ajouté sans décision explicite.

**WIP = 1 :** ART-091D reste séparé de ce lot.
