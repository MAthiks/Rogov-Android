# ROGOV Android — v0.1.2 (test d'installation)

Extraction roguelike ASCII en Kotlin. Le héros retourne au refuge après la mort, mais perd ses possessions transportées.

## Installer la version diagnostic

L'APK de cette version utilise volontairement l'identifiant `com.rogov.android.installtest` et le label **ROGOV TEST**, pour éviter un conflit de signature avec une éventuelle installation précédente. Il est indépendant du futur package de production `com.rogov.android` et ne touche pas à ses données.

Aller dans GitHub → Actions → Android APK — ROGOV → dernière exécution réussie → artifact `ROGOV-0.1.2-install-tested-apk`. Décompresser l'archive ZIP et ouvrir le vrai fichier `app-debug.apk` depuis le gestionnaire de fichiers Android.

Le build compile, teste et vérifie la signature, puis tente une installation et un lancement sur émulateur Android 13 avant publication de l'artifact.

Les sources et JSON sont organisés dans `app/src/main/`. Le moteur de jeu n'importe aucune bibliothèque Android.

Ce dépôt public ne contient aucune ressource graphique ou audio copiée d'un autre jeu. La licence du code devra être choisie explicitement avant une diffusion open source.
