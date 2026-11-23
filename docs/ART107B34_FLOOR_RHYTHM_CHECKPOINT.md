# ROGOV — ART-107B3/B4 : rythme des sols, sites et silhouettes

**Date de développement :** 23 novembre 2026  
**Branche :** `feature/art-107b34-floor-rhythm-readability`  
**Base :** `main` après fusion ART-107B1/B2 — PR #85 (`0e4f3be`).  
**État :** implémentation intégrée à l'atlas de développement ; validation CI et QA à renseigner avant fusion.

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

## Statut à compléter après CI

- PR : à renseigner.
- Commit final testé : à renseigner.
- Captures contrôlées : à renseigner.
- Fusion : **interdite tant que tous les contrôles ne sont pas verts**.
