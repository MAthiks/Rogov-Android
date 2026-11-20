# UI/ART-100 — Final graphic polish

**Date :** 20 novembre 2026. **Branche :** `feature/ui-art-100-final-graphic-polish`. **État :** livré en PR pour recette, sans fusion.

## Garanties et limites

Le moteur, les tours, le générateur, les règles d'ennemis et le contenu des sauvegardes ne sont pas modifiés. 54 textures de terrain 24×24 déterministes et 15 interactions connues, héros Sprite C encapuchonné quatre directions, trois ennemis, FOV/ASCII, carte 11×11 (et héritage 15×9), PWA hors ligne, WebView Android, pavé fixe UI-098B1 et vrais panneaux UI-099 restent les sources de vérité.

## Implémentation

- Sol : plans larges et discrètes réparations distinctes pour six dalles, sans fausse porte, trésor ou piège.
- Mur : surplomb sombre, couronne claire et face plus profonde ; masques de joints conservés.
- Couloirs : indice statique orthogonal uniquement sur une case sol `.` actuellement visible dont les quatre voisins sont eux-mêmes actuellement visibles. Aucune lecture de voisin inconnu, aucune information mémorisée ajoutée.
- PJ et ennemis : liserés pixel localisés, transparence conservée, cadre carré ennemi supprimé ; cible signalée par trait, marqueurs tactiques d'origine intacts.
- Coffres/portes/Arche/Faille/pièges révélés : pixels de matière additionnels, code couleur bronze/turquoise/cramoisi maintenu ; indice de piège ambigu non transformé.
- Android : `ui100.css` après UI-099, carte toujours dominante, HUD plus compact, raccourcis six actions ≥44px, pavé et tiroirs sans déplacement, aucune boucle d'animation. Cache SW versionné.

## Recette bloquante

1. Node `npm run check:web && npm run test:web` et `tests/ui100-final-graphic.test.mjs` : intégrité 54 textures, 15 interactions, absence de fuite FOV, sauvegarde schéma 1.
2. Chromium `tests/mobile-browser.test.mjs` : trois portraits Android, 121 cases, six touches 44px minimum, sans débordement ni erreur JS ; QA antérieure Combat/Sac/Menu/ASCII/sauvegarde maintenue.
3. CI `test-web`, `android-web`, `modern-apk`, `build` historique sur HEAD PR — tous verts avant GO technique. L'émulation n'est pas un essai physique.
4. Test utilisateur sur Android réel : esthétisme des sprites 24px, portrait court, fermeture de tiroirs, déplacement, Faille vs Arche, pièges, sauvegarde et mode avion ; décision explicite avant fusion.

**Ne pas fusionner sans validation technique et retour utilisateur.**
