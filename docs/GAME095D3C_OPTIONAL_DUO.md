# GAME-095D3C — Duos tactiques facultatifs autour du butin

**Décision produit :** transformer les résultats de l’audit D3B (aucune situation avec deux ennemis visibles à PROCHE sur 12 trajets scriptés, six graines) en une **occasion de tactique**, pas en une difficulté obligatoire.

## Objectif jouable

Dans les **étages 2 et 3 nouvellement générés**, la salle d’atelier renfermant le **coffre de récompense optionnelle** peut accueillir deux créatures existantes :

- **Gardien déchu** : annonce un coup lourd au CONTACT, qui peut être esquivé, paré, bloqué ou interrompu en reculant ;
- **Larve de faille** : reste en place et prépare une onde à distance sur un axe rectiligne.

Le duo est un risque de détour **choisi par le joueur**. Les deux créatures ont les statistiques, le comportement et les points de vie historiques ; **aucune créature supplémentaire** n’est créée. Le Gardien quitte son ancien emplacement, la Larve conserve sa position. Le Charognard éclaireur d’entrée, la salle du Fragment de cendre, le Bandage de départ, les autres ennemis et la carte ne changent pas.

Un joueur peut renoncer à cette récompense, contourner la salle, exploiter les annonces ennemies et extraire aux mêmes conditions qu’avant. La récompense elle-même reste inconnue avant l’ouverture du coffre. Les prévisions générales à l’Arche mentionnent le risque d’une rencontre combinée, **sans révéler son emplacement ni le butin exact**.

## Contrat d’implantation

- `docs/optional-duo.js` recherche une position dans l’intérieur de la salle d’atelier **slot 10**, à trois cases maximum du coffre optionnel.
- Seules des cases de sol ordinaires, non occupées par une porte, un monstre, un coffre, une Faille, un piège, un site ou un secret révélé sont envisagées. Les sites de salle et les pièges conservent une séparation de sécurité.
- Il faut qu’une case **réellement accessible pour ouvrir le coffre** permette de voir le Gardien et la Larve, tous deux au plus à trois cases, en respectant les vrais murs et portes. Le simulateur n’invente donc pas une proximité que le joueur ne pourrait jamais observer.
- **Garde-fous :** accès entrée → Arche sans combattre, accès entrée → chaque coffre et coffre → Arche avec tous les ennemis et pièges traités comme obstacles ; deux routes indépendantes de retour hors pièges.
- Placement déterministe, sans tirage supplémentaire sur la graine de combat ou les récompenses. Les candidats sont classés selon la proximité et leurs coordonnées ; si aucun ne passe, la carte B2 originale est conservée intégralement.
- Répartition des ennemis constante : étage 2 = 1 Charognard / 1 Gardien / 2 Larves ; étage 3 = 1 Charognard / 2 Gardiens / 1 Larve. **Le premier étage ne change jamais.**
- Les sauvegardes existantes ne sont pas régénérées. `SCHEMA_VERSION=1` et `SAVE_KEY=rogov-web-v1` sont inchangés, aucun nouvel état à sauvegarder. Le module fait partie du cache PWA et son numéro de cache est incrémenté pour les utilisateurs Android hors ligne.

## Validation automatique et premier constat (19 novembre 2026)

**Statut : PR #41 fusionnée dans `main`.** Tests moteur, 64 cartes profondes échantillonnées dans la recette dédiée (32 numéros d'expédition, étages 2 et 3), Chromium en portrait, Chrome Android 13 après reprise d'un échec du navigateur de l'émulateur, compilation APK et installation en émulateur validés.

Le rapport de la CI `game095d3-expedition-actions-6` compare les **mêmes six graines d'expédition** et les deux politiques scriptées que D3B : les tours avec au moins deux ennemis visibles à PROCHE passent de **0 à 3 en moyenne** pour `exit_only`, et de **0 à 7,5 en moyenne** pour `scavenge`. Pour chaque politique, **5 extractions sur 6** et **1 Rappel sur 6**, contre 6 extractions sur 6 avant D3C. Les dégâts moyens augmentent également ; l'effet recherché existe, mais **l'équilibrage final n'est pas validé**.

Ces trajectoires sont établies avec un **oracle de géométrie** et une stratégie naïve : elles ne constituent ni une fréquence de mort attendue pour un joueur ni une mesure du plaisir de jeu. Avant d'accroître encore la pression, recueillir les retours Android physiques et vérifier notamment qu'un joueur qui veut éviter le coffre facultatif perçoit toujours une voie de fuite claire.

## Validation et limites

Les tests doivent comparer les nouvelles cartes à leurs cartes B2 sources : mêmes salles, couloirs, portes, pièges, sites, coffres, caractéristiques ennemies et effectif. Vérifier la visibilité double **au moment d’approcher le coffre**, la déterminisme des graines, la non-mutation des sauvegardes, les voies de retour et le fonctionnement sur un panel multi-graines. Les contrôles Node, navigateur portrait, Chrome Android 13 et build/install APK doivent tous réussir avant fusion.

Le laboratoire GAME-095D3B doit publier un **nouveau rapport** avant/après sur les **mêmes six graines**. L’effet recherché est la création de situations où deux créatures sont visibles ensemble à PROCHE lors d’une collecte. Une hausse de l’exposition n’est pas automatiquement une amélioration de jeu ; toute évolution de la fréquence de Rappel ou de l’usure des soins doit être considérée séparément.

**Non validé par simulation :** plaisir de jouer, tension juste, compréhension des intentions, qualité des contrôles et réglage réel de difficulté. Les essais sur un téléphone physique Android et les **cinq joueurs × deux expéditions** restent des jalons ouverts.

**Hors périmètre :** boss, nouveau monstre, buffs chiffrés, combat obligatoire, dégradation des sorties, classes/sorts et portage Godot/PC.
