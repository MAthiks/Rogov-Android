# DEV-080 — recette sur Android réel, sans toucher à la v0.7f publique

**Statut :** validation terrain à effectuer sur téléphone physique. Les tests CI et l'émulateur ne remplacent pas ce contrôle.

## Pourquoi une adresse locale ?

La v0.7f publique est hébergée sur GitHub Pages et possède sa propre sauvegarde Chrome. Le prototype DEV-080 reste dans une **branche de GitHub non déployée**. La méthode ci-dessous sert la branche directement sur le téléphone via `http://127.0.0.1:8765/`. Cette origine de stockage est différente de GitHub Pages ; elle n'efface ni ne modifie sa sauvegarde.

**Ne pas tester la branche en remplaçant les fichiers de la v0.7f publique.**

## Préparation (Android 13, téléphone uniquement)

1. Installer **Termux** depuis F-Droid ou les versions officielles du projet Termux. Ne pas utiliser une ancienne version abandonnée du Play Store.
2. Ouvrir Termux et exécuter les commandes ci-dessous **une par une** :

```sh
pkg update
pkg install -y git nodejs python
git clone --depth 1 --branch dev/dev-080-salles-camera https://github.com/MAthiks/Rogov-Android.git rogov-dev080
cd rogov-dev080
node tools/make-icons.mjs
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

3. Laisser Termux ouvert, puis dans **Chrome Android**, ouvrir :

**http://127.0.0.1:8765/**

4. Au premier lancement, laisser Chrome charger les ressources une fois. Ne pas désinstaller le navigateur ou vider ses données entre deux essais.

En cas de nouvelle session Termux, lancer `cd ~/rogov-dev080` puis la commande `python -m http.server 8765 --bind 127.0.0.1 --directory docs`. Pour récupérer de nouveaux commits, arrêter d'abord le serveur (Ctrl+C), puis faire `git pull --ff-only` et `node tools/make-icons.mjs`.

## Séquence de recette physique (deux descentes)

- [ ] La page d'accueil et les commandes restent lisibles en portrait, sans défilement horizontal.
- [ ] Première descente : l'ancienne carte tutoriel apparaît et la boucle combat / retour fonctionne.
- [ ] Après extraction ou Rappel, deuxième descente : réseau de salles, couloirs, portes, caméra 11×11.
- [ ] Parcourir au moins deux salles ; revenir sur ses pas sans perdre la correspondance carte / contrôles.
- [ ] Taper une porte voisine : inspection = **0 tour** ; fermer = **1 tour** ; passage fermé bloqué sans tour gaspillé ; rouvrir = **1 tour**.
- [ ] Passer en mode ASCII : mêmes murs, portes, héros et caméra.
- [ ] Fermer puis rouvrir Chrome (ou actualiser) avec une porte fermée : même position, même porte, mêmes PV, tours et sac.
- [ ] Emprunter une issue ordinaire, ramasser un butin et atteindre E : le butin rejoint le coffre, sans combat obligatoire.
- [ ] Autre descente : Rappel perd le sac et préserve héros / coffre / expérience.
- [ ] Test hors ligne : avec une page contrôlée par le service worker, arrêter le serveur Termux (Ctrl+C), activer le mode avion puis **recharger l'adresse locale dans Chrome** ; titre, carte et sauvegarde doivent rester accessibles. Pour continuer à tester en ligne, désactiver le mode avion et relancer le serveur.

**Si une partie ne s'ouvre plus :** ne pas toucher au bouton Réinitialiser. Noter la dernière action, prendre une capture d'écran, vérifier la présence du serveur Termux et la console. Ne pas supprimer les données de Chrome.

**Bloquants absolus :** perte de sauvegarde, retour impossible, extraction bloquée, crash, décalage des gestes ou de la caméra, hors-ligne impossible après premier chargement. Consigner dans la PR #1 : appareil, version Android/Chrome, étapes exactes et image si disponible.

## Critères de sortie

DEV-080 reste en **PR brouillon** jusqu'à recette terrain réussie sur un téléphone, en plus des validations automatiques. Aucune publication ni fusion implicite. Ne lancer DEV-081 (brouillard de guerre) qu'une fois DEV-080 validé, conformément à WIP=1 et à QA-074.
