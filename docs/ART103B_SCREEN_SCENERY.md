# ROGOV — ART-103B : décors et cadres des écrans

**Référence utilisateur :** planche UI-096 — Maquettes v3, image des quatre écrans (Nhal, Veyr, Sac, Personnage), réaffichée le 21 novembre 2026. Le présent lot applique son langage visuel au **jeu réel** : pierre froide, métal ouvragé, lumière de feu limitée, et panorama d'un bourg abrité. Le rendu est une adaptation graphique originale, pas la reproduction exacte du visuel publicitaire.

**Branche :** `feature/art-103b-screen-scenery-frames`; issue de UI-103A (PR #70) elle-même issue de UI-102 (PR #69). **Ne pas fusionner sur `main` avant validation des dépendances et des CI.**

## Livrables

| Fichier | Traitement | Destination réelle |
| --- | --- | --- |
| `docs/art103b-veyr-panorama.svg` | Panorama original 720×240 : lune, toits sombres, fenêtres et lanternes, pavés, atelier éclairé | Fond de la bannière `.veyr-hero>.refuge-banner` |
| `docs/art103b-nhal-ruins.svg` | Ruines bleutées, vieux portail, tours et lueurs de torche | **En-tête** de Nhal, pas les cases de la carte |
| `docs/art103b-iron-frame.svg` | Décor `border-image` en neuf sections, relief de fer, rivets en laiton et jonctions | Cadres du refuge, forge, Échos, fiche du personnage, panneau de sac |
| `docs/art103b.css` | Applique décor et matière aux contrôles existants | Quatre écrans sans nouveaux handlers |
| `docs/sw.js`, `docs/index.html` | Activation et précache des quatre nouveaux fichiers | Android Chrome/PWA et WebView APK |
| `tests/art103b-screen-scenery.test.mjs` | Vérifie les assets, l'affichage hors ligne et la séparation DA/moteur | CI Web |

## Règles conservées

- Carte 11×11 **strictement inchangée**, pas d'ajout d'objet, d'ennemi, de changement de topologie ni de calcul des tours.
- Les lueurs déjà attachées par ART-097C sont simplement harmonisées **sur les seules cases `data-knowledge="visible"`**. Pas d'effet ou de silhouette sur une case inconnue, ni modification du FOV ou de l'ASCII.
- L'en-tête de Nhal illustre des ruines, **sans signaler une sortie ni une menace** ; l'Arche et la Faille réelles demeurent des sprites distincts.
- Les façades de Veyr, leurs habitants éventuels et la forge représentée sont un **décor non interactif**. Aucune vente, repos, PNJ, dialogue ou monnaie fictifs.
- Le sac, le personnage et les raccourcis sont les panneaux et actions existants. Aucun nouveau slot, talent ou statistique inventés.
- Les animations n'existent pas dans ce lot ; la préférence `prefers-reduced-motion` est respectée.
- Sauvegarde `rogov-web-v1`, `SCHEMA_VERSION=1`, cache PWA et propriétés tactiles inchangés.

## Recette graphique Android

Faire les tests sur `320×640`, `360×780`, `393×704` ainsi que sur un téléphone Android physique :

1. **Nhal :** ruines perceptibles uniquement dans l'en-tête ; la carte est le centre d'attention, parfaitement visible, sans masque de brouillard additionnel ni effet de bordure sur le PJ.
2. **Veyr :** lumière et bâtiments visibles derrière l'accroche du refuge, texte lisible au-dessus du dégradé ; accès Préparer, Forge, Échos, Égaré cliquables ; bouton fixe « Descendre » non caché.
3. **Sac :** bordures et icônes gardent une distinction nette ; tiroir demeure sous le haut du dock et ses contrôles restent accessibles au doigt.
4. **Personnage :** six valeurs affichées, sections du panneau lisibles sans rognage, navigation fluide retour Nhal.
5. **Mode avion / PWA :** les trois SVG et la CSS chargent depuis le cache local sans requête distante. APK moderne : même source `docs/` et aucune suppression de sauvegarde.
6. **Qualité :** les quatre CI vertes exigées et comparaison au rendu réel sur téléphone. Les captures statiques de CI ne remplacent pas une revue artistique humaine.

## Prochain bloc possible : ART-103C

Assets graphiques d'inventaire, petites icônes et emplacements adaptés aux objets réellement présents, en conservant la limite de huit unités et sans inventer de mécanique d'équipement.
