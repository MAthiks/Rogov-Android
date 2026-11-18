# ROGOV — ART-091B : silhouettes ennemies Sprite C

**Décision graphique :** [Sprite C v1](ART_DIRECTION_SPRITE_C_V1.md), 18 novembre 2026.  
**Dépendance :** ART-091A — L'Égaré encapuchonné, intégré sur `main`.  
**Statut :** livrable technique en revue ; jugement artistique sur Android physique encore à confirmer.

## Périmètre et identité

Ce lot remplace **uniquement les trois sprites** des ennemis déjà implémentés en SVG pixel art 24 × 24, transparents, origine ROGOV, sans asset distant.

| Entité | Lecture visuelle à 24 × 24 |
|---|---|
| **Charognard** | Créature **basse et allongée**, plumage asymétrique effiloché, cou voûté, **bec osseux crochu**, yeux sombres et griffes inégales. Palette bruns froids avec touches d'ivoire |
| **Gardien déchu** | Géant **carré et massif**, épaules/pans de pierre fracturée, casque non encapuchonné, petite fente pâle, **masse d'armes imposante**. Palette pierre ardoise |
| **Larve de faille** | Créature **horizontale et segmentée** avec trois plaques visibles, excroissances et pattes courtes, **petit foyer spectral localisé**. Palette bleu/vert désaturé |

Ils restent distinguables par **silhouette, proportions, orientation, matériau et contrastes**, sans dépendre de leur teinte seulement. Aucun effet lumineux permanent n'est ajouté aux tuiles voisines, pour éviter de brouiller l'Arche ou les indices de danger.

## Implémentation

- Nouveau module `docs/enemy-art.js` : `ENEMY_ART_IDS`, `ENEMY_SVGS` et `ENEMY_SPRITES` ; SVG encodés en data URI, tous intégrés localement et précachés dans le Service Worker.
- `docs/tiles.js` utilise les trois nouveaux SVG aux anciennes clés `charognard`, `guardian` et `rift_larva`. La **légende, les portraits de combat et la carte** utilisent donc exactement le même asset.
- Les classes `hostile-tile`, les types `tile-*`, les bordures de menace, badges de PV et surbrillance de cible restent inchangés.
- Le brouillard continue de vérifier `visible` avant toute consultation d'un ennemi : aucune case non découverte ne reçoit un sprite, un identifiant ou des PV.
- Le Sprite C du PJ (ART-091A), les sols et murs de DEV-089B, les autres interactifs et le CSS Android sont inchangés.
- Nom de cache PWA incrémenté pour mettre le pack visuel à jour hors ligne.

## Aucune modification de gameplay

`docs/game.js`, `docs/combat.js`, `docs/enemy-ai.js`, le RNG, les positions procédurales, les intentions, les portées, les PV, les dégâts, les tours, les sauvegardes et l'ASCII sont intacts. La clé `SAVE_KEY` et la version de schéma ne changent pas. Les trois familles adverses gardent leurs symboles `c`, `G`, `L`, leurs identités et leurs comportements.

## Contrôles qualité

1. `npm run check:web` et `npm run test:web` — contrats SVG, silhouettes discriminantes, clé des sprites, stats et ASCII, compatibilité des sauvegardes, cache PWA.
2. `tests/mobile-browser.test.mjs` — affichage des trois adversaires sur écran tactile 360 px, image décodable, bordures de menace et PV, sélection de cible gratuite, non-débordement, changement ASCII et reprise de sauvegarde.
3. Test sous brouillard — deux ennemis visibles, Larve hors de la ligne de vue, aucun sprite, classe de danger ou identifiant ennemi sur une case inconnue.
4. CI GitHub Actions — Chrome Android 13 sur émulateur, suite moteur et compilation APK, puis GitHub Pages si fusion.

**Recette humaine restante :** valider sur téléphone Android à taille réelle les trois silhouettes contre murs et sols, le contraste du Charognard et de la Larve, l'intention de coup lourd du Gardien et le rendu des HP en plein combat. Le passage des tests ne vaut pas validation esthétique automatique.

## Étapes suivantes, sans anticipation

- **ART-091C :** interactifs et lieux (portes ouvertes/fermées, coffres, pièges, Arche, passages secrets, lieux spéciaux).
- **ART-091D :** PNJ de Veyr et objets, homogénéité du sac et de l'inventaire ; aucune nouvelle mécanique ajoutée.

**WIP = 1 :** ART-091C ne commence qu'après publication et validation du présent lot.
