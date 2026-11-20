# CHECKPOINT — ROGOV ART-097C1 — Lumières de Nhal

**Date :** 20 novembre 2026.
**Dépôt :** `MAthiks/Rogov-Android`.
**Dernier merge confirmé :** ART-097B2 / PR #53, `abdf705`, suivi
`3fc1150` et workflows de publication Web/APK réussis.
**Branche active :** `feature/art097c1-visible-lighting`.
**Statut :** lot en PR, ne pas annoncer fusion ni tests réalisés avant
confirmation GitHub.

## Travail réel sur les sources

- `docs/nhal-lighting.js` : applique ambre originale SVG 24px,
  déterministe `terrainHash%13`, uniquement sur un mur visible qui
  touche un plancher visible ; Arche `E` turquoise et Faille `^`
  cramoisie réellement présentes.
- `docs/tiles.js` : applique et couleur uniquement sur les vrais
  éléments `data-knowledge="visible"`, aucun sprite sur une case
  cachée/mémorisée ni champ ajouté au moteur.
- `docs/art097c1.css` : ombrage local statique d'une seule case,
  sans animation, filtre, particules ni toucher des commandes.
- `docs/sw.js`, `docs/index.html`, `package.json` : installation
  et cache offline, versions PWA et tests.
- `tests/art097c1-lighting.test.mjs`, `tests/mobile-browser.test.mjs`
  : fog Proxy, déterminisme, image Chromium 11×11 torche/arche/faille,
  aucune consommation de tour/sauvegarde.

## Invariants

Capuche Sprite C quatre directions, 24×24, trois ennemis, 11×11,
SVG terrain/interactions réels, actions, tours, FOV, brouillard
et sauvegarde `rogov-web-v1` schéma 1, ASCII, Web/PWA/APK,
Godot/PC reportés.

## Validations et suite

Trois workflows `test-web`, `android-web`, `build` et
inspection des captures exigés avant fusion.
**Pas de test physique Android revendiqué** et campagne 5×2 ouverte.
Après validation du lot : QA-097, recette esthétique et fluidité
sur Android réel, avant d'empiler de nouveaux effets.
Références : [ART-097C1](ART097C1_VISIBLE_LIGHTING.md), [ROADMAP](../ROADMAP.md).
