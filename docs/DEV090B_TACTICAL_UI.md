# ROGOV — DEV-090B : combat tactique contextuel Android

**Statut : développé sur `dev/dev-090b-tactical-combat-ui` ; fusion prévue après réussite CI, à la demande explicite de l'utilisateur.**  
**Dépendance :** [DEV-090A, PR #13](https://github.com/MAthiks/Rogov-Android/pull/13), déjà fusionné. **DEV-089D reste suspendu** pendant la priorité ergonomie.

## Problème corrigé

L'ancienne interface séparait encore les cibles et commandes de combat du terrain et du pavé directionnel par les interactions secondaires. Sur Android, cette organisation exigeait un défilement prolongé en pleine rencontre, surtout avec le rapport, les légendes et les panneaux descriptifs.

## Livraison DEV-090B

- **Dock d'engagement** immédiatement sous le poste de pilotage : carte → déplacement/soins → menaces/cibles/intentions/actions. Il est **masqué sans adversaire visible**, y compris lorsqu'un adversaire existe dans une salle non découverte.
- **Sélection ciblée gratuite** : la carte et les boutons de cibles conservent leur logique, `aria-pressed`, silhouettes et marquage des menaces imminentes ou en garde.
- **Cible compacte** : nom, famille, **jauge de PV**, points de vie textuels, distance CONTACT/PROCHE/LOIN et intention du prochain tour. Le texte est accessible aux lecteurs d'écran ; les couleurs ne sont pas le seul indicateur.
- **Cinq actions dans une grille de deux rangées** en portrait 360 px : Attaquer, Esquiver, Parer, Bloquer, Reculer. Cibles tactiles d'au moins 44 px, état désactivé lié **aux règles existantes** d'endurance, portée et équipement.
- **Contexte immédiatement visible** : la note de portée et l'intention ennemie restent visibles au-dessus des actions. Le détail des probabilités, l'arme et les conseils de combat passent dans un panneau **repliable**.
- Le raccourci « Combat » mène au dock uniquement s'il existe une menace **dans le champ de vision** ; sinon il revient à la carte, **sans action ni tour**.
- **Aucune mécanique ajoutée** : mêmes attaques, défenses, intentions, coûts, cibles et interactions clavier. Mode ASCII, sauvegardes, brouillard et PWA hors ligne conservés.

## Validation et risques

- **Tests Node** existants plus contrôle structurel dédié : hiérarchie de l'écran, absence de fuites des ennemis invisibles, jauge de PV et tous les identifiants de commandes inchangés.
- **Tests Chromium Android 360 px** : hors combat le dock disparaît ; en présence d'un ennemi visible il s'affiche juste après les déplacements ; jauge cohérente, sélection sans tour, actions dans deux rangées, accès au détail sans tour, **esquive réelle consommant un tour**, sauvegarde/rechargement.
- Exécuter séparément **Chrome Android 13 sur émulateur** et compilation **APK historique de compatibilité**. Confirmer aussi sur téléphone physique à la prochaine recette.
- L'absence d'ennemi visible ne dévoile **ni son identité, ni sa position, ni son intention**. Le dock utilise uniquement `explorationState(...)=visible`, sans anticiper le générateur ou les déplacements ennemis.

## Recette sur téléphone après publication

1. Lancer une nouvelle descente profonde, observer la carte et les déplacements. Le dock ne doit pas apparaître sans ennemi visible.
2. Approcher un Charognard : le dock apparaît sous les commandes, avec la cible et ses PV.
3. Sélectionner la cible : **aucun tour dépensé**, intention et distance lisibles. Vérifier l'état de l'attaque selon CONTACT/PROCHE/LOIN.
4. Ouvrir les détails des jets, puis effectuer une esquive et une attaque : **un tour par action valide**.
5. Tester clavier, mode ASCII, récupération après rechargement et extraction.

## Suite de la roadmap

Après cette livraison : **DEV-090C** pour inventaire et interactions tactiles, aides contextuelles, taille des commandes et ergonomie des petits écrans. **DEV-089D** (quatre familles architecturales) reprend ensuite quand les tests d'interface sont satisfaisants.
