# CHECKPOINT — ROGOV UI-097A1 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`. **Base main vérifiée :** `163a8ac94b94a9a53f14eb1a0a06d6f83666dd7a`.

## Derniers lots fusionnés et publiés
- **UI-096D / PR #47** : fusion `9596f9f` ; plus de place pour la carte,
  gestion des alertes imminentes sans doublon.
- **ART-097A1 / PR #48** : fusion `2ab130a`, pierre de Nhal en 54
  variantes, 367/367 Node et 53/53 Chromium, Android 13/APK verts.
- **ART-097A2 / PR #49** : fusion `0cfacd0`, états porte/coffre/Arche/
  Faille, 370/370 Node et 53/53 Chromium, Android 13/APK verts.
- GitHub Pages et APK de `163a8ac` **réussis** en CI.
- **Aucun test physique par l'assistant** ; QA humaine et 5 joueurs × deux
  descentes encore ouverts.

## Chantier en cours — UI-097A1
**Branche :** `feature/ui097a1-nhal-cockpit-fidelity`.
**Statut :** code, tests, documentation intégrés sur branche ; résultat PR
et CI à compléter après vérification, **ne pas prétendre fusionnée**.

`docs/ui097-nhal-frieze.svg` : ruines originales décoratives.
`docs/ui097a.css` : bandeau ROGOV, HUD bronze, jauges,
raccourcis et dock existants, cadre de carte. `docs/index.html` : vraie
section-head avec marque ROGOV sans dupliquer boutons et stats. Cache PWA
versionné et test Node `tests/ui097a1-cockpit.test.mjs`.

## Contrat
WIP=1, jeu Android HTML/CSS/JS inchangé, Sprite C capuche quatre directions,
cases 24×24, carte 11×11, brouillard/secret, 6 vrais raccourcis, commandes
≥44px, ASCII, sauvegardes `rogov-web-v1` schéma 1, offline, extraction/Rappel.
Godot/PC en attente. Ne pas ajouter de mécaniques.

**Contrôles :** `test-web`, `android-web`, `build` verts avant fusion ;
examiner les captures Chromium 320×640, 360×780, 393×704 et l'accessibilité
des touches. Recette physique et campagne 5×2 distinctes.
Voir [contrat UI-097A1](UI097A1_COCKPIT_FIDELITY.md) et [ROADMAP](../ROADMAP.md).
