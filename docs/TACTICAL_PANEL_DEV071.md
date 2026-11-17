# ROGOV — DEV-071 : aperçu du panneau tactique (v0.6.2)

**Livré : panneau de sélection et d'observation.** **Non livré : nouvelles attaques/défenses (DEV-072).**

## Fonctionnement

- En descente, chaque ennemi est identifiable dans la bande « Menaces identifiées ». Ces éléments sont de vrais boutons tactiles, accessibles au clavier, aussi en mode ASCII.
- Toucher un ennemi dans la carte graphique le sélectionne également, sans consommer de tour ni modifier les PV. Un contour ivoire indique la cible.
- Touche **C** : passer d'une cible vivante à la suivante (hors formulaire). « Désélectionner » ferme le panneau.
- Le panneau s'ouvre sans changer de scène et indique : nom, famille, PV, distance CONTACT/PROCHE/LOIN, intention probable du **tour suivant**, arme portée et état défensif.
- Les quatre actions (Attaquer, Esquiver, Parer/Bloquer, Reculer) sont des **libellés de prévisualisation non interactifs**, pas des boutons de combat. Le joueur est averti que le moteur v0.6 attaque encore par collision.
- Si un ennemi sélectionné meurt, la cible est supprimée. Les anciennes parties sans cible continuent à fonctionner. L'ID cible est un champ facultatif des sauvegardes de descente.
- Les commandes existantes de déplacement/soin/attente, Rappel et extraction ne sont pas modifiées.
- Les fichiers UI sont versionnés en v0.6.2 et le module de combat est ajouté à la liste de mise en cache PWA.

## Limites et précautions

Ce lot vise la **lisibilité et l'interaction**, pas encore l'équilibrage du combat. Les intentions exposées représentent le comportement actuel (et non le futur pattern v0.7). Les boutons tactiques deviennent actifs seulement dans DEV-072, une fois le moteur de résolution explicite livré et testé.

## Recette manuelle Android

1. Sur Samsung, ouvrir le jeu et une nouvelle descente, sélectionner un Charognard sur la carte. Vérifier qu'aucun tour ni PV n'est consommé.
2. Vérifier le nom, les PV, CONTACT/PROCHE/LOIN, et l'intention ; essayer « Désélectionner ».
3. Basculer en ASCII : sélectionner un Gardien dans la bande « Menaces identifiées ».
4. Vérifier les commandes de mouvement, soin, attente et le journal toujours fonctionnels.
5. Reprendre une partie après fermeture de Chrome : la cible doit être conservée, mais aucun sac ni XP ne doit disparaître.
6. Tester une extraction et un Rappel. Le héros et le coffre doivent survivre à l'échec, le sac doit être perdu.
7. Sur mobile étroit, vérifier l'absence de débordement et la visibilité de la carte ; tester en navigation hors ligne après un premier chargement.

**Critère de validation :** aucune attaque au simple toucher d'une cible, aucune perte de sauvegarde, aucun changement involontaire du moteur v0.6, nouvelles informations compréhensibles.
