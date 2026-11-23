# ROGOV — ART-107C : géométrie structurelle des dalles de Nhal

**Date :** 23 novembre 2026  
**Branche :** `feature/art-107c-nhal-flagstone-geometry`  
**Base :** `main` après ART-107B3/B4 — PR #86, commit `1128ad2`.  
**État initial :** code implémenté sur branche, PR et CI à valider avant fusion.

## Problème corrigé

La passe ART-107B3/B4 avait produit huit matériaux de dalles et quatre rythmes décoratifs, mais la **géométrie principale** (position des pierres, formes des blocs, grandes lignes de mortier) était identique partout. Le donjon en mosaïque 11×11 donnait encore une impression d'un même sol répété avec de petites fissures différentes.

ART-107C remplace les lignes principales par **quatre dispositions de vrais blocs** :
1. `large-ashlar` — grands blocs de taille irrégulière.
2. `offset-courses` — assises décalées et joints verticaux excentrés.
3. `long-flagstones` — pierres allongées et rangées horizontales.
4. `broken-masonry` — géométrie abîmée à joints discontinus, sans marqueurs interactifs.

Chaque disposition a une silhouette de pierre et un réseau de mortier uniques dans une cellule 24×24. Les anciens détails ART-106C, ART-107A, ART-107B et ART-107B3 restent comme patine **atténuée** (opacity 0.21) et ne déterminent plus la forme dominante des joints.

## Livraison technique

- Nouveau module autonome `docs/art107c-flagstones.js` : quatre réseaux SVG 24×24, sans RNG, sans lecture du donjon, sans dépendance externe.
- Intégration dans `docs/terrain-art.js` : `floorSvg(variant,rhythm)` dessine désormais ces quatre compositions géométriques.
- **Contrat préservé** : huit matériaux de référence `TERRAIN_SVGS.floor`, quatre rythmes par matériau dans `TERRAIN_FLOOR_RHYTHM_SVGS` (32 sprites), seize masques muraux × trois patines (48).
- La sélection reste celle de `floorRhythmAt(seed,x,y)` déjà déterministe, indépendante du RNG de gameplay et du contenu de la carte.
- Préchargement du module dans `docs/sw.js` (Chrome/PWA/APK WebView hors ligne) et test de syntaxe dans `package.json`.
- `tests/art107c-flagstones.test.mjs` : 4 silhouettes de blocs et 4 tracés de mortier distincts, 32 compositions natives, conformité des SVG, déterminisme, absence de fuite du brouillard, 11×11 et 15×9, préservation de `rogov-web-v1`.
- Galerie Chromium graphique : intitulé mis à jour pour présenter les quatre géométries. Les 22 aperçus existants sont conservés.

## Invariants absolus

- Donjon 11×11 / 15×9, brouillard et cases inconnues, portes, Arche, Faille, pièges, coffres, personnages et ennemis inchangés.
- Aucune mécanique, collision, récompense, génération, règle de combat, déplacement, IA, temps, FOV ni save migration.
- Sprite C encapuchonné et 3 ennemis visibles à taille native 24×24.
- Chrome Android, PWA, APK classique et WebView ; aucun asset distant.
- **PR fusionnable seulement après CI 4/4 et inspection des captures Android** (320×640, 360×800, 393×704, 412×915).

## Évaluation visuelle à vérifier

Les 4 familles de géométrie changent les grandes masses (et pas seulement les gravures), mais le rendu en jeu nécessite inspection réelle : continuité visuelle entre cases, perception des chemins, contraste des personnages, typologie claire des sols face aux pièges, fluidité de l'exploration.

QA-106G reste ouverte sur téléphone physique, surtout le cycle sauvegarde → redémarrage → mode avion → reprise WebView. Le problème intermittent de débogage WebView sur PR #86 n'a pas de cause définitivement confirmée.

## Validation GitHub

- PR : à confirmer.
- SHA vérifié : à renseigner.
- Web/Chromium : en attente.
- Chrome Android 13 : en attente.
- APK classique : en attente.
- WebView moderne : en attente.
- Recette physique : non réalisée.
