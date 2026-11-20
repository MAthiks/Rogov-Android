# CHECKPOINT CHAT — GAME-101A (20 novembre 2026)

**Référentiel :** MAthiks/Rogov-Android · base UI/ART-100 fusionnée par PR #60 (`513c187`).
**Lot :** GAME-101A, branche `feature/game-101a-acoustic-scouting`.
**Fonction :** écoute volontaire au pavé tactile et clavier L ; 1 tour, 2 END, indice cardinal approximatif de menace hors vue par propagation acoustique à travers les couloirs/portes. N'invente aucune menace, ne révèle aucune géométrie, et peut devenir périmée après la phase ennemie.

**Invariants :** SVG Sprite C, 11×11, trois étages, pièges, extraction, anciens runs, SCHEMA_VERSION=1 et SAVE_KEY=rogov-web-v1 conservés. Nouveau module autonome `docs/acoustics.js`, styles additionnels, PWA hors ligne mise à jour, tests Node et Chromium portrait.

**À faire :** vérifier les quatre workflows PR et essayer la commande sur Android réel, notamment la lisibilité de l'indice et sa valeur tactique avant GAME-101B.
