# ROGOV — QA-104 : audit visuel des quatre écrans Android

**Base examinée :** `main` à `aa0aca397c55a8bc318427be77bb1cbf4386d5ed`, issu des PR #69–#73. Les trois workflows de publication sur ce commit ont réussi (Web/GitHub Pages, APK classique, WebView moderne Android 13). Les tests de navigation réels et les visuels sont issus de l'artefact `qa096-chromium-portraits` du run PR #73 `44960043737`, et de l'artefact GitHub Pages sur `main` `44962665455`.

**Référence visuelle :** planche quatre écrans « ROGOV — UI-096 — Maquettes v3 » fournie dans la conversation. Elle reste un objectif de DA, non une capture du jeu réel. Les captures ci-dessous sont des captures Chromium aux dimensions de téléphone Android, pas une photographie d'un terminal physique.

## Observations vérifiées à partir des captures CI

| Vue | Résultat observé | Écart / action QA |
| --- | --- | --- |
| Nhal | Grille 11×11, PJ encapuchonné, raccourcis et D-pad présents sur 320×640 / 360×780 / 393×704. Décor de ruines visible dans l'en-tête. | Préserver intégralement le champ visible, ne pas agrandir la carte au détriment des touches 44 px ni du brouillard. |
| Veyr | Nouveau panorama nocturne, statuts coffre/Fragments/profondeur et quatre accès, bouton de descente fixe ; texte clair sur le fond. | Le contenu défile sous le CTA volontairement fixé ; tester la navigation vers les panneaux situés au-dessous de la première fenêtre. |
| Sac | Quatre emplacements réels (arme, secondaire, armure, relique), icônes pixel art, actions avec coût en tours et quantité cohérentes, croix fermable. | Une coloration cyan rectangulaire apparaît sur les anciennes captures après le geste tactile. Attendre la fin de la surbrillance transitoire avant les nouvelles captures ; ne pas supposer une erreur gameplay sans preuve. |
| Personnage | Le code et les valeurs de la fiche ont passé la CI ART-103D ; les captures **nommées** `art103d-character-*.png` montrent toutefois le **haut de Veyr**, et non le portrait ni les attributs. | **Défaut de recette identifié.** Après changement de viewport, caler explicitement le document sur l'unique `#actor-stats-sheet`, tester la visibilité du portrait et produire une capture complète de la fiche. |

## Intervention QA-104

Dans `tests/mobile-browser.test.mjs` :

1. Après l'action « Égaré », vérifier que la destination se trouve bien dans la fenêtre Android (l'ouverture du panneau seule ne suffit pas).
2. Avant chaque capture `art103d-character-{320,360,393}.png`, replacer le défilement au niveau de la fiche, attendre un rendu stable et tester que le centre de son portrait n'est pas masqué par le CTA fixe.
3. Produire également `qa104-character-full-{320,360,393}.png` via une capture de l'élément réel, pour voir attributs, aptitudes et le message honnête sur la santé mentale non simulée.
4. Laisser disparaître toute surbrillance tactile temporaire avant `art103c-bag-{320,360,393}.png`.
5. Maintenir toutes les anciennes assertions : sauvegarde `rogov-web-v1` inchangée, 0 tour consommé pour parcourir les panneaux, zones de touche ≥44 px, nombre d'objets et emplacements existants uniquement.

## Conditions de validation

- **Tests Web / Chromium** : nouveau cadrage accompagné de vraies assertions de visibilité. Récupérer le nouvel artefact et examiner les six images.
- **Android 13 Chrome, APK classique et WebView moderne** : les pipelines existants doivent rester verts.
- **Téléphone Android physique :** contrôle utilisateur encore à réaliser, notamment lisibilité en lumière extérieure, gestes, animation des transitions, poids des assets et bouton de retour. Une CI verte ne permet pas de déclarer cette étape matérielle acquise.
- **Écart esthétique restant :** la maquette marketing possède de grands décors peints et des personnages plus détaillés que les assets actuels. Ne pas proclamer un « rendu identique » sans comparaison réelle.

**Nature du lot :** tests et preuves visuelles. Aucun changement de `docs/game.js`, `docs/app.js`, des sprites, du brouillard, de la direction artistique CSS, des actions, ou des sauvegardes.
