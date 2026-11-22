# UI/ART-106E — Nhal Android : carte dominante, composition responsive

**Base :** ART-106D fusionné dans `main` (PR #79, `e6348ce`).  
**Référence :** capture graphique Nhal du 22/11/2026 (ROGOV, carte dominante, barre d'alerte, six raccourcis et pavé tactile en bas).  
**Statut :** code et tests intégrés sur `feature/uiart-106e-adaptive-nhal-layout`, QA requise avant fusion.

## Problème observé sur les captures réelles

Les captures de référence du workflow Web/Chromium montrent une différence entre **la vraie descente 11×11** et **le tutoriel 15×9** : le premier a une carte presque carrée qui occupe naturellement la hauteur ; le second conserve un ratio large et laisse du vide au-dessus du dock sur les téléphones hauts. Les anciennes règles `width:min(100%,calc(100dvh - 388px),540px)` / `calc(100dvh - 395px)` fixent l'espace par une constante sans tenir compte du menu de menace, de la description des branches, de la taille effective du dock ou du ratio réel de la carte.

**Décision : ne jamais tricher** en transformant les 15×9 en 11×11, en étirant les sprites rectangulairement, en masquant une partie des cases ou en déplaçant des informations de jeu sous le dock.

## Travail réalisé

- **`docs/uiart106e.js` :** ajustement purement visuel à chaque rendu et changement de taille. Le composant lit les dimensions réelles de `#tile-map`, du cadre, du dock et du contenu après la carte (navigation, alertes, retour d'exploration et texte de branche). Il calcule une largeur maximale compatible avec des cases **toujours carrées**. Les colonnes viennent du `gridTemplateColumns` **déjà assigné par `tiles.js`**, jamais d'une carte réinventée.
- **`docs/uiart106e.css` :** zone d'en-tête et cartouches un peu plus compacts, carte occupant la place récupérée, six vrais onglets de taille tactile, messages et commandes harmonisés. Le pavé directionnel conserve ses dimensions minimales de 44 px.
- **`docs/art106e-cavern-bridge.svg` :** décor de fond original, discret, visible dans les marges sans carte sur les écrans hauts. Ce n'est **pas un élément du donjon**, ne contient aucune information de jeu et n'intercepte aucun toucher.
- Compatibilité mode ASCII, paysage/tablette/desktop : la présentation mobile s'efface hors expédition ou au-dessus de 730 px, sans changer le rendu des tuiles et du brouillard.
- Service worker : tous les fichiers sont mis en cache hors ligne et le nom de cache est actualisé, sans supprimer les marqueurs historiques.
- Tests unitaires et navigateur sur **320×640**, **360×800**, **393×704** et **412×915**, plus portraits du tutoriel 15×9.

## Contrats de non-régression

1. `docs/game.js`, les cartes générées, le RNG, les IA, les collisions, les PV/END, le sac, les actions et les sauvegardes `rogov-web-v1` restent inchangés.
2. `#tile-map .pixel-tile` demeure identique dans les connaissances visibles/inconnues ; aucune tuile, porte, coffre ou ennemi fictif.
3. La carte ne passe pas sous le dock ; six boutons de raccourcis, attente, soin et Actions restent utilisables. Sur très petits appareils, le défilement vertical est préférable à la suppression d'information.
4. Ouverture de l'inventaire, du journal et des panneaux contextuels conservée (calcul de hauteur du dock assuré par `ui092`).
5. Mode ASCII disponible par le bouton original.
6. Recette automatique : navigateur + Android 13 Chrome + APK traditionnel + WebView moderne = quatre validations vertes, puis validation esthétique sur téléphone Android réel avant d'affirmer un rendu identique au screenshot.

## Livrables de capture

- `qa106e-deep-11x11-320x640.png`
- `qa106e-deep-11x11-360x800.png`
- `qa106e-deep-11x11-393x704.png`
- `qa106e-deep-11x11-412x915.png`
- `qa106e-tutorial-360x800.png`, `qa106e-tutorial-412x915.png`

Ces captures sont générées comme **artefacts CI** et non commitées comme textures.

## Portée honnête

Ce lot optimise la **composition responsive de l'écran Nhal**. Il ne crée pas de nouvelles mécaniques de donjon, ne refond pas Veyr, l'inventaire ou les cartes de journal et ne peut garantir à lui seul la fidélité pixel à pixel de la référence haute résolution. Les chantiers Veyr et overlays prévus initialement en 106E/106F restent des suites distinctes à programmer après la recette de Nhal.
