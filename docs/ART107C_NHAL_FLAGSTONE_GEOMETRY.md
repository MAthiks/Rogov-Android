# ROGOV — ART-107C : géométrie structurelle des dalles de Nhal

**Date :** 23 novembre 2026  
**Branche :** `feature/art-107c-nhal-flagstone-geometry`  
**Base :** `main` après ART-107B3/B4 — PR #86, commit `1128ad2`.  
**Statut :** PR #87 fusionnée dans `main` après 4/4 CI réussies ; recette sur Android physique QA-106G toujours ouverte.

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

## Validation GitHub — clôture technique du 23 novembre 2026

- **PR #87 fusionnée :** https://github.com/MAthiks/Rogov-Android/pull/87
- **Dernier SHA de branche validé :** `f2cbaf9e1166f430f34ce17beb5ef90cb1231c83`.
- **Commit squash de fusion :** `317b0ae751e42caca775cd0a6f3e01b6f57f9837`.
- **Web / Chromium : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45190585067 — 80/80 interactions Chromium réussies, tests moteur et audits verts.
- **Chrome Android 13 : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45190585301
- **APK Android classique : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45190585196
- **WebView moderne : succès** — https://github.com/MAthiks/Rogov-Android/actions/runs/45190584988, y compris sauvegarde, redémarrage et hors ligne.
- **Correctifs de CI :** l'assertion historique ART-097C2 exigeant l'ancien aplat `#2e3c42` a été remplacée par un contrôle des nouveaux joints et reliefs. Le test WebView a reçu un diagnostic Android explicite si le processus natif disparaît après un rechargement hors ligne ; aucune assertion de reprise n'a été supprimée.
- **Historique WebView à garder :** la première série de ART-107C a de nouveau perdu le PID natif lors d'un rechargement hors ligne, puis la seconde est passée entièrement. Cette instabilité, déjà observée dans ART-107B, n'est **pas démontrée résolue** sur appareil physique.
- **Captures inspectées :** artefact Chromium `qa096-chromium-portraits` ID `14826043439` ; galerie de 22 aperçus avec 4 géométries distinctes et vues du vrai Nhal 11×11 à 320×640, 360×800, 393×704 et 412×915.
- **Mesures Chromium :** au 320×640, carte 264px, navigation 2px sous la carte, dock 27,9px sous navigation ; pas de débordement horizontal. Dans les 3 tailles du rapport QA-097 (320×640, 360×780, 393×704) : 121 cases, `lightLeak=0`, `enemyLeak=0`, sauvegarde et tours inchangés. Ceci est une recette émulée, pas un FPS réel de téléphone.
- **Appréciation graphique :** les quatre lignes de maçonnerie sont réellement différentes et plus lisibles en galerie ; le jeu reste un pixel art sobre, encore moins riche que la capture ambitieuse de référence. Ne pas confondre validation technique et reproduction artistique complète.
- **Statut final :** chantier ART-107C fusionné techniquement ; **QA-106G sur téléphone Android physique et GO graphique final restent ouverts**.
