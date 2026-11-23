# ROGOV — ART-107A : refonte graphique du monde vivant de Nhal

**Ouverture : 23 novembre 2026.**  
**Base :** `main` après UI/ART-106F fusionné (PR #83), QA-106G préparée mais **validation Android physique encore ouverte**.  
**Branche :** `feature/art-107a-nhal-world-sprites`.

## Source artistique de référence

Screenshot ROGOV transmis par l'utilisateur : bannière sombre, donjon en dalles gris bleuté, murs saillants et joints profonds, végétation localisée, torches ambrées, Sprite C encapuchonné aubergine, gardien blindé massif, créature basse, coffres précieux à ferrures or, Arche cyan, Faille verte.

**But :** améliorer les **véritables sprites du moteur** et non incruster la capture ni fabriquer un donjon statique. Les 24×24 pixels sont la contrainte de rendu native ; la composition de référence est une cible qualitative et non une copie pixel à pixel garantie.

## Ordre de production

1. **ART-107A1 / terrain :** relief lisible des dalles de sol (6 variantes existantes), capstones et joints des murs (16 masques connus × 3 variantes), usure/mousse/gravats en touches limitées ; ne pas simuler de nouveaux pièges. Conserver les torches **uniquement** sur les murs effectivement visibles et leur lumière locale sans fuite de brouillard.
2. **ART-107A2 / acteurs :** renforcer les quatre directions de l'Égaré encapuchonné **Sprite C** sans cadre de sélection ; trois espèces d'ennemis existantes avec masse, segmentation et lecture de la tête/menace à taille Android.
3. **ART-107A3 / objets :** donner du relief aux coffres fermé/ouvert, bois/fer des portes, Arche cyan, Faille verte et pièges déjà connus, sans créer ni révéler d'objets.
4. **Tests :** 24×24, atlas et identités inchangés, art déterministe et hors réseau, respect des masques de murs, conservations du moteur, du brouillard, du mode ASCII, du cache PWA et des sauvegardes `rogov-web-v1`.
5. **QA :** quatre workflows Web/Chromium, Chrome Android 13, APK standard et WebView moderne ; ensuite contrôle des captures et essai sur téléphone physique. Pas de fusion si la CI du dernier commit n'est pas **4/4**.

## Garde-fous non négociables

- Nhal profond **11×11**, tutoriel **15×9**, Sprite C et animations directionnelles intactes.
- Pas de modification des règles de tour, position, collision, inventaire, butin, IA, RNG, FOV, extractions ou sauvegardes.
- Les variantes et effets suivent seulement l'état de **connaissance** déjà filtré par `tiles.js`. Aucun décor sur case inconnue, aucune menace projetée par un mur caché.
- 24×24 SVG originaux, pas d'image distante, de filtre SVG coûteux ou de mutation du DOM par les fonctions d'illustration.
- Ne pas confondre succès des tests automatisés et approbation graphique humaine.

## Clôture technique — 23 novembre 2026

- **PR #84 : fusionnée dans `main`** : https://github.com/MAthiks/Rogov-Android/pull/84
- **Dernier commit de la branche testé :** `ddf717cd2ca3ae611313924db9418cb626e5b74f`
- **Commit squash de fusion :** `751cac1609d6f7be5862f1335c677e5858e25d19`
- **Quatre workflows réussis sur le dernier commit :**
  - Web / Chromium : https://github.com/MAthiks/Rogov-Android/actions/runs/45084245944
  - Chrome Android 13 : https://github.com/MAthiks/Rogov-Android/actions/runs/45084245872
  - APK classique : https://github.com/MAthiks/Rogov-Android/actions/runs/45084245852
  - APK moderne WebView : https://github.com/MAthiks/Rogov-Android/actions/runs/45084245876
- **Livraison :** `docs/art107a-finishes.js` et branchements sur `terrain-art.js`, `hero-art.js`, `enemy-art.js`, `interaction-art.js` ; couverture de tests `tests/art107a-world-polish.test.mjs` ; cache PWA actualisé.
- **Atlas :** six sols, 16 masques connus × trois variantes de murs et pilier, héros quatre orientations, trois ennemis, coffres, portes, Arche, Faille et pièges reconnus ; aucun nouveau type d'entité.
- **Revue des captures automatisées :** artefact `qa096-chromium-portraits` (ID 14777849662), dont `qa106e-deep-11x11-320x640.png`, `qa106e-deep-11x11-360x800.png`, `qa106e-deep-11x11-393x704.png` et `qa106e-deep-11x11-412x915.png`. Contrôle d'ensemble de l'écran vivant ; aucun défaut majeur évident sur les captures contrôlées, mais ce n'est ni un comparatif pixel à pixel ni une recette de tous les sprites en situation.
- **Mesures automatiques jointes :** 121 cellules pour le Nhal profond, largeur carte 264 px sur 320×640, six raccourcis de 44 CSS px dans ce format, aucun débordement horizontal ; le rapport QA-097 indique `lightLeak=0`, `enemyLeak=0`, `saveUnchanged=true`, `turnsUnchanged=true`. Ces mesures proviennent de Chromium émulé, pas d'un téléphone physique.
- **Limite artistique actuelle :** le traitement 24×24 reste moins volumétrique et spectaculaire que la grande référence illustrée ; le contraste des créatures et l'échelle perçue doivent être évalués sur un téléphone.
- **Décision : ART-107A fusionné techniquement. GO graphique final non accordé.** Continuer [QA-106G](QA106G_ANDROID_FINAL_RECIPE.md), puis arbitrer des ajustements artistiques supplémentaires uniquement à partir de captures/retours concrets.
