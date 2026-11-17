# ROGOV — Nouvelle voie Android : PWA

## Pourquoi ?

Les APK ROGOV ont été bloqués sur un Samsung par Google Play Protect. Le projet propose désormais une **application web progressive (PWA)**. Le jeu se lance dans Chrome sans installer d'APK. L'ajout à l'écran d'accueil est facultatif.

## Jouer

Site prévu : https://mathiks.github.io/Rogov-Android/ (après publication GitHub Pages).

Sur le téléphone : ouvrir l'URL dans Chrome. Pour ajouter l'application à l'écran d'accueil : Chrome → menu ⋮ → « Ajouter à l'écran d'accueil » ou « Installer l'application ».

Le premier chargement nécessite Internet ; une fois le service worker installé, les ressources de base sont accessibles hors ligne. Les sauvegardes sont locales (localStorage) et séparées des données de l'APK.

## Boucle v0.1

- Refuge de Veyr avec coffre permanent.
- Descente ASCII dans Nhal, déplacements tactiles, clavier et glissement.
- Butin et sac limité à huit unités.
- Extraction : récupération de tout l'équipement transporté au refuge.
- Mort par faille : Rappel à Veyr, perte de tout le sac, héros/XP conservés.
- Tests automatisés Node.js.

Les fichiers de l'application web se trouvent dans /docs. Le moteur pur JavaScript se trouve dans docs/game.js, l'interface dans docs/app.js. Le système Android/Kotlin demeure dans /app.

## Hébergement

Le workflow « ROGOV Web — Tests and GitHub Pages » vérifie le moteur, génère les icônes PWA et déploie sur GitHub Pages. Si Pages n'est pas encore autorisé, le propriétaire peut l'activer dans Settings → Pages → Build and deployment → Source = GitHub Actions.

Le code est public ; la licence de réutilisation doit encore être définie. Les créations originales ne sont pas issues d'autres œuvres.

## Pack graphique original v0.2

Six sprites SVG embarqués dans `docs/tiles.js` : sol, mur, héros, butin, danger et sortie. Un bouton bascule entre rendu graphique et ASCII sans changer le moteur, le personnage ou les sauvegardes. Aucun asset sous licence tierce.

Pour envoyer un lien de jeu au testeur, activer GitHub Pages dans **Settings → Pages → Source : GitHub Actions**. L'URL sera `https://mathiks.github.io/Rogov-Android/` une fois le déploiement réussi. Les sauvegardes de chacun restent locales à son navigateur.

## ROGOV v0.4 — graphismes et combats

- Silhouettes améliorées : héros plus contrasté, sol simplifié, murs différenciés.
- Deux ennemis originaux : charognard (rapide, poursuite courte, 3 PV, 1 dégât) et gardien déchu (lourd, stationnaire, 5 PV, 2 dégâts).
- Marche vers un ennemi pour l'attaquer. Le joueur inflige 2 dégâts à mains nues ou 3 avec l'épée usée ; les monstres vivants adjacents contre-attaquent.
- En cliquant sur une case de la carte graphique, afficher une fiche d'identification sans consommer de tour.
- Légende graphique : joueur, charognard, garde, butin, faille et extraction.
- En cas de mort au combat : Rappel et perte de tout le sac, personnage et coffre conservés.
- Chargement des sauvegardes précédentes : les descentes déjà commencées conservent leur carte et leur inventaire, sans ajouter rétroactivement les nouveaux ennemis.
- Compatibilité avec les modes HTML/PWA, ASCII et pixel art.

## Web Alpha v0.5 — Survie tactique

- Bandage consommable en descente : +4 PV, sans dépasser 12 PV.
- Tonique du crépuscule consommable : +6 PV ; il peut être récupéré sur la carte.
- Une utilisation de soin coûte un tour et déclenche la phase ennemie.
- Attendre coûte également un tour et déclenche les ennemis proches.
- Bande de santé et indicateur de hostiles, avec libellés textuels.
- Contrôles tactiles pour l'attente et les soins ; raccourcis clavier Espace / 1 / 2.
- Sauvegarde locale toujours compatible avec v0.4 ; coffre et perte des objets au Rappel inchangés.


## v0.5.1 — Écran titre validé

Un écran d'accueil original et sombre présente ROGOV, l'Arche de Nhal et l'Égaré (sans croix). Les boutons Commencer/Continuer et Nouvelle partie sont fonctionnels. « Continuer » reprend l'état sauvegardé en conservant les règles actuelles et les paramètres d'affichage. « Nouvelle partie » demande confirmation avant d'effacer une progression existante. Un bouton « Retour à l'écran titre » est disponible depuis les options en jeu. La scène a été recadrée à partir de la maquette approuvée et optimisée pour une PWA.
