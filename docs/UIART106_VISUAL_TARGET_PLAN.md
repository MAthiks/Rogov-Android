# ROGOV — UI/ART-106 : plan directeur de refonte visuelle haute fidélité

**Décision studio : 22 novembre 2026**  
**Statut : cahier de direction validé / implémentation UI/ART-106A à réaliser**  
**Référence source : screenshot de l'écran Nhal transmis par l'utilisateur dans le chat d'amélioration du 22/11/2026 (image originale, pas les images générées ensuite).**

## 1. Intention ferme

Faire converger **le rendu du jeu ROGOV réellement exécutable** vers le screenshot fourni, avec la fidélité visuelle la plus élevée possible. Il ne s'agit **ni d'une maquette isolée**, ni d'un simple changement de palette, ni d'une illustration substituée au jeu. La cible englobe la composition, les proportions, les matériaux, les bordures, les sprites, les éclairages et les contrôles.

Le screenshot sert de **référence artistique autoritaire** ; les données de jeu (tour, profondeur, PV, END, capacité, positions des monstres/objets, indices de danger) restent dynamiques. Ne jamais utiliser une image de l'écran comme interface figée. Le screenshot original devra être ajouté comme fichier de référence au dépôt avant un contrôle visuel automatisé pixel à pixel ; **ce commit de cadrage ne le contient pas**.

## 2. État de départ vérifié

Au 22/11/2026, la PR **#75 QA-105** est fusionnée sur `main`, après QA-104 (#74), ART-103D (#73), ART-103C (#72), ART-103B (#71), UI-103A (#70) et UI-102 (#69). Les améliorations existantes (Veyr, quatre écrans, sac, fiche personnage) ne suffisent pas encore à satisfaire cette nouvelle exigence de fidélité visuelle. La QA-105 apporte une recette responsive 360×800 et 412×915, mais **ne vaut pas approbation sur téléphone physique**.

## 3. Référence écran Nhal — inventaire visuel non négociable

Du haut vers le bas, reproduire :

1. **Bannière** nocturne bleu-noir, lune/silhouettes de ruines, logo ROGOV et tentures bordeaux, sous-titre `NHAL · PROFONDEUR 2/3`, cartouche `TOUR 48` (valeurs dynamiques).
2. **Trois panneaux statut** en métal noirci et liseré or/bronze : `PV` avec cœur et jauge rouge, `END` avec éclair et jauge ambre, sac avec remplissage courant.
3. **Grande carte dominante** enchâssée dans un cadre forgé : dallages de pierre gris froid, murs épais volumétriques, ruines, mousses, torches à halo chaud, portes, coffres, piliers, faille verte, Arche cyan, PJ encapuchonné Sprite C, ennemis clairement identifiables. Préserver strictement la géométrie, la visibilité et le brouillard du moteur.
4. **Bandeau d'alerte** rouge-noir, icône de danger, texte de menace lisible, prioritaire si attaque annoncée. Toute annonce vient des systèmes existants.
5. **Six destinations visuelles** dans des boutons en relief : Carte, Combat, À portée, Sac, Rapport, Journal. Adaptation fonctionnelle aux destinations réelles, pas de faux onglets.
6. **Zone tactile basse** : croix directionnelle pierre/bronze avec Attendre au centre, deux raccourcis d'objets réellement présents (ex. Bandage / Tonique uniquement si disponibles dans le moteur), bouton principal Actions fortement souligné par le métal chaud.

**Palette / matière :** noir bleuté, ardoise grise, fer noirci, bronze patiné, or vieilli, accents rouge danger, ambre feu, cyan Arche, vert Faille. Ombres internes, biseaux et ornements discrets ; lisibilité et contrastes priment sur la décoration. Pixel art cohérent sans mélange de résolutions arbitraires.

## 4. Ordre de production et découpage PR

| Lot | Périmètre | Livrable vérifiable |
| --- | --- | --- |
| **UI/ART-106A** | Composition de l'écran Nhal, header, statut, cadre de carte, alerte, onglets, D-pad, raccourcis, Actions | Écran HTML/CSS/JS réel, connecté aux états existants, captures responsive |
| **UI/ART-106B** | Matériaux, reliefs, palette, cadres, lueurs de boutons, états actif/pressé/désactivé | Design tokens + assets UI locaux + comparaison visuelle |
| **ART-106C** | Dallages, murs, portes, piliers, torches, végétation, éclairage de Nhal | Tileset original compatible avec grille, brouillard et caméra |
| **ART-106D** | Finition Sprite C (4 directions), ennemis, coffres, failles et Arche | Sprites homogènes, silhouettes lisibles et états de menace clairs |
| **UI-106E** | Refuge de Veyr | Même signature visuelle sans altération du gameplay refuge |
| **ART-106F** | Sac, fiche personnage, rapport, journal et overlays | Cohérence complète des écrans réels |
| **QA-106G** | Audit comparatif référence ↔ captures et validation Android physique | Écarts documentés, tests fonctionnels, recette tactile réelle |

Une PR par lot (WIP=1), dépendances fusionnées dans l'ordre, sans fusion sur simple promesse de rendu.

## 5. Premier chantier à exécuter — UI/ART-106A

**Objectif :** remplacer la composition visuelle actuelle de Nhal par une structure aussi fidèle que possible au screenshot, tout en conservant les vraies interactions.

Actions techniques :
- Auditer `docs/index.html`, styles UI actifs, `docs/app.js`, assets de Nhal et états de panneaux avant toute modification.
- Recomposer l'en-tête, l'encadré du tour et les trois ressources, sans dupliquer des valeurs fictives.
- Donner la priorité en hauteur et en largeur à la carte. Préserver le rendu de la grille, des cellules visibles/mémorisées et des cases occultées.
- Renforcer le cadre de carte et le bandeau de menace uniquement à partir des données exposées.
- Restituer la hiérarchie des six accès du screenshot, en conservant la navigation réellement implémentée.
- Construire un D-pad, Attendre, raccourcis réels d'objets et Actions avec états tactiles explicites, sans déclencher de tours par navigation UI.
- Intégrer assets statiques locaux dans le précache PWA et l'APK WebView.
- Capturer et comparer Nhal en **320×640, 360×800, 393×704 et 412×915**, plus contrôle sur Android physique.

**Points d'attention :** sur 320 px et 360 px, six onglets côte à côte peuvent compromettre une cible tactile de 44 px ; autoriser un défilement, une double rangée ou un agencement responsive tout en gardant les six actions accessibles. Ne jamais sacrifier la surface cartographique ou le contrôle du déplacement pour un calque décoratif. Les exemples chiffrés de la capture (tour 48, 12/16 PV, etc.) ne doivent pas être codés en dur.

## 6. Garde-fous techniques

- Ne pas réécrire `docs/game.js` ni modifier les règles de combat, le RNG, le déplacement, les niveaux ou les coûts des actions pour une raison purement graphique.
- Conserver les sauvegardes existantes `rogov-web-v1`, les parties en cours et les états de la carte.
- Préserver le Sprite C encapuchonné et ses orientations ; amélioration artistique progressive permise.
- Préserver la version ASCII, le fonctionnement hors ligne PWA et APK Android WebView.
- Ne pas afficher de fonctionnalité, d'ennemi, de consommable ou d'indicateur qui n'existe pas dans l'état courant du jeu.
- Vérifier les contrastes, zones tactiles, safe-area et largeur des textes français.

## 7. Critères de recette

- [ ] Nhal reproduit la **composition** de référence (bannière, trois ressources, carte dominante, alerte, six destinations, D-pad, raccourcis, Actions).
- [ ] Les **matières et cadres** sont cohérents avec la référence, sans agresser la lecture.
- [ ] PJ, ennemis, objets et risques sont lisibles sans cadres artificiels autour du personnage.
- [ ] Aucune fuite d'information via le brouillard ou les éclairages.
- [ ] Tous les chiffres et raccourcis proviennent de l'état courant ; aucune UI décorative non fonctionnelle.
- [ ] Toutes les commandes tactiles et les menus fonctionnent, sans tour dépensé en consultant un panneau.
- [ ] Les sauvegardes reprennent au même état après rechargement et fermeture/reprise de l'APK.
- [ ] Tests Web/Chromium, Chrome Android 13, APK classique et WebView modernes réussis.
- [ ] Captures comparatives **réel vs référence** produites, écarts résiduels notés.
- [ ] Validation sur **téléphone Android physique** distincte des tests émulateurs.

## 8. État de ce document

Ce fichier **enregistre la décision et le plan**. Il ne constitue **pas** une implémentation des lots UI/ART-106 et ne prétend pas que le rendu actuel du jeu corresponde déjà au screenshot.

**Prochaine action : commencer UI/ART-106A dans le code réel**, tester, publier une PR avec captures, puis valider avant de passer aux matériaux et tilesets.
