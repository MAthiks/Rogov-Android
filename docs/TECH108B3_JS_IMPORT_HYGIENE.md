# TECH-108B3 — Réduction des imports JavaScript inutilisés

**Base immuable :** `main@1e4041868278649aeb9e3e8b233747733c15f88d` — TECH-108B2, PR #93 fusionnée.  
**Statut :** chantier candidat, aucune fusion avant quatre CI vertes sur le HEAD.

## Périmètre

Ce lot suit TECH-108B1 (inventaire des ressources) et TECH-108B2 (cascade CSS). Il nettoie les **imports ES modules nommés** dont les identifiants ne sont jamais référencés ailleurs dans le module importateur. Tous les imports de modules qui étaient nécessaires à l'exécution restent présents. Aucune fonction de gameplay n'est retirée.

| Module | Imports nommés supprimés | Sources préservées |
| --- | --- | --- |
| `docs/app.js` | `visibleCells` | `./exploration-visibility.js` |
| `docs/game.js` | `ENEMY_STATS`, `migrateEnemy` | `./stats.js` |
| `docs/deep-dungeon.js` | `specialRoomPlan` | `./room-events.js` |
| `docs/tiles.js` | `ENEMY_TYPES` | `./game.js` |
| `docs/combat.js` | `enemyAt` | `./game.js` |

Dans `game.js`, deux clauses d'import depuis `./stats.js` étaient présentes. L'import de `EQUIPMENT_CATALOG` est placé dans la première déclaration et la seconde est retirée. L'ordre d'évaluation du module `stats.js` n'est pas modifié : il figurait **déjà au premier import**.

## Mesures

Les cinq fichiers JavaScript sont allégés de **105 caractères ASCII au total**, soit **105 octets UTF-8 supprimés**. Le nombre de liaisons nommées importées sur ces cinq modules passe de **219 à 213**. Le code d'implémentation, les exportations, les tests des règles et les URLs des modules restent inchangés.

Cela n'entraîne **pas** de réduction du nombre de requêtes réseau de la PWA, puisque les modules importés sont les mêmes, ni de gain FPS démontré. Ce changement est une réduction de dette technique et de bruit dans les dépendances, et non une optimisation de performance mesurée.

## Tests de non-régression

Le nouveau test `tests/tech108b3-import-hygiene.test.mjs`, intégré à `npm run test:web`, vérifie sur les cinq modules :
- les imports ES locaux nommés toujours présents ;
- l'absence de déclaration d'import dupliquée vers une même source ;
- la présence de chaque identifiant importé ailleurs dans le fichier (contrôle lexical **statique**, non un analyseur complet JavaScript) ;
- la préservation de `SAVE_KEY = "rogov-web-v1"`, de l'import de `newGame`, des dépendances de `tiles.js` et `combat.js`, et l'unicité de l'import `stats.js`.

Cette analyse lexicale ne remplace pas les tests de gameplay, les contrôles du brouillard et du tour par tour, les tests Android et la reprise hors ligne. Les workflows habituels Web/Chromium, Chrome Android 13, APK classique et WebView moderne doivent tous réussir **sur le même SHA** avant fusion.

**Invariants :** pas de changement d'état sérialisé `rogov-web-v1`, de RNG, de déplacement, de combat, de perception, de textures, de Sprite C, de caméra mobile ou du cache PWA. Aucun asset et aucun fichier ne sont supprimés.

Le suivi des échecs WebView intermittents se poursuit dans l'[issue #91](https://github.com/MAthiks/Rogov-Android/issues/91), à valider sur appareil physique en TECH-108D.
