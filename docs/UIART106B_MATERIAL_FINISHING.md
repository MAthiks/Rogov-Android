# UI/ART-106B — forge, patine, profondeur des cadres et icônes

**Date :** 22 novembre 2026  
**Base :** UI/ART-106A, PR #76 fusionnée, commit `0bc9384`  
**Statut :** lot matériaux développé sur branche dédiée, QA CI à valider.

## Objectif esthétique

Continuer à faire converger l'écran Nhal **réel et jouable** vers le screenshot utilisateur du 22/11/2026 : métal noirci, fer buriné, bronze à filet d'or, pierre taillée, panneaux à facettes, boutons actifs incandescents, contraste chaleureux de la lampe contre le noir bleuté des profondeurs.

## Apports de ce lot

- Nouveau fichier `uiart106b.css` chargé **après** le CSS de disposition `uiart106a.css`, uniquement sur Nhal mobile.
- Nouveau cadre neuf tranché en neuf morceaux `art106b-gilded-frame.svg` (96×96, centre transparent). Le bord métallique n'est **pas** une image de carte ni un overlay sur les tuiles. Il sert au cartouche Tour, aux panneaux de ressources, à la bordure de carte, aux six onglets, au bouton Actions et au petit menu contextuel.
- Panneaux travaillés en couches mates, reflets, rainures, gradients de pierre et accent or vieilli.
- Ressources PV/END : barres moteur d'origine, même contraste rouge/ambre ; seules ombres et finitions changent.
- `art106b-bandage.svg` et `art106b-tonic.svg`, nouveaux sprites illustrés 48×48 locaux utilisés par `::before` des boutons **déjà fonctionnels**. L'utilisation d'un objet reste entièrement gérée par le moteur et ne change pas.
- D-pad en ardoise massive, touche d'attente en bronze circulaire, bordures pressées et focus lisible.
- Bandeau de menace renforcé **uniquement quand l'alerte moteur réelle est affichée**.

## Contraintes

**Interdictions préservées :** pas d'image-écran figée, pas d'élément de décor superposé à une case de la carte, pas de nouvelle capacité ou nouvel objet fictif, pas de modification des collisions, du rendu du brouillard, des tours, du combat, de `docs/game.js` ni de `rogov-web-v1`.

Compatibilité PWA offline : le précache change de version et inclut les quatre nouveaux fichiers. La build APK classique et la WebView moderne lisent les mêmes fichiers.

## Recette

- [ ] Tester `npm run check:web` et `npm run test:web`, dont `uiart106b-materials.test.mjs`.
- [ ] Vérifier captures Chromium `qa106b-nhal-360.png`, `qa106b-nhal-412.png` et adaptation 320×640 / 393×704.
- [ ] Vérifier les six boutons, les quatre directions, Attendre, soin et Actions au doigt sans perte de contrôle.
- [ ] Vérifier que menu Actions ouvert/fermé ne change pas `rogov-web-v1`.
- [ ] Vérifier que couleurs et cadres ne révèlent rien derrière le brouillard.
- [ ] Vérifier les quatre CI (Web/Chromium, Chrome Android 13, APK classique, WebView moderne).
- [ ] Comparer **sur téléphone physique** la capture réelle au screenshot cible.

## Suite

**ART-106C** : vrai enrichissement du tileset et des décors internes de Nhal (sols, murs volumétriques, piliers, torches), en préservant chaque état de visibilité. **ART-106D** : personnages, ennemis, coffres, failles, Arche. La convergence vers le screenshot ne peut être affirmée complète à la fin de ce seul lot matériaux.
