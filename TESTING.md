# ROGOV — Guide de test public v0.2

## Accès

Version web (une fois GitHub Pages activé) :
https://mathiks.github.io/Rogov-Android/

Pour jouer sans site publié, télécharger le fichier HTML autonome et l'ouvrir dans un navigateur. Selon le navigateur Android, une page ouverte depuis un fichier local peut ne pas autoriser les sauvegardes.

Il n'y a **aucun APK à installer**. L'accès au code GitHub est public. Chaque testeur utilise une sauvegarde locale indépendante sur son navigateur/appareil ; aucune progression n'est envoyée au créateur.

## Scénarios de test

1. **Première ouverture** : vérifier que le refuge de Veyr et le coffre sont visibles
2. **Départ équipé** : sélectionner l'épée usée, lancer une descente, observer les tuiles graphiques
3. **Mort et Rappel** : déplacer le héros deux fois vers la droite jusqu'à ^ ; le héros revient à Veyr, avec son XP conservé mais son épée perdue
4. **Butin et extraction** : démarrer une autre descente ; aller en haut, à droite, à droite pour récupérer un fragment ; rejoindre E par le couloir à droite puis en bas ; vérifier le coffre
5. **Mode ASCII** : pendant une descente, passer de « Mode ASCII » à « Mode graphique » ; le héros ne doit ni changer de position ni perdre ses objets
6. **Sauvegarde** : fermer et rouvrir la page ; la progression est conservée si le navigateur autorise le stockage local
7. **Mobile** : vérifier les flèches tactiles et le glissement sur la carte
8. **Hors ligne** : après un premier chargement de la PWA hébergée, tester sans réseau ; ce test ne concerne pas le fichier HTML autonome

## Signaler un bug

Envoie une capture d'écran, le navigateur et sa version, la version Android, les étapes reproduisant le problème, ainsi que le comportement observé et celui attendu.

Les bugs peuvent aussi être publiés dans Issues sur GitHub :
https://github.com/MAthiks/Rogov-Android/issues

Ne pas partager des informations personnelles, captures de documents, codes ou identifiants de connexion.
