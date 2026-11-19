# GAME-095D1 — Laboratoire d'équilibrage Android

**Statut :** audit de référence déterministe (version 2), précédant toute retouche de difficulté ou de butin. **Priorité de production : Android ; le portage PC/Godot demeure différé.**

## Pourquoi mesurer avant de changer

Depuis GAME-095B2 et GAME-095C1/C2, les profondeurs modifient la composition ennemie et le butin. Les coups annoncés, les défenses, le recul et le repoussement donnent des choix, mais la preuve de leur pertinence tactique dépend du coût en PV, tours et Endurance. Les tests de correction précédents n'ont pas mesuré ces compromis.

Ce laboratoire est volontairement **séparé du jeu publié** : aucun script d'analyse ne se charge dans la PWA, aucune sauvegarde n'est modifiée, aucun équilibre ne change sans décision supplémentaire.

## Protocole v2 — reproductible

- **100 descentes** déterministes (`2..101`), **3 étages par descente = 300 plans** par les vrais chemins `beginRun` et `resolveFloorExit`. Les cartes, coffres et ennemis proviennent du moteur actuel : aucun obstacle, coffre ou monstre fictif dans le sondage de génération.
- Vérifier indépendamment la variété des cartes, les itinéraires sûrs vers l'Arche, les deux voies de retour hors pièges, le bandage garanti à l'entrée, trois coffres par étage et la répartition des objets optionnels. La longueur du chemin est **géométrique** : elle n'est pas une estimation du nombre de tours requis pour ouvrir les portes, fouiller ou éviter les adversaires.
- **Quatre emplacements ennemis sur chaque carte**, sans ignorer le second Gardien/Larve des étages profonds. Pour chaque ennemi, créer une scène de **duel isolé sur une case réellement praticable et adjacente**. Les autres créatures sont temporairement écartées pour mesurer cet archétype seul, sans prétendre avoir exploré le donjon.
- Comparer, à **graine identique pour les deux politiques**, (A) attaque immédiate avec attente seulement en cas de manque d'Endurance, (B) esquive de chaque coup lourd de Gardien annoncé et attaque sinon. Chaque scène utilise le **vrai moteur de combat**, son RNG et ses statistiques, mais une graine **d'échantillonnage distincte selon la descente, l'étage et l'ennemi** : il ne s'agit pas d'une continuité de RNG jouée sur trois étages.
- Reporter taux de victoire **en duel synthétique**, Rappels, expiration après 24 tours, PV perdus, Endurance finale, tours nécessaires et attentes. Un joueur humain peut anticiper autrement, interrompre un coup, choisir de finir une cible blessée, combattre plusieurs créatures, utiliser potions et repousser ; **ces politiques ne le font pas**.
- Mesurer la **saturation théorique** : épée de départ + neuf récompenses de coffres sur trois étages = dix objets pour une capacité de huit. Ce nombre ne prouve pas que le sac sera plein en pratique, car les coffres sont facultatifs, les consommables peuvent être utilisés et les objets abandonnés.

## Exécution et garde-fous

```sh
npm run balance:lab
node tools/balance-lab.mjs --count 100 --start 2
node tools/balance-lab.mjs --count=100 --start=2
```

Le workflow de PR `DEV-080 — PR validation` exécute **100 descentes** après les tests moteur, valide obligatoirement le JSON de **300 étages**, puis publie `game095d1-balance-baseline-100` dans les **Artifacts GitHub** pour 21 jours. `set -euo pipefail` empêche qu'un `tee` cache un échec du moteur ou de la ligne de commande.

`tests/game095d1-balance-lab.test.mjs` teste la reproductibilité, la validation des états de jeu, l'absence de mutation des sauvegardes et les deux formes de commande. Les tests Android 13, Chromium portrait et APK restent obligatoires pour confirmer l'absence de régression.

## Hypothèses à examiner après le rapport

1. **Gardiens / défenses :** regarder les blessures et l'Endurance d'une politique d'esquive naïve versus attaque. Un mauvais résultat ne signifie pas que l'esquive est défectueuse : la politique ne cherche jamais le coup fatal ni un déplacement pour interrompre l'attaque. Avant tout changement de dégâts, comparer à une politique tactique plus intelligente et tester sur téléphone.
2. **Sac / extraction :** mesurer la part des joueurs choisissant de quitter l'étage tôt, d'abandonner un objet ou d'utiliser une potion pour libérer de la place. L'impossibilité de tout transporter peut être une **vraie tension roguelike**, pas nécessairement un bug.
3. **Étages :** vérifier l'intérêt effectif de la Larve supplémentaire au deuxième étage et du Gardien supplémentaire au troisième. Le duel isolé ne mesure pas la pression combinée : faire une seconde batterie multi-ennemis avant modification.
4. **Attrition :** évaluer le rythme d'Endurance avec déplacement (+1), attente (+3), attaque (-1), défenses (-2) et repoussement (-3), notamment les situations où attendre devient la seule action viable.

## Décision de production

**GAME-095D1 livre une base de mesure, pas un rééquilibrage déjà validé.** Aucun PV, dégât, équipement, table de butin, nombre d'ennemis, carte, sauvegarde ou commande joueur n'est modifié.

Le lot de tuning **GAME-095D2** devra justifier chaque changement par au moins une comparaison reproductible **et** des retours humains Android, en conservant l'extraction volontaire, les routes non bloquées et les sauvegardes de la version actuelle. Les essais humains sur téléphone physique et la campagne cinq joueurs × deux expéditions restent ouverts.
