# CHECKPOINT — ROGOV ART-097B2 (20 novembre 2026)

**Repo :** `MAthiks/Rogov-Android`.
**Dernier lot fusionné : ART-097B2 / PR #53**, commit
`abdf705d595d4d99a5acbdd7d6de979e2ad28d74`.
**Précédent :** ART-097B1 / PR #52, `58e981a`.
**Branche fusionnée :** `feature/art097b2-turn-bound-motion`.

## Changement

Animations CSS en un cycle uniquement après changement réel de tour :
- Sprite C : pas de 180 ms sur mouvement cardinal valide.
- Charognard, Gardien et Larve : réactions 170–200 ms, **3 ennemis
  visibles maximum**, aucune consultation des ennemis invisibles.
- Préférence réduire les animations : aucune animation.
- Mode ASCII, inspecter, sac, reprise, changement de profondeur : aucun
  effet artificiel. Pas de boucle d'animation ou nouveau PNG/SVG.

`docs/character-motion.js` : signal éphémère pur, non persisté ;
`docs/app.js` : transmet une fois ; `docs/tiles.js` : classes
uniquement sur les bons sprites visibles ;
`docs/art097b2.css` : animation CSS low-cost.
Tests Node et Chromium réels, PWA cache versionné, ROADMAP actualisée.

## Invariants / suites

11×11, 24×24, quatre capuches Sprite C, trois ennemis, brouillard,
ASCII, `rogov-web-v1` schéma 1, gameplay/turn-costs/RNG et touch controls
inchangés. Aucune validation de téléphone physique revendiquée.
Après CI et inspection Chromium : fusion seulement si vert.
Ensuite considérer ART-097C éclairage statique, puis QA physique et
5 testeurs × deux descentes avant score final.
Référence : [ART-097B2](ART097B2_TURN_BOUND_MOTION.md), [ROADMAP](../ROADMAP.md).


## Résultat

Animation activée sur vrai tour selon les tests navigateur, non rejouée après un menu gratuit, une reprise ou un rendu ASCII. Préférence de réduction de mouvement respectée ; trois ennemis visibles maximum animés, aucune case cachée.

**Restent à contrôler :** publication de main, fluidité sur téléphone physique, protocole 5×2. Prochaine priorité : ART-097C, ambiance sans fuite du brouillard.
