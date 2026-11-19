# ROGOV — GAME-095A3/A4 · Recette du butin et équilibrage

**Périmètre livré en branche :** A3 (récompenses réelles en coffre) et premier socle A4 (tests déterministes + équilibre minimum). Le protocole de recette sur appareil physique reste **ouvert** ; aucun retour humain n'est simulé.

## Principes de gameplay

- La première descente garde la carte et son butin d'introduction, inchangés.
- Chaque **nouvelle descente profonde** propose trois coffres, dont deux garantis : **Fragment de cendre** et **Bandage**. La troisième récompense est variable, définie à la génération, puis sauvegardée dans `run.loot`.
- Sous la sélection de troisième coffre : **70 % équipement**, **30 % consommable**. Équipements : Dague d'ossement (30 % de la famille), Masse ferrée (20 %), Rondache usée (20 %), Cuirasse de récupération (20 %), Plaques disjointes (10 %). Consommables : Tonique du crépuscule et Sels de vigueur (50/50 de la famille).
- La Lame cendrée reste exclusivement forgeable à Veyr ; les anciens Bandages et Fragments ne sont pas retirés du jeu. **Aucun tirage en ouvrant un coffre** : le butin est fixe dans chaque partie déjà commencée.
- `lootPlanVersion: 1` est ajouté uniquement aux nouvelles descentes profondes et sauvegardé dans le run. En son absence, la validation historique reste appliquée aux anciennes sauvegardes. Aucune migration destructive.
- Le RNG de combat `run.rngState`, les portes, les salles, les pièges, les secrets et les voies d'extraction sont indépendants des nouveaux tirages de butin.
- Le sac reste limité à 8 unités, avec abandon volontaire à coût de tour ; le Rappel détruit ce qui est transporté, l'extraction sécurise tout au coffre.
- Sprite C et mode ASCII restent les deux présentations ; aucun objet ne révèle son identité derrière le brouillard de guerre.

## GAME-095A4 — filet de sécurité automatisé

**Critères chiffrés / automatisés, pas une note de plaisir de jeu :**

1. **80 graines de donjon** : layout complet, validation, trois coffres, ressources garanties, troisième objet connu, invariants de retour et géométrie.
2. **4 000 tirages déterministes** : distribution 62–78 % d'équipements, sept identifiants potentiels représentés, deux consommables présents, rareté des plaques observable.
3. **Coffre réel** : ouverture à proximité, +1 tour, +1 objet, pas de duplication après sauvegarde/rechargement, transfert à l'extraction ou perte au Rappel.
4. **Sauvegarde héritée** : un `run.loot` au format historique, sans `lootPlanVersion`, reste validable et non régénéré. Un contenu falsifié ou une version inconnue est refusé.
5. **Combat** : un coup physique réussi conserve un plancher de **1 PV** après armure passive. Esquive, parade et blocage actif peuvent encore annuler des dégâts ; les attaques de faille utilisent leur résistance distincte. Ce réglage évite l'immunité totale aux Charognards avec la cuirasse.
6. **Android** : scénario tactile Chromium (ouvrir un nouveau coffre, vérifier le sac puis recharger), tests Chrome Android 13 sur émulateur, compilation / installation APK et PWA hors ligne (notamment `loot.js` au précache).

## Recette physique Android — à remplir avec un vrai joueur

| Contrôle | Statut | Notes |
|---|---|---|
| Sauvegarde ancienne v0.7f ou NAR-094 reprise sans changement de coffre | Non testé physiquement | Conserver une sauvegarde avant mise à jour |
| Descente de tutoriel : mêmes récompenses | Non testé physiquement | |
| Deuxième descente : deux ressources garanties + récompense surprise | Non testé physiquement | |
| Le troisième coffre est visible et ouvrable sur écran 320–393 px | Non testé physiquement | |
| Équipement obtenu : choix, échange en un tour, statistiques et effets | Non testé physiquement | |
| Sac plein : refus d'ouverture, abandon confirmé, retour au coffre | Non testé physiquement | |
| Rappel et extraction : perte et sécurisation sans duplication | Non testé physiquement | |
| Mode ASCII, hors ligne, reprise après fermeture | Non testé physiquement | |
| Deux descentes : envie réelle de recommencer ? | Non testé physiquement | |

**Critères humains de sortie A4 :** viser cinq joueurs distincts × deux descentes, selon `QA092_PLAYTEST_PROTOCOL.md`, au moins 4/5 prêts à rejouer, aucun P0, gestes essentiels accessibles sur appareil réel. Tant que ce protocole n'est pas rempli, **A4 n'est pas homologué**, même si toutes les CI sont vertes.

## Étapes après A4

- **GAME-095B** : étages successifs, difficulté / récompenses croissantes, choix de remonter ou de poursuivre ; étude GDD et compatibilité des sauvegardes avant tout changement.
- **GAME-095C** : archétypes ennemis, synergies équipement/terrain, sans inflation du catalogue.
- **GAME-095D** : équilibrage complet des descentes multi-étages, répétitions et sessions Android humaines.
