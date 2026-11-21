# GAME-101G — Reliquaire gardé, combat facultatif et récompense choisie

## Objectif
Proposer un dilemme mécanique réel plutôt qu'une nouvelle ligne de lore : contourner une salle gardée, entrer et prendre le petit butin, ou combattre la Larve de faille existante pour libérer une ressource plus précieuse.

## Règles
- Un reliquaire par **nouvel étage profond**, placé de manière déterministe à 2–4 cases de la Larve de faille `nhal-rift_larva-01`, uniquement sur sol de sa chambre et avec des voies d'aller/retour non bloquées.
- **Éviter** : aucune action ni ressource. Les chemins d'extraction restent ouverts. **Prendre les fournitures** : 1 tour, 0 END, un bandage et +1 XP. **Rompre le sceau** : seulement après la mort de la Larve désignée, 1 tour, 2 END, un Fragment de cendre et +2 XP.
- Le joueur choisit une seule résolution. Les deux options partagent la phase ennemie normale ; elles ne lancent pas de dés, ne soignent pas directement et ne modifient ni l'effectif d'ennemis ni les objets des coffres. Un sac plein, une endurance insuffisante, une cible distante ou cachée, un sceau encore actif et un site déjà vidé refusent l'action **sans tour**.
- SVG original 24×24, symbole ASCII `r`, minimap `r` puis `v`, entrée dans le rapport de terrain seulement après découverte. Aucune silhouette ni position ennemie cachée n'entre dans le DOM.
- `reliquaryPlanVersion=1` et `run.reliquary` persistent uniquement sur les nouveaux étages ; sauvegardes `rogov-web-v1` et version 1 inchangées. Une partie historique ne reçoit aucune rétro-injection.

## Recette
Couverture déterministe multi-graines, 2 retours, physique des distances, combat de Larve, butin sans combat, exclusivité, duplication, prise de temps et END, sac plein, brouillard, reprise JSON, sauvegardes sans marqueur, Chrome Android 13 et APK WebView hors ligne. Essais humains et contrôle graphique sur téléphone physique restent requis.
