# ROGOV — DEV-088 : Décider de continuer ou d'extraire

**Statut : fusionné dans `main` via [PR #9](https://github.com/MAthiks/Rogov-Android/pull/9), commit `beda91b0655db9684f1ab579f789d61aa58061b7`, après DEV-087 le 18 novembre 2026.**
**Publication GitHub Pages : à vérifier indépendamment de la fusion.**

## Intention de gameplay

Nhal doit inciter le joueur à réfléchir au moment opportun pour retourner à Veyr. Le jeu possède déjà la perte du sac lors du Rappel, la sécurisation à l'Arche, les coffres et trois lieux d'exploration facultatifs (DEV-087). DEV-088 ne rajoute **aucune difficulté factice**, aucun ennemi artificiel en fin de partie et aucune fermeture surprise du chemin de retour. Il rend lisibles les conséquences réelles du choix.

## Rapport d'expédition (interface mobile et clavier)

Un volet repliable, gratuit à consulter et accessible durant les descentes profondes, réunit :

- **Dans le sac (exposé) :** nombre réel d'objets transportés, perdus au Rappel.
- **Fragments de cendre exposés :** compteur distinct afin d'aider aux décisions de forge à Veyr.
- **Au coffre de Veyr :** matériel déjà sécurisé qui ne disparaît pas avec l'Égaré.
- **Opportunités connues :** nombre de coffres non récupérés et de lieux spéciaux non exploités **déjà découverts**.
- **Menaces visibles :** seulement les créatures actuellement visibles via le même FOV que le jeu, jamais les monstres hors vision.
- **Retour connu :** uniquement si l'Arche a été découverte et si un chemin existe en passant exclusivement par les cases précédemment observées. Le rapport donne le nombre de cases et de portes fermées sur le tracé ; ce n'est **ni un trajet garanti**, ni un pilotage automatique.
- **Conseil contextuel :** blessures graves, hostiles visibles, Arche non localisée, retour incomplet ou butin précieux exposé. Ce conseil ne connaît aucun danger caché et ne modifie aucune mécanique.

## Garde-fous

1. **Aucun spoiler :** la position de l'Arche, des sites, du butin ou des ennemis non observés n'est pas dévoilée dans le panneau, la carte ASCII ou la minimap.
2. **Itinéraire informatif :** les cases inconnues, murs, failles et pièges **déjà révélés et actifs** sont évités. Une porte ordinaire fermée peut être ouverte manuellement ; les ennemis mobiles, pièges invisibles et changements futurs ne sont pas prédits.
3. **Aucun coût caché :** ouvrir et fermer le volet ne dépense ni tour, ni Endurance, ni RNG. Il ne modifie aucune sauvegarde ; tous ses nombres sont recalculés depuis l'état existant.
4. **Anciennes parties :** pas de champ de sauvegarde supplémentaire. La première descente et les sauvegardes historiques sans exploration ne sont pas affectées.
5. **Compatibilité Android :** le panneau se replie pour ne pas gêner les commandes tactiles et fonctionne hors ligne grâce au nouveau cache PWA.

## Vérification

- Tests unitaires `tests/expedition-report.test.mjs` : inconnues préservées, sorties repérées mais déconnectées de la carte connue, chemin tracé seulement dans les zones explorées, compteurs de butin, persistance et immutabilité.
- Test Chromium tactile ajouté dans `tests/mobile-browser.test.mjs` : affichage au portrait, zéro tour dépensé, absence de spoiler, sauvegarde et rechargement.
- `npm run check:web` et `npm run test:web` doivent rester verts, ainsi que Chrome Android 13 et la compilation APK de compatibilité.
- **Recette physique recommandée après fusion :** se déplacer dans Nhal et vérifier que le rapport ne montre rien hors de la zone découverte, puis retourner à l'Arche avec du butin dans le sac. Les tests automatisés étaient verts avant fusion.

## Dépendance

DEV-088 dépend des salles DEV-087. **Les deux PR sont fusionnées dans l'ordre : DEV-087 (#8), puis DEV-088 (#9).** Les sauvegardes historiques ne sont pas enrichies rétroactivement.
