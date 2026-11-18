# ROGOV — DEV-080 : salles, couloirs, portes et caméra mobile

**Statut : implémenté sur `dev/dev-080-salles-camera`, en revue dans la PR #1.**  
**Version publique : v0.7f inchangée.**  
**Sources de vérité :** [Master Prompt v1.3](ROGOV_MASTER_PROMPT.md), [GDD Exploration v0.8](GDD_EXPLORATION_NHAL_V0.8.md), [VAR-077](VAR077_PROCEDURAL_NHAL.md).

## Portée et livraison par étapes

### Étape 1 — Géométrie isolée (contrôles GitHub validés)

- Nouveau module `deep-dungeon.js` séparé du générateur historique `dungeon.js`.
- Cartes déterministes **44×32** avec **12 salles** rectangulaires de taille variable, corridors et **34 portes ordinaires** initialement ouvertes, réparties sur **17 connexions**.
- Graine par numéro de descente, indépendante des jets de combat.
- Deux parcours topologiquement indépendants du départ et des deux zones de butin vers l'Arche ; une voie reste traversable lorsque les positions initiales des ennemis sont considérées comme bloquées.
- Aucun piège/secret, effondrement, verrou ou raccourci obligatoire généré dans ce lot ; aucune destruction de couloir après entrée.
- Tests sur 240 graines et plusieurs valeurs élevées, déterminisme et refus de structures invalides.

### Étape 2 — Moteur et interface (contrôles GitHub validés)

- Première descente et anciennes sauvegardes actives : **carte v0.7f conservée**, sans génération rétroactive.
- À partir de la deuxième nouvelle descente : utilisation de la nouvelle géométrie, sauvegardée dans `run.map`, `run.rooms`, `run.doors`, `run.loot`, `run.layoutId`.
- `toggleDoor` est une action volontaire de 1 tour ; la simple inspection ne consomme pas de tour, une porte fermée bloque les pas sans coûter de tour. Les portes peuvent se rouvrir dans les deux sens ; une créature sur une porte empêche sa fermeture.
- Fenêtre caméra 11×11 centrée sur l'Égaré (avec limitation aux bords), identique en rendu graphique et ASCII ; les coordonnées des cases graphiques restent celles du monde.
- Contrôles de portes utilisables via sélection tactile, bouton **Choisir porte voisine** pour ASCII, et raccourci **O** (sélection gratuite). La fermeture/ouverture exige la confirmation explicite.
- IA : déplacements ennemis possibles à travers une porte ouverte ; une porte fermée bloque la géométrie et la ligne d'une onde.
- `SCHEMA_VERSION` et `SAVE_KEY` inchangés ; cartes anciennes continuent d'être chargées sans ajout de nouvelles portes.

## Tests vérifiés en CI

Lancer à la racine du dépôt :

```sh
npm run check:web
npm run test:web
```

La validation PR sous Node 22 exécute la syntaxe et **165 tests Node** dont les nouveaux cas DEV-080 : 240 cartes, traversabilité, caméra, portes (y compris un ennemi sur une porte ouverte), sérialisation/réouverture, migration, extraction, géométrie graphique et ASCII. Aucun déploiement GitHub Pages n'est déclenché par ce workflow.

## Renforcement de la recette en navigateur (DEV-080)

Le workflow de PR lance désormais **165 tests Node et 3 scénarios Playwright Chromium**, à une largeur de **360 px** en portrait simulé :

- Sélection **tactile** de porte, fermeture en un tour, inspection gratuite, affichage graphique 11×11 et absence de débordement horizontal.
- Reprise de la porte fermée, sélection et réouverture en mode **ASCII**, sauvegarde des tours et franchissement de la porte.
- Reprise d'une descente v0.7f déjà commencée : carte historique conservée.
- Activation du **service worker**, rechargement d'une descente procédurale **hors ligne** avec ressources préchargées.
- Deux tests Node supplémentaires vérifient la présence de tous les fichiers du cache et le format/dimensions des icônes.

**Défaut corrigé au cours de la recette :** les fichiers PNG d'icônes \`icon-192.png\` et \`icon-512.png\` étaient absents, alors que le manifeste et la liste de préchargement les demandaient. L'échec de \`cache.addAll\` empêchait l'activation hors ligne. Les deux PNG valides ont été créés sur cette branche ; le scénario hors ligne passe désormais en CI.

Ces contrôles Chromium ne valident pas la latence, le tactile, l'installation et l'ergonomie du **Samsung physique**. Le statut de PR reste brouillon et la recette terrain ci-dessous demeure obligatoire.

## Recette Android obligatoire avant fusion

Effectuer sur Samsung en portrait, avec sauvegarde préexistante conservée :

1. Ouvrir la v0.7f publique et vérifier que sa progression est intacte. Utiliser un environnement de test **séparé** pour la branche, sans écraser la sauvegarde principale.
2. Dans la branche, entrer dans une première descente : ancienne carte intacte. Après Rappel/extraction, entrer dans la deuxième : vraies salles et couloirs.
3. Explorer deux salles et revenir sur ses pas ; comparer le cadrage graphique et ASCII, y compris aux bords de la carte, sans défilement horizontal ni touches involontaires.
4. À côté d'une porte, la sélectionner : **0 tour** ; la fermer : **1 tour**, passage bloqué ; la rouvrir : **1 tour**, passage rétabli. Répéter via commandes ASCII/choix d'une porte voisine.
5. Fermer/recharger la page en présence d'une porte fermée : vérifier sa position et son état, le héros, les PV, l'équipement, les tours et le sac.
6. Trouver l'Arche en empruntant un trajet ordinaire. Vérifier une variante avec butin : **extraction sécurise** les objets, tandis que **Rappel perd** uniquement le sac.
7. Après initialisation du cache, refaire la reprise en **mode hors ligne**.

**Bloquants :** toute perte de sauvegarde, porte ou ennemi condamnant le seul retour, extraction inaccessible, caméra désynchronisée avec les contrôles, problème sur Samsung en portrait.

## Limites assumées

- Générateur de réseau rectangulaire **borné**, non un donjon infini. Les familles architecturales complexes, salles irrégulières et équilibrage des ressources sont des extensions futures.
- **DEV-081** (brouillard et mémoire des cases) n'est pas inclus : la fenêtre caméra ne constitue **pas** un brouillard de guerre.
- **DEV-082** (passages secrets), **DEV-083** (pièges), **QA-084** (validation complète) restent à faire, séquentiellement.
- La validation automatisée **ne remplace pas** deux sessions de terrain Android et cinq testeurs × deux descentes.
- Avant la publication officielle, incrémenter le cache PWA, préparer le versionnement et mettre à jour les annonces ; **ne pas annoncer la v0.8 comme publiée** sur la seule base de cette PR.
