# GAME-101C — Cartographie tactique du repli (20 novembre 2026)

## Objectif de gameplay

Après avoir exploré la branche de ravitaillement à l'est, le joueur décide : sécuriser une ressource immédiate (bandage ou Fragment de cendre), ou obtenir un avantage de préparation du retour vers l'Arche. L'atelier reste facultatif et accessible sans emprunter obligatoirement le chemin gardé.

## Règles

- Sur les nouvelles descentes de Nhal seulement (`branchPlanVersion=1` et `scoutingPlanVersion=1`), une troisième action d'atelier **« Relever un plan de repli »** coûte **1 tour + 2 END** et rapporte **1 XP**, sans objet.
- Le choix est **exclusif et persistant**, comme les deux actions déjà disponibles à l'atelier. Impossible d'exploiter le lieu une seconde fois, y compris après chargement.
- Le croquis trace par parcours déterministe une voie statique praticable entre l'atelier et l'Arche, en refusant les murs et failles. Au plus **48 cases de sol ordinaire** sont ajoutées à la mémoire de la carte. Le trajet ne garantit pas l'absence d'ennemi ou de piège.
- Le joueur ne reçoit que des cases de sol mémorisées (`:` hors champ), **pas de vision directe**, pas de position de monstre, pas d'emplacement de coffre, de porte inconnue, d'extraction, de site ni de piège. Les règles du brouillard et de ligne de vue existantes restent inchangées.
- Le tour provoque la phase ennemie habituelle. Aucun RNG de combat ni génération de contenu n'est consommé.
- Les anciennes sauvegardes, y compris GAME-101B sans nouveau marqueur, conservent leurs possibilités et leur état. Schéma `rogov-web-v1` inchangé ; nouvelles descentes et nouveaux étages reçoivent le marqueur optionnel.

## Recette sur Android

1. Lancer une nouvelle descente profonde, emprunter l'itinéraire est et trouver l'atelier.
2. Vérifier les trois alternatives de l'atelier. Examiner la carte et l'endurance avant le choix.
3. Choisir le croquis : contrôler 1 tour, -2 END, +1 XP, dessin mémorisé (cases `:` en ASCII) et réaction des ennemis.
4. Vérifier que les cases nouvelles n'affichent ni ennemis ni coffres/pièges/portes invisibles. Le chemin suggéré peut être dangereux.
5. Recharger : atelier définitivement résolu, croquis préservé. Tester une ancienne sauvegarde : pas de troisième choix.
6. Vérifier le navigateur Android, le WebView APK, l'ASCII, le graphisme et le fonctionnement PWA hors ligne.

**CI et tests de scénario ne remplacent pas la validation ergonomique sur téléphone réel.**
