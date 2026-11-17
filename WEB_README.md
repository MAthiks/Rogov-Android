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
