# GAME-095B2 — Rencontres et récompenses selon la profondeur

**Objectif :** donner une identité tactique et un intérêt de butin aux étages 2 et 3 de Nhal, sans augmenter artificiellement les PV, dégâts, effectifs ou obstacles, et en conservant l'extraction volontaire.

**Statut :** branche de production, en attente des tests et de la recette Android physique.

## Progression jouable

| Étage | Rencontres | Troisième coffre | Risque / intérêt |
|---|---|---|---|
| 1 / 3 | Composition B1 historique : 2 Charognards, 1 Gardien, 1 Larve de faille | Table A3 originale (70 % équipement / 30 % consommable) | Découverte et préparation |
| 2 / 3 — Résonances de la Faille | 1 Charognard, 1 Gardien, **2 Larves** | **45 % consommables** (Tonique 32, Sels 13), **55 % équipement** (Masse 14, Rondache 14, Cuirasse 17, Plaques 10) | Éviter / contourner des ondes à distance, préserver PV et Endurance |
| 3 / 3 — Veille de pierre | 1 Charognard, **2 Gardiens**, 1 Larve | **15 % Tonique**, **85 % équipement** (Masse 18, Rondache 18, Cuirasse 27, Plaques 22) | Lire la préparation des coups lourds, remporter un équipement durable ou extraire |

Les probabilités sont calculées uniquement sur le **troisième coffre** ; **Fragment de cendre** et **Bandage proche de l'entrée** restent garantis dans chaque étage. Trois coffres au total. Les récompenses sont déterministes pour un numéro d'expédition et une profondeur donnés et sauvegardées avant l'exploration.

**Progression par tactique, non par gonflement de statistiques :** chaque étage conserve **quatre ennemis**, les emplacements de génération, valeurs normales de PV/dégâts, deux routes non secrètes vers l'Arche, les pièges annoncés, le réseau de salles et les risques visibles. L'ennemi de la chambre de butin est remplacé par un archétype existant ; le **Charognard éclaireur du vestibule reste inchangé**. Les deux Larves de l'étage 2 modifient les zones d'exposition à l'onde, les deux Gardiens de l'étage 3 demandent des décisions d'esquive/parade et de recul. Aucun ennemi supplémentaire n'est ajouté et les rencontres restent contournables selon les règles précédentes.

## Lisibilité, risque et extraction

À l'Arche, avant de poursuivre, l'interface Android annonce en termes **généraux** le risque du prochain étage et le type de récompense possible. Elle ne dévoile ni les cases inexplorées, ni les coordonnées des ennemis, ni le contenu exact du coffre. Le joueur peut toujours extraire immédiatement, sans pénalité ; le choix et le changement d'étage ne coûtent aucun tour additionnel.

Les PV, l'Endurance, le sac, les objets équipés, la graine RNG de combat, l'expérience et les tours sont conservés sans guérison magique. Les soins supplémentaires de l'étage 2 sont un **choix de butin probabiliste**, et non une distribution gratuite ni une récompense liée à une élimination obligatoire. Au dernier étage, l'équipement est davantage récompensé, mais la mort déclenche toujours le Rappel et la perte du sac.

## Contrat technique et sauvegarde

- `docs/depth-balance.js` contient `DEPTH_BALANCE_VERSION=1`, deux profils de poids totalisant chacun 100 %, `depthIntel`, `planDepthReward` et `balanceDepthLayout`.
- `resolveFloorExit` applique B2 **seulement lors de la création des étages 2 et 3 d'une nouvelle expédition**. Un ancien niveau B1 sauvegardé ne reçoit **aucune modification rétroactive**, y compris lorsque le joueur reprend sa partie.
- `run.depthBalanceVersion=1` marque facultativement les nouvelles cartes B2, et n'est accepté par `validateSave` qu'aux profondeurs 2 et 3. Les anciennes sauvegardes sans ce champ restent chargées intactes. `SAVE_KEY=rogov-web-v1` et `SCHEMA_VERSION=1` sont inchangés.
- La graine aléatoire des coffres B2 est distincte de `run.rngState`. Une même transition depuis un état identique donne le même butin et les mêmes ennemis, même après rechargement. Le combat reste identique à avant.
- Une nouvelle Larve utilise ses stats et équipement de Larve, un nouveau Gardien ses stats, armure et état initial `ready`. Aucun faux changement de nom de type ne conserve les stats d'un Charognard.
- La nouvelle ressource JS est précachée hors ligne et le cache PWA est renouvelé.

## Critères de recette

- Générer au moins **40 graines × deux étages B2**, sans dégrader la traversabilité ni les chemins sûrs.
- Contrôler **2 000 récompenses déterministes** pour vérifier la diversité, les probabilités de survie et le niveau d'équipement.
- Vérifier dans de véritables états de jeu : chargement de l'ancien étage B1, décision à l'Arche, création B2, reload JSON, inventaire, équipements, ouverture unique du coffre, extraction et Rappel.
- Tester les commandes tactiles et les prévisions de risque sans dévoiler le butin, sur Chromium mobile en portrait et Chrome Android 13 en émulateur ; APK compilé et installation vérifiée.
- **Recette humaine non accomplie :** vrais téléphones Android, appréciation des rencontres, taux de Rappel/extraction, facilité de lire les ondes et attaques lourdes, 5 joueurs × 2 expéditions et observation du caractère intéressant du troisième étage.

**Hors périmètre :** nouveaux ennemis ou classes, compétences, boss, statistiques gonflées avec la profondeur, verrouillage des chemins, modification des anciennes parties. Ces questions appartiennent à GAME-095C/D et devront dépendre des retours réels.
