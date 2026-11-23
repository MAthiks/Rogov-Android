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

## État du chantier

Chantier ouvert sur branche dédiée. À compléter avec les commits, la PR, la matrice CI et les captures.
