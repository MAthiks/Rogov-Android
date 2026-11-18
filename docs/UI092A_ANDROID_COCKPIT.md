# ROGOV — UI-092A : cockpit de descente Android

**Référence de conception :** [Maquette UI v2](UI_V2_MAQUETTE_V1.md).  
**Direction artistique :** Sprite C, lots ART-091A à ART-091D.  
**Statut :** implémenté sur branche, fusion et publication conditionnées aux tests GitHub.

## Problème résolu

L'ancien écran de descente empilait en page de longs blocs de statistiques, la carte, les commandes et les panneaux d'action. Sur Android portrait il fallait défiler pour effectuer une action puis revenir à la carte.

UI-092A introduit un **cockpit mobile dédié** (jusqu'à 730 px) sans créer d'écran de jeu alternatif ni toucher aux règles.

## Écran de descente v2

- Masquage du grand en-tête et des statistiques de site sur mobile **uniquement pendant une descente**, pas au refuge ni sur ordinateur.
- En-tête Nhal condensé, compteur de tours et capacité réelle **8 objets**.
- Jauges PV / endurance, menace visible et commandes regroupées ; statut toujours fondé sur le moteur et le brouillard.
- Carte Sprite C dominante, centrée avec dimensions adaptatives en hauteur (42dvh), affichage ASCII conservé.
- Six raccourcis toujours accessibles : **Carte, Combat, À portée, Rapport, Sac, Journal**.
- Commandes de mouvement à quatre directions et **Attendre** fixées au bas du viewport, avec **Bandage** et **Tonique** à droite ; aucune répétition d'action ni mouvement automatique.
- Les panneaux de combat, interactions, rapport, sac et journal sont ouverts à la demande dans un **tiroir contextuel au-dessus des commandes** ; un bouton Fermer et la touche Échap referment le tiroir. Le mode refuge et le desktop conservent leur disposition.
- Tiroir limité en hauteur et défilant indépendamment. Les boutons de déplacement et de soin restent au premier plan même lors de l'ouverture d'un panneau.

## Architecture et invariants

- Nouveau module docs/ui092.js : le tiroir **déplace les véritables nœuds DOM** dans un conteneur temporaire puis les remet à leur emplacement initial. Il ne copie aucun bouton ni gestionnaire d'événement. Le moteur continue de mettre à jour les mêmes identifiants HTML.
- Nouvelle feuille docs/ui092.css isolée : règles visuelles ciblant le shell actif et uniquement les petits écrans. Hauteur réelle des commandes mesurée avec ResizeObserver pour respecter la barre de navigation et la zone de sécurité Android.
- docs/index.html : un conteneur de tiroir et un raccourci Journal. Aucun nouveau personnage, objet, action ou statut.
- docs/app.js : installation du contrôleur d'interface et synchronisation après chaque rendu, sans changement à game.js.
- docs/sw.js : incrémentation du cache et précache des deux nouveaux fichiers pour PWA offline.
- **Aucun changement** à la clé de sauvegarde rogov-web-v1 / schéma 1, au combat, au RNG, aux tours, à la génération, aux portes/pièges/secrets, au brouillard ou aux règles d'extraction. Les actions restent exécutées uniquement par les handlers historiques.
- Les raccourcis ne consomment aucun tour ; la sélection de cible ou de porte reste gratuite, leurs actions réelles conservent leur coût en tours.

## Recette automatique

- Node : tests/ui092.test.mjs valide IDs, absence d'actions de jeu dans le contrôleur, conservation du schéma, usage du vrai DOM, cache offline, feuille responsive.
- Chromium mobile 360×780 : présence simultanée de carte, HUD et commandes ; pas de débordement, gestes de déplacement/attente, ASCII et reprise. Panels déplacés et restaurés, portes, sac, journal et rapport, ciblage et défense active après ouverture du tiroir.
- Ajustement des contrats géométriques DEV-090A/B/C : l'ancienne adjacency en flux de documents ne peut plus être exigée quand les commandes sont volontairement **fixes** ; le nouveau critère vérifie le dock à l'extrémité de la fenêtre et le maintien de la carte.
- GitHub Actions : Node, Chromium tactile portrait, Chrome sur émulateur Android 13, compilation et installation APK, GitHub Pages après fusion.

## Contraintes et validation sur appareil réel

Ce lot n'ajoute pas la refonte du refuge, du coffre ni de la fiche personnage : **UI-092B, UI-092C, UI-092D** restent à développer séparément. La maquette source inclut des chiffres et objets illustratifs : aucune nouvelle ressource fictive n'est ajoutée.

Contrôles manuels prioritaires : 360×780 et autres ratios Android, hauteur de la barre système, navigation d'un panneau à l'autre, grande carte, lisibilité des sprites à l'échelle réelle, scroll des cinq actions tactiques dans le tiroir, mode ASCII et reprise après fermeture/actualisation. **La CI n'est pas une validation esthétique sur téléphone physique.**
