# ROGOV — ART-107B : le tileset gothique de Nhal

**Ouverture :** 23 novembre 2026  
**Branche :** `feature/art-107b-nhal-tileset`  
**Base :** `main` après ART-107A (PR #84)  
**Statut :** ART-107B1/B2 fusionnés dans `main` le 23 novembre 2026, **PR #85**, commit `0e4f3beac0c63f89cb4343c7f505821f4cbb3b10`. Recette Android physique non encore validée.

## Référence visuelle

La capture utilisateur de ROGOV est le guide qualitatif : pierre gris-bleuté, dalles irrégulières, corniches très lisibles, murs gothiques volumétriques, patine/mousse ponctuelle, lumières ambrées, Arche cyan, Faille verte. Le nouveau code est **le véritable atlas SVG 24×24** consommé par `tiles.js`, jamais une image statique substituée au jeu.

## ART-107B1 : terrain intégré

- **8 sols :** F01 ardoise régulière ; F02 pierre usée ; F03 dalle fissurée non magique ; F04 joints moussus ; F05 maçonnerie réparée ; F06 poussière/graviers ; F07 gravure ancienne décorative effacée ; F08 dalle très sombre des profondeurs.
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

## Livraison / statut des validations — clôture technique

- **PR #85 fusionnée dans `main`** : https://github.com/MAthiks/Rogov-Android/pull/85
- **Dernier commit de branche validé :** `13db08ec3d9bbd4a98c299776ea03e26a40402b7`.
- **Commit squash de fusion :** `0e4f3beac0c63f89cb4343c7f505821f4cbb3b10`.
- Web/Chromium : **succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45178322802
- Chrome Android 13 : **succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45178322786
- APK classique : **succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45178322850
- APK WebView moderne : **succès après relance d'un job** — https://github.com/MAthiks/Rogov-Android/actions/runs/45178322826
- **Échecs de tests corrigés avant fusion :** assertions de cardinalité de l'atlas héritées de ART-096A, ART-097C2, UI-099, UI-100 (54→56 variantes, 6→8 sols) et galerie Chromium mobile (16→18 images). Les 419 tests Node et les 80 tests navigateur terminent verts.
- **Incident intermittent à surveiller :** le premier essai WebView moderne sur ce SHA a perdu le processus `com.rogov.webapk` lors d'un rechargement après passage hors ligne, malgré sauvegarde et écran 11×11 restaurés. Le job relancé a passé la totalité des assertions ; aucune modification du moteur n'a été présentée comme correctif de ce point. Le scénario doit être répété sur appareil physique.
- **Captures contrôlées :** artefact `qa096-chromium-portraits` du run Web réussi (ID `14820941334`), notamment 320×640 et 360×800 du vrai Nhal profond 11×11 et galerie Sprite C / ennemis / huit sols. Aucun recouvrement bloquant observé sur ces captures et galerie de 18 icônes cohérente.
- **Écart artistique restant :** sols à motifs répétitifs, silhouettes compactes et relief global encore moins riche que la grande référence utilisateur. Ne pas confondre CI 4/4 et fidélité visuelle pleinement acquise.
- **QA-106G sur téléphone physique toujours ouverte ; GO graphique final non accordé.**

## Suite

ART-107B3/B4, uniquement après revue des vrais rendus : finition des objets au sol/sites sans introduire de nouveaux états, contrôle du contraste de Sprite C et des ennemis, comparaison humaine avec la référence puis retour au gameplay de Nhal.
