# GAME-095D3B — Mesurer la pression multi-ennemis en descente

**Objectif :** après D3 (6/6 sorties réussies pour chaque politique scriptée, sans déduire la difficulté humaine), vérifier où et quand plusieurs créatures menacent **réellement** le joueur avant de rééquilibrer Nhal.

## Ce que le lot mesure

L'instrumentation est **hors-jeu** : tools/pressure-audit.mjs est importé par tools/expedition-audit.mjs mais **pas par la PWA**. Sur chaque action du vrai moteur qui consomme un tour (y compris l'action qui termine par un Rappel), prendre un instantané des ennemis réellement **visibles** dans le champ de vision courant, sans exposition des positions mémorisées ou des salles non révélées.

Le modèle distingue :
- Nombre d'ennemis visibles, au CONTACT (une case), dans la bande PROCHE (jusqu'à trois cases), et maximum dans une même action.
- Actions réalisées avec **deux adversaires visibles à PROCHE**, ou deux au CONTACT. La proximité n'est **pas** équivalente à une frappe : la carte, les murs et les intentions peuvent limiter le danger.
- Actions avec une ou plusieurs **attaques annoncées au prochain tour** (mêlée ordinaire, coup lourd Gardien, charge Charognard ou onde Larve), puis sous deux attaques imminentes.
- Perte **nette** de PV pendant ces actions, soins au CONTACT et ouverture/échange de coffres en présence d'une créature PROCHE.
- Répartition sur les **étages 1, 2 et 3**, par politique de l'audit D3 ; les résultats gardent les vraies actions, états, PV, portes, soins, génération de cartes et RNG du moteur existant.

Le calcul des attaques annoncées utilise la fonction déjà partagée par le moteur et l'affichage tactique Android (currentEnemyIntent). La perception utilise visibleCells, conforme au brouillard de guerre. Les métriques d'observation n'entrent **jamais** dans run, meta ni le schéma de sauvegarde.

## Interprétation à ne pas dépasser

**Aucune modification du nombre, des statistiques, de l'IA ni du placement des ennemis dans D3B.** Le laboratoire utilise encore une route calculée sur la géométrie intégrale (connaissance artificiellement supérieure à celle d'un joueur), puis exécute les actions du véritable moteur. Ses deux politiques ne représentent ni les joueurs, ni toutes les stratégies tactiques.

Un ennemi PROCHE n'attaque pas nécessairement ; deux ennemis à portée ne constituent pas automatiquement deux coups. Un tour avec perte nette de PV sous menace est une **corrélation**, pas l'attribution formelle des dégâts à chaque adversaire. Un soin et une attaque ennemie peuvent se compenser en une seule action : le solde net ne représente pas la somme des frappes.

Si la pression groupée est faible, le résultat peut signifier que les trajets optimisés contournent les rencontres, **pas** que les monstres sont trop faibles. Si elle est élevée, mesurer également l'accessibilité des issues et l'évitement avant tout ajout d'obstacles ou de dégâts.

## Contrôles

- tests Node : instantanés à deux ennemis visibles, prévision de deux attaques, mur occultant un ennemi mémorisé, non-mutation, comptage d'un tour réel exactement une fois, reprise sur trois étages.
- Audit reproductible par npm run audit:expeditions ; le rapport version 2 contient pressureByFloor pour chaque essai, et byFloor dans les agrégations des politiques. La CI vérifie six graines, douze expéditions, trois tableaux d'étage et l'égalité tours observés / tours réellement consommés.
- Tests existants navigateur Chromium portrait, Chrome Android 13 et APK restent obligatoires, même si le produit visuel est inchangé.
- Les sauvegardes gardent SCHEMA_VERSION=1 et SAVE_KEY=rogov-web-v1 ; la mécanique d'extraction et les chemins sûrs ne changent pas.
- **Téléphone physique + 5 joueurs × 2 descentes : non réalisés.** Les résultats de simulation ne peuvent pas valider le plaisir, la lisibilité et la difficulté ressentie.

## Décision après les chiffres

Découper ensuite D3C en **un seul changement de gameplay ciblé** si nécessaire : mieux placer une rencontre facultative, améliorer une annonce lisible ou corriger une option tactique dominée, sans augmenter artificiellement PV/dégâts, sans passage de retour obligatoire bloqué, sans augmenter le sac et sans changer de moteur. Comparer avant/après sur graines identiques, puis faire jouer sur Android.
