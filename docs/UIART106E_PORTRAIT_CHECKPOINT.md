# UI/ART-106E — Composition Android de Nhal, cadrage fidèle à la référence

**Date :** 22 novembre 2026  
**Objectif :** comparer l'écran jouable de Nhal à la capture utilisateur en 393 × 704 (proportions voisines du screenshot d'origine), puis réduire les écarts de cadrage.

## Point de départ vérifié

Les anciennes captures Chromium `qa106c-nhal-360.png` présentaient une **carte du tutoriel 15×9**, avec un large espace noir sous la carte. Cette capture ne décrit pas le cadrage de la véritable profondeur de Nhal **11×11**. Il serait erroné de compenser le ratio du tutoriel en étirant les pixels des tuiles.

Le nouvel audit **ART-106D** construit une véritable expédition multi-étages via `beginRun(state,[],null,{multiFloor:true})`, et enregistre des captures 11×11 à 360×800, 393×704 et 412×915.

## Modifications réelles

- `docs/uiart106e.css` chargé **après** les feuilles UI/ART-106A/B et ART-106C.
- Bouton Menu : icône compacte en fer/bronze, cible tactile **44×44**, vraie action `#jump-menu` toujours reliée au panneau Options. Son libellé source est conservé pour l'accessibilité.
- Bandeau supérieur ramené à environ 59–66 px, tout en préservant la marque ROGOV, la profondeur **réelle** et le tour actuel.
- Cartouches de ressources plus compacts, sans inventer les PV/END.
- Tailles de carte calculées selon la hauteur disponible : léger agrandissement sur les formats courts en récupérant la place du bandeau, **sans jamais déformer le ratio 1:1 des tuiles**.
- Marges des boutons Carte/Combat/À portée/Sac/Rapport/Journal et bandeau de statut réduites, mais zones tactiles préservées.
- Ambiance de ruines noir bleuté autour de la carte, issue du SVG **déjà embarqué** `art103b-nhal-ruins.svg`, plutôt qu'un vide noir sans transition. Pas de masque sur les tuiles, pas de faux adversaire ni lumière derrière le brouillard.
- D-pad et soins restent positionnés en bas de la fenêtre, sans changement de leur mécanique.

## Recette et protections

- [ ] Web : `npm run check:web`, `npm run test:web`, test `uiart106e-portrait.test.mjs`.
- [ ] Capture de la vraie Nhal **11×11**, au minimum `qa106e-deep-11x11-393x704.png`.
- [ ] Toutes les cases restent carrées (tolérance sous-pixel 1.2), aucune animation de décor requise.
- [ ] Bandeau de navigation **entièrement au-dessus** du dock, et carte au-dessus du dock, sur 360×800, 393×704, 412×915.
- [ ] Aucun débordement horizontal, action et menu toujours jouables, tour inchangé lorsque l'on ouvre les options.
- [ ] Les quatre workflows GitHub doivent être verts ; une mesure manuelle sur appareil physique reste nécessaire pour annoncer la fidélité visuelle.
- [ ] Sauvegarde `rogov-web-v1`, combat, portée, IA, progression, invisibilité, génération de niveaux inchangés.

## Dépendance

Ce lot est préparé **sur la branche ART-106D (PR #79)**. Une fois #79 validée et fusionnée, retargeter **106E** sur `main` pour sa propre QA. Ne pas fusionner tant que les contrôles de géométrie et d'accessibilité ne sont pas verts.

## Limite importante

Ce chantier améliore **la composition du vrai écran**, non une reproduction exacte de tous les éléments du screenshot de démonstration. Le screenshot montre une salle et des ennemis spécifiques qu'une expédition procédurale ne garantit pas : il ne faut jamais forcer leur apparition pour fabriquer une fausse similitude.
