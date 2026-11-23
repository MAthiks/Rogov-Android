# ROGOV — ART-107B3/B4 : rythme des sols, sites et silhouettes

**Date de développement :** 23 novembre 2026  
**Branche :** `feature/art-107b34-floor-rhythm-readability`  
**Base :** `main` après fusion ART-107B1/B2 — PR #85 (`0e4f3be`).  
**État :** PR #86 fusionnée dans `main` après 4/4 CI réussies le 23 novembre 2026 ; recette physique QA-106G toujours ouverte.

## Objectif

Réduire l'impression de répétition du dallage, améliorer les points d'intérêt **déjà présents dans le moteur** et renforcer la lisibilité du Sprite C encapuchonné et de ses adversaires sans cadres colorés, ni ajuster l'échelle du donjon ou introduire de nouveaux ennemis.

## Travail technique effectué

### ART-107B3 — Variabilité de surface

- Les **huit matériaux de sol existants** reçoivent **quatre rythmes discrets de joints et de patine** : pierre taillée en décalage, pavage irrégulier, mortier réparé et ciseau ancien.
- **32 compositions SVG 24×24 précalculées** = 8 matériaux × 4 rythmes ; le contrat historique `TERRAIN_SVGS.floor[8]` et la famille de 48 murs demeurent intacts.
- La sélection utilise uniquement `terrainHash(layoutId,x,y)` et un brassage entier de ses bits bas ; elle est déterministe, **sans accès à `Math.random` ou aux données sauvegardées**. Le brassage évite l'aspect damier créé par le modulo direct du FNV.
- Les sols restent visuellement secondaires vis-à-vis des personnages, coffres, pièges et Failles. Aucune décoration ne simule un indicateur interactif.

### ART-107B3 — Objets et sites réels

- Passe graphique supplémentaire sur **huit identifiants existants** : `secret_open`, `site_atelier`, `site_echo`, `site_cache`, `site_camp`, `site_signal`, `site_reliquary`, `site_resolved`.
- Le système n'affiche ces sprites que dans les conditions **existantes** de `tiles.js` : aucune nouvelle interaction, collision ni découverte automatique ; `trap_clue` volontairement inchangé.
- Les coffres, portes, Arche, Faille et pièges déjà retravaillés en B1/B2 sont conservés.

### ART-107B4 — Silhouettes

- Accentuation **à l'intérieur** des quatre versions originales de Sprite C (capuche, cuir, bottes) sans modifier sa taille de case ni son contour coloré.
- Retouches d'armure, bec et segments sur les trois espèces déjà présentes : Charognard, Gardien déchu, Larve de faille.
- Pas de nouveau sprite d'espèce, pas de changement d'IA, de points de vie, d'intention, de tours ou d'inventaire.

## Garde-fous

- Moteur, sauvegardes `rogov-web-v1`, FOV, brouillard de guerre, carte Nhal 11×11, tutoriel 15×9, combat, loot, états de pièces et mode ASCII inchangés.
- SVG locaux 24×24, sans images distantes ni filtre SVG coûteux ; `docs/sw.js` étendu au nouveau module pour PWA/WebView hors ligne.
- Compatibilité du contrat de l'atlas historique : huit matériaux dans `TERRAIN_SVGS.floor`, seize masques × trois finitions dans `TERRAIN_SVGS.wall`, 18 interactifs et sept acteurs directionnels/espèces.
- Tests dédiés : identité et sécurité des 32 sprites, distribution et déterminisme, mémoire des murs, hiérarchie de connaissances, acteurs, sites, sauvegarde, cache PWA ; galerie mobile passée à 22 aperçus (8 sols + 4 rythmes + 3 murs + 4 héros + 3 ennemis).

## Validation attendue

- Web/Chromium et galerie mobile.
- Chrome Android 13 réel dans CI.
- APK Android classique.
- WebView moderne (y compris reprise de sauvegarde et fonctionnement hors ligne).
- Examiner les captures Android 320×640, 360×800, 393×704 et 412×915 pour la variété, l'absence d'overlap et les tailles de personnages.
- **Ne fusionner qu'à 4/4 CI réussies sur le dernier commit.**

### Réserve QA-106G

Un échec intermittent du processus `com.rogov.webapk` au retour hors ligne a été observé durant ART-107B1/B2, avant succès au second essai, sans cause établie. La recette **sur téléphone physique** et la comparaison artistique avec la capture de référence restent impératives. Ne pas écrire « GO graphique Android » sur la seule base de CI.

## Livraison confirmée — 23 novembre 2026

- **PR #86 fusionnée :** https://github.com/MAthiks/Rogov-Android/pull/86
- **Commit final validé de la branche :** `94878a3b0af9faaaedc396f16fc3ea0823894a31`.
- **Commit squash dans `main` :** `1128ad2796446f3d7b7e359bf4ebcb8ae0233c07`.
- **Web/Chromium : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45185512651
- **Chrome Android 13 : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45185512603
- **APK Android classique : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45185512637
- **APK WebView moderne : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45185512618
- **Corrections pendant la PR :** un retour à la ligne JavaScript littéral a été corrigé dans `terrain-art.js`. Le test WebView a été instrumenté pour vérifier le PID natif avant une reconnexion ciblée du transport de débogage ; la sauvegarde, les 121 cases, les vues réellement affichées et le mode hors ligne restent contrôlés.
- **Historique WebView :** sur le commit précédent, deux essais ont échoué lors de la reprise d'une sauvegarde avec `CDP WebSocket closed before response` ; sur le commit final, le test complet est vert, **sans déclencher la reconnexion ciblée**. La cause des deux interruptions n'a pas été prouvée. Ne pas assimiler cette adaptation du test à un correctif du moteur ou à un GO physique.
- **Captures Chromium :** run réussi `45183644554` (commit visuel `d8dc165`) : galerie de contrôle avec **22 sprites** (8 sols, 4 rythmes, 3 murs, 4 orientations héroïques et 3 ennemis) et vues 11×11 aux formats 320×640, 360×800, 393×704, 412×915. Les sprites et le moteur sont identiques au commit final ; celui-ci ne modifie que le test WebView.
- **Lecture graphique :** les quatre rythmes ajoutent des accents localisés mais la composition des grandes dalles de base se répète toujours ; l'échelle apparente des personnages et la volumétrie restent éloignées de la référence. Prochaine amélioration utile : repenser la **géométrie des dalles** plutôt que superposer de nouveaux petits traits.
- **QA-106G physique toujours ouverte** : tester sur Android la stabilité WebView hors ligne, la clarté des objets et le contraste en vrai déplacement avant tout GO artistique.
