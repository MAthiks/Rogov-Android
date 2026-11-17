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

## Audit Alpha 8/10 — protocole QA-074 (17 novembre 2026)

L'audit du moteur et de la boucle figure dans [docs/QA074_ALPHA_8_ASSESSMENT.md](docs/QA074_ALPHA_8_ASSESSMENT.md). Les 129 tests automatisés incluent la répétition de trois descentes avec un trajet sûr vers l'extraction, la conservation des sauvegardes, la télégraphie du Gardien et le Rappel. **La cible 8/10 n'est pas validée.**

Sur Android, réaliser **deux sessions portrait réelles** : lancer le jeu, prendre ou laisser l'épée, se déplacer, provoquer et interrompre le coup lourd du Gardien, s'extraire, fermer puis rouvrir la page, basculer ASCII/graphique, vérifier le mode hors ligne et qu'aucune sauvegarde n'est perdue. Noter tout débordement, texte ambigu ou bouton difficile à toucher.

Faire ensuite tester **cinq personnes, deux descentes chacune sans aide**, en notant : compréhension des intentions, clarté du risque, utilité perçue du butin, frustration/bugs et envie d'une troisième descente. Cible : **au moins quatre sur cinq** veulent rejouer.

## Tests VAR-077 : géographie variable

1. La première descente doit être familière, puis la deuxième doit déplacer murs, dangers, butin, ennemis ou Arche.
2. La troisième descente doit présenter un nouveau choix de parcours et une autre situation autour du butin.
3. Chercher deux trajets de retour depuis une relique vers l'extraction ; aucun ne doit imposer une faille mortelle ou un combat faute d'alternative.
4. Fermer puis rouvrir Chrome en pleine deuxième descente : la carte doit rester identique, tout comme le sac et les PV.
5. Vérifier que les cases en mode graphique et ASCII correspondent et que les attaques de Charognard proches des objets précieux restent annoncées.
6. Signaler tout verrouillage de sortie, récompense trop facile ou détour excessif. Les 8/10 demeurent conditionnés à la validation de vrais joueurs.
