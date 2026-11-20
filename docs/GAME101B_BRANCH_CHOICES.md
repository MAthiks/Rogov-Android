# GAME-101B — Bifurcations à enjeux (20 novembre 2026)

## Décision de design
Deux voies réelles, déjà connectées à l'extraction, présentent des intérêts différents. L'une suggère le ravitaillement, l'autre une récompense gardée. La carte, les ennemis et les pièges conservent leur fonctionnement au tour par tour : aucune sélection de dialogue ne téléporte ou ne ferme les couloirs.

## Fonctionnement
- **Vers l'est :** anciennes marques d'outils, atelier abandonné (slot 10). Ravitaillement sans coût en Endurance sur ses interactions habituelles, avec une vraie phase ennemie par tour.
- **Vers le nord :** entailles profondes, chambre où se trouve le Gardien déchu (slot 4), et cache oubliée. Une option supplémentaire, **forcer le sceau**, coûte **1 tour et 3 END**, expose à la réaction ennemie, et procure **une rondache usée et 2 XP**. Les deux autres options de la cache restent disponibles, exclusives entre elles.
- Ces avertissements locaux ne nomment **jamais** un ennemi caché, ne dévoilent pas la carte inconnue ou le contenu exact des coffres. Ils se lisent en inspectant une porte visible, sans tour dépensé. L'avertissement condensé n'apparaît au vestibule que lorsque les deux issues sont effectivement visibles.
- La nouvelle position de la cache et le nouveau choix de rondache ne concernent que les cartes générées avec `branchPlanVersion=1`. Les anciennes descentes actives conservent leur plan et leurs deux options de cache. Aucun changement de `SCHEMA_VERSION=1` ou `SAVE_KEY=rogov-web-v1`.
- Les deux chemins publics, les pièges évitables, les coffres, la récompense d'atelier et l'Arche restent accessibles. Aucun jet d'aléatoire de combat n'est utilisé pour calculer les indices.

## Vérifications
Les tests doivent couvrir 80 graines déterministes, la présence des deux corridors et des trois lieux, les voies de retour non bloquées, la lecture du brouillard, le coût en tour/END, l'exclusivité du choix, la validation des anciennes sauvegardes et l'ajout du module au cache PWA.

## Recette sur Android réel
1. Commencer une nouvelle descente profonde : observer les deux portes du vestibule, puis les toucher pour lire leurs indices.
2. Explorer d'abord le ravitaillement à l'est, puis les marques de garde au nord. Observer les risques et leur visibilité sans ouvrir gratuitement le brouillard.
3. Approcher de la cache gardée : forcer le sceau avec au moins 3 END ; vérifier la dépense de tour, le danger durant la phase ennemie et la rondache. À 2 END ou sac plein, aucun tour ne doit être perdu.
4. Charger une ancienne descente, vérifier qu'elle n'a pas migré ; tester également la profondeur suivante, l'extraction, le mode ASCII, le mode graphique, l'APK et la PWA hors ligne.

**À confirmer en jeu humain :** ressenti tactique, fréquence du détour récompensant le risque et calibrage de la rondache. La CI ne remplace pas ce test.
