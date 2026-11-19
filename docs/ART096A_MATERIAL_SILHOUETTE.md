# ART-096A — Relief de Nhal et lisibilité de Sprite C

**Date :** 19 novembre 2026.  
**Statut :** lot graphique en validation avant fusion.  
**Base :** [UI-096](UI096_V3_VISUAL_MOCKUPS.md), [Nhal v2](UI096A_NHAL_V2_REVIEW.md), [UI-096B fusionné](UI096B_NHAL_COCKPIT_IMPLEMENTATION.md), [Sprite C](ART_DIRECTION_SPRITE_C_V1.md).

## Objectif

Rendre le donjon **plus lisible à taille réelle Android**, sans inventer de décor interactif ou modifier une mécanique. La perspective reste top-down 3/4 et les cellules font 24 × 24 pixels SVG. Le contraste doit aider à reconnaître un mur, une ouverture, un danger, un ennemi et la sortie en une seconde ; les sols restent volontairement moins lumineux que les sprites.

## Changements réellement codés

- `docs/terrain-art.js` : six sols **sans motifs simulant des pièges**, subdivisés en plans de dalles peu contrastés (`worn-floor-slabs`), quarante-huit murs conservant les mêmes masques 16 × 3 mais avec un **rebord supérieur plus clair et une façade en retrait** (`raised-stone-ledge`). L'autotiling se base toujours uniquement sur les voisins déjà connus, jamais sur les espaces inexplorés.
- `docs/interaction-art.js` : porte **ouverte = ouverture vide avec clé de voûte**, porte **fermée = panneau de bois opaque et serrure** ; Arche = structure haute, turquoise et éclairée, avec clé de voûte ; Faille = **fracture horizontale** à cœur noir, sans arche. L'ancien coffre, les indices, les pièges et les sites restent inchangés dans ce lot.
- `docs/enemy-art.js` : retouches **sans changement de silhouette de famille** : Charognard (bord d'aile déchiré), Gardien déchu (plans d'armure de pierre), Larve de faille (crêtes segmentées). Trois sprites originaux 24 × 24, sans nouvel ennemi ni pose menaçante inventée.
- `docs/sw.js` : cache versionné afin que la PWA Android récupère les nouveaux SVG locaux dans ses modules.
- `tests/art096a-visual-clarity.test.mjs` et test Chromium dédié : cohérence des nouveaux SVG, atlas, vrais éléments DOM, brouillard, comparaison porte ouverte/fermée, stabilité des sauvegardes.

## Invariants de production

**Aucun changement** de `docs/game.js`, `docs/combat.js`, `docs/tiles.js`, `docs/deep-dungeon.js`, `docs/app.js`, `docs/ui092.js` ni `docs/ui096.js`. Les deux modes de rendu utilisent exactement les mêmes cellules et données. Il n'y a pas de halo vert autour du PJ. Les tests de contraste structurel sont techniques ; ils ne valent pas approbation esthétique humaine.

**Brouillard de guerre :** les cellules inconnues n'ont ni image, ni texte, ni attribut d'entité. Les murs connus ne consultent pas les voisins inconnus pour leur aspect. Les ennemis ne sont projetés que si déjà visibles.

**Sauvegardes :** `SAVE_KEY=rogov-web-v1`, `SCHEMA_VERSION=1`, inventaire, RNG et actions inchangés. Le remplacement de la texture ne consomme aucun tour.

## Conditions de validation

- `npm run check:web` puis `npm run test:web` (ensemble Node), Chromium mobile portrait, Chrome Android 13, build/signature/installation APK.
- Contrôle réel en Chromium : 24×24 SVG rendus sur la carte 11×11, sols/murs visibles, cellule inconnue vide, porte ouverte puis fermeture réellement exécutée en **un tour**, sauvegarde compatible.
- **Reste à faire sur appareil physique :** vérifier 320×640 / 360×780 / 393×704 selon téléphones disponibles, inspecter les trois silhouettes à environ 20–30 CSS px, distinguer immédiatement le Gardien et le PJ, identifier l'Arche et la Faille, contrôler les contrastes sous un écran peu lumineux.
- **Jalon joueur non rempli :** cinq testeurs × deux descentes et au moins quatre ayant envie de rejouer. Ne pas écrire « DA finale validée » uniquement grâce aux tests automatiques.

## Suite

**ART-096B** : après observation sur Android, corriger éventuellement la composition des murs, harmoniser pièges/coffres et intentions ennemies, avec un diff graphique séparé. **UI-096C** : ensuite refuge, coffre/sac et fiche personnage ; ne pas inventer de PNJ actifs ou de statistiques.

Le chantier est progressif. Une nouvelle image de maquette ne prouve pas que le même design est déjà intégré : comparer les vrais sprites et les vraies commandes dans l'application.
