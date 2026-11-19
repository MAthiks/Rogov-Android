# CHECKPOINT — ROGOV UI/ART-097A2 (20 novembre 2026)

**Repo :** `MAthiks/Rogov-Android`.
**Priorité :** reproduction fidèle de la maquette dark fantasy **dans le vrai jeu**, jamais comme écran statique.
**Statut à la création de ce checkpoint :** PR ART-097A2 en préparation ; **ne pas annoncer fusion ni QA réussie avant les workflows**.

## Merges confirmées
- UI-096D, PR #47, merge SHA `9596f9f402d887705fa9e84eadbc9dca884ea7ee` ; `test-web`, `android-web`, `build` verts.
- ART-097A1, PR #48, merge SHA `2ab130a709d3498ce7aefb195632ddee19f2d2e3` ; 367/367 Node, 53/53 Chromium, Android Chrome 13 et APK (automatisés) verts.

## Développements actifs
**ART-097A2 — haute fidélité des interactifs existants :**
`docs/interaction-art.js` : portes ouverte/fermée, coffre intact/ouvert,
Arche et Faille enrichis de détails structuraux 24×24. Garder exactement
15 clés d'art, 4 états des pièges inchangés, brouillard et sauvegardes intacts.
Fichiers de tests dans `tests/art097a2-interactives.test.mjs`, nouveau cache
hors ligne et contrat `docs/ART097A2_INTERACTIVE_ASSETS.md`.

## Contrats immuables
- `SAVE_KEY=rogov-web-v1`, schéma 1, génération procédurale, même gameplay
  tactique et combat, même tour, aucun RNG supplémentaire.
- Pas de sprite sur case inconnue, pas de fuite des secrets/pièges, sélection
  des masques aux voisins connus uniquement.
- Sprite C encapuchonné quatre directions ; ASCII, PWA hors ligne, APK Android.
- Ne pas commencer Godot/PC pendant le cycle artistique.
- Aucun test physique Android ni campagne de 5×2 descentes revendiqué.

## QA et suite
Attendre `test-web`, `android-web`, `build` verts, comparer les screenshots
Chromium à 320×640, 360×780, 393×704 ; tester visuellement ouvert/fermé,
plein/vide, Arche/Faille, pièges, sauvegardes et tactile sur Android réel
avant d'augmenter la note DA 6/10 ou l'Alpha provisoire 7,5/10.
Prochaines priorités après validation : ART-097B personnages puis UI-097A
interface et ART-097C ambiance, WIP=1.

## Références
- [ROADMAP](../ROADMAP.md)
- [QA-096](QA096_ANDROID_VISUAL_RECIPE.md)
- [ART-097A1](ART097A1_STONEWORK_IMPLEMENTATION.md)
- [ART-097A2](ART097A2_INTERACTIVE_ASSETS.md)
