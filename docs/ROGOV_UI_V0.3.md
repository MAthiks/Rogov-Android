# ROGOV Web Alpha v0.3 — UI d'action / Journal

Objectif : inspiration **fonctionnelle** des roguelikes mobiles (sans copie visuelle) : rendre chaque résultat d'action intelligible et lisible sur écran Android.

## Fonctionnalités livrées

- « Dernière action » toujours proche de la carte en descente ; visible au refuge après une extraction ou un Rappel.
- Historique repliable, fermé initialement sur mobile ; 30 événements maximum.
- Catégories explicites : système, action, butin, danger, extraction, Rappel. Combat et soin prévus pour les versions suivantes.
- Numéros de tour des événements, y compris le tour terminal d'extraction et de mort.
- Déplacements ordinaires regroupés pour ne pas saturer l'historique.
- Anciennes sauvegardes avec journaux de chaînes de caractères migrées en mémoire à l'ouverture, sans modifier la clé de sauvegarde ni l'état du personnage.
- Pack graphique v0.2, mode ASCII, déplacement tactile, coffre et règles d'extraction inchangés.

## Architecture

- \`docs/game.js\` : événements structurés, groupement de déplacements, conversion des anciens journaux.
- \`docs/app.js\` : rendu du dernier événement et de l'historique, message transitoire pour les actions impossibles.
- \`docs/index.html\` : journal unique déplacé sous la carte ou dans le refuge.
- \`docs/style.css\` : couleurs associées aux catégories, panneaux accessibles et compacts.
- \`docs/sw.js\` : nouveau cache \`rogov-v0.3.0\`.
- \`tests/web-game.test.mjs\` : tests de non-régression, événements, sauvegardes et tours.
- \`package.json\` : version \`0.3.0\`.

## Critères de réception

Exécuter \`npm run check:web\` et \`npm run test:web\` puis déployer via le workflow GitHub Pages. Sur Chrome Android : vérifier que la dernière action est visible sous la carte, que le journal s'ouvre/se ferme, et que les anciennes parties s'ouvrent sans perdre le matériel sécurisé.

## Suite envisagée — v0.4

Débuter les ennemis, les attaques, les dégâts et les effets dans le même système d'événements. **Ne pas simuler des combats dans la v0.3.**
