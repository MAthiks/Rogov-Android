# ART-097B2 — Micro-animations liées aux vrais tours

**Date :** 20 novembre 2026. **État : fusionné dans `main`**, PR #53, commit `abdf705d595d4d99a5acbdd7d6de979e2ad28d74`. Recette physique toujours ouverte.
**Base :** ART-097B1 / PR #52, fusion `58e981a`, publication `761a335`.
**Référence :** maquette UI/ART-097 et [Sprite C](ART_DIRECTION_SPRITE_C_V1.md).

## Principe de production

Le moteur HTML/JS reconstruit la grille SVG après chaque rendu. Animer
chaque apparition dans le DOM provoquerait une animation parasite après
inspection d'un coffre, ouverture du sac ou reprise de sauvegarde.
Le lot utilise donc un **signal de présentation éphémère** créé uniquement
après `result.changed` avec progression réelle du numéro de tour et
**sans changement de profondeur ni de layout**. La transition ne fait
que lire les coordonnées du PJ et deux valeurs de tour.

## Lot livré au code

- `docs/character-motion.js` : fonction pure
  `characterMotionForTurn(beforeRun,afterRun)`; retourne un signal
  gelé `{step,foeTurn}` seulement pour un vrai tour, `step=true` seulement
  pour un mouvement cardinal d'une case. Aucune lecture d'ennemi,
  secret, piège ou brouillard. Aucun champ ajouté au run sauvegardé.
- `docs/app.js` : signal en mémoire passé **une seule fois** au rendu
  graphique et immédiatement oublié. Rendu ASCII, ouverture de menu,
  sauvegarde et écran Veyr n'en bénéficient pas.
- `docs/tiles.js` : la classe `art097b2-step` est affectée seulement
  à la case du PJ réellement visible ; la classe
  `art097b2-foe-turn` à **trois ennemis visibles maximum**, après les
  contrôles du brouillard et le filtre `visible?enemyAt(...):null`.
  Les indices `!`, `…`, `▣`, PV et bordures de ciblage ne bougent pas.
- `docs/art097b2.css` : uniquement des micro-déplacements du sprite :
  pas PJ 180 ms, Charognard 170 ms, Gardien 200 ms, Larve 180 ms,
  `steps(2,end)`, une répétition, sans lueur/filtre/particule.
  Respect intégral de `prefers-reduced-motion: reduce` :
  `animation:none!important`, `transform:none!important`.
- `docs/index.html` et `docs/sw.js` : feuille et module
  précachés en PWA hors ligne via nouveau nom de cache.
- `tests/art097b2-turn-motion.test.mjs` : contrats de mouvement,
  non-mutation, ressources locales, sauvegarde/fog et palette 24×24.
- `tests/mobile-browser.test.mjs` : pas cardinal réel, menus gratuits,
  remise à zéro après rerendu/chargement, préférence réduire le mouvement,
  aucune animation d'une cellule cachée, budget trois ennemis visibles.

## Budget et limites

Le sprite SVG reste rigoureusement **24×24**, sans nouvelle frame, sans
`requestAnimationFrame`, `setInterval` ou timer. Les animations
se produisent uniquement sur des tours dans la carte **graphique** ; pas de
boucle de respiration permanente, pas de particules, ni d'augmentation
des fonctions de combat. C'est une première passe de mouvement
fonctionnellement neutre, et non une animation complète du cycle de marche.

Les gestes/équipements, le brouillard, le FOV, les trois familles ennemies,
les quatre capuches, la carte 11×11, les six raccourcis, les actions,
l'ASCII et `SAVE_KEY=rogov-web-v1` / `SCHEMA_VERSION=1` demeurent inchangés.

## QA avant fusion

- `test-web` vert : tests Node, Chromium Android 320×640,
  360×780, 393×704, clic libre vs vrai pas, toggle ASCII et reprise.
- `android-web` vert : Chrome Android 13 émulé.
- `build` vert : APK signé, installé et lancé sur émulateur.
- Inspecter les captures après modification : aucune déformation de la
  carte, aucun halo de PJ, aucun masque de badge d'intention ou PV ;
  contrôler les tests `prefers-reduced-motion`.
- **Validation physique Android et 5 testeurs × 2 descentes ouverts** :
  les tests automatisés ne certifient pas la fluidité sur appareil réel.

Prochaine passe possible : ART-097C (éclairage statique lié à visibilité
réelle) ou animation de frames supplémentaire seulement si la performance
et l'ergonomie ont été validées humainement.


## Bilan CI

**PR #53, abdf705** : 381/381 tests Node, 58/58 Chromium, Chrome Android 13 en émulateur, compilation et lancement APK sur émulateur réussis. Le test navigateur vérifie un vrai déplacement, l'absence de rejouement après menu gratuit ou rechargement, les trois ennemis visibles au maximum et la préférence de réduction des animations.

Captures Chromium examinées (run 44698633438) : carte 11×11 de largeurs 220 / 335,4 / 284 CSS px en 320×640 / 360×780 / 393×704. Six raccourcis de hauteur minimale 44 CSS px, aucune superposition du dock et pas de défilement horizontal.

**Limite :** les captures statiques ne démontrent pas la fluidité temporelle. Tests physiques sur Android et cinq participants × deux descentes non réalisés par l'assistant. Vérifier séparément la publication de main.
