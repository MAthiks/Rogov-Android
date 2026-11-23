# ROGOV — ART-107B : le tileset gothique de Nhal

**Ouverture :** 23 novembre 2026  
**Branche :** `feature/art-107b-nhal-tileset`  
**Base :** `main` après ART-107A (PR #84)  
**Statut :** B1/B2 codés, en attente des quatre workflows et de la revue graphique, **non fusionné** à l'ouverture.

## Référence visuelle

La capture utilisateur de ROGOV est le guide qualitatif : pierre gris-bleuté, dalles irrégulières, corniches très lisibles, murs gothiques volumétriques, patine/mousse ponctuelle, lumières ambrées, Arche cyan, Faille verte. Le nouveau code est **le véritable atlas SVG 24×24** consommé par `tiles.js`, jamais une image statique substituée au jeu.

## ART-107B1 : terrain intégré

- **8 sols :** F01 ardoise régulière ; F02 pierre usée ; F03 dalle fissurée non magique ; F04 joints moussues ; F05 maçonnerie réparée ; F06 poussière/graviers ; F07 gravure ancienne décorative effacée ; F08 dalle très sombre des profondeurs.
- Les **6 bases historiques ART-106C/ART-107A** restent disponibles, les deux nouveaux dessins réemploient leur maçonnerie basse fréquence avec une couche 107B dédiée. Les 8 finis ont des accents propres, sans nouveau type de case.
- **48 murs :** 16 masques de connexion déjà filtrés par connaissance × 3 patines (pierre taillée, fissurée, moussue). Corniche éclaircie, face sombre et mortier profond. Le masque 15 conserve le pilier isolé.
- Sélection déterministe par le hash visuel du layout, **sans tirage de jeu** ni champ de sauvegarde.

## ART-107B2 : structures et lisibilité

- Détails 24×24 sur **portes ouvertes/fermées, coffres vides/pleins, Arche cyan, Faille verte, pièges révélés/désarmés/déclenchés**. Seuls les éléments existants du moteur reçoivent une finition ; indices de pièges cachés inchangés.
- Torche en fer forgé : couche supplémentaire uniquement sur l'ancienne applique décorative. Son affichage demeure conditionné à la **visibilité réelle**.
- Sprite C encapuchonné quatre directions, Charognard, Gardien et Larve de faille restent ceux de ART-107A. Aucune espèce ajoutée.

## Contraintes et contrôle

- `game.js`, moteur de combat, collisions, déplacement, carte tutoriel **15×9**, profondeurs **11×11**, FOV, mémoire de brouillard, IA, butin, mode ASCII et `rogov-web-v1` inchangés.
- SVG 24×24 local, sans filtre, sans image distante, sans animation lourde ; cache PWA et empaquetage APK mis à jour.
- Tests : cardinalité et unicité atlas (8+48=**56**), validité/sécurité des SVG, cas du pilier isolé, frontières de connaissance, identité des objets, torche visible seulement, sauvegarde, précache.
- Les tests historiques des 6 sols d'origine sont conservés comme contrôles de compatibilité, mais leurs assertions sur l'atlas agrandi sont ajustées pour 8 sols.

## Livraison / statut des validations

- PR : à renseigner.
- SHA validé : à renseigner.
- Web/Chromium : à confirmer.
- Chrome Android 13 : à confirmer.
- APK classique : à confirmer.
- APK WebView moderne : à confirmer.
- Captures Chromium à inspecter : 320×640, 360×800, 393×704, 412×915.
- **QA-106G sur Android physique toujours ouverte.** Aucun GO artistique accordé sur seule CI.

## Suite

ART-107B3/B4, uniquement après revue des vrais rendus : finition des objets au sol/sites sans introduire de nouveaux états, contrôle du contraste de Sprite C et des ennemis, comparaison humaine avec la référence puis retour au gameplay de Nhal.
