# CHECKPOINT — ROGOV QA-097 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`.
**Base auditée :** `main 87c8fdacfad7113713936b3210f4fb467854dec3`.
**Dernier chantier fusionné :** ART-097C1, PR #54, `1dca3fd`,
GitHub Pages et build APK publiés ; **385/385 Node et 59/59 Chromium**
sur la PR, Chrome Android 13 et APK émulateurs verts.

**Branche QA fusionnée :** `qa/qa097-android-acceptance`, PR #55,
commit `903ec158a97d7b3a3d5dfd413e32cb4d79c6af1f`.
**Statut : GO technique automatisé, NO-GO artistique** ; aucun test
physique ni résultat 5×2 revendiqué.

## Lot QA-097

- Pas de changement de gameplay, graphismes, moteur, cache PWA,
  sauvegardes ou sources HTML/CSS/JS du jeu.
- `tests/mobile-browser.test.mjs` : trois portraits Chromium
  320×640 / 360×780 / 393×704 avec 13 centres de touches **réellement**
  ciblables par `elementFromPoint`, ≥44×44 CSS px, carte 11×11 sans
  occlusion, brouillard et effets visuels sans fuite.
- 22 rendus de carte réels par format : médiane/p95/max mesurés
  uniquement à titre diagnostique. Vérification save et numéro
  de tour immuables, une seule silhouette PJ.
- Livrables : `qa096-screenshots/qa097-report.json` et captures
  `qa097-nhal-WxH.png` depuis GitHub Actions.
- `docs/QA097_ANDROID_ACCEPTANCE.md` : recette technique et physique,
  critères de GO/NO-GO P0/P1/P2.
- `docs/QA097_FIELD_REPORT_TEMPLATE.md` : fiche à compléter sur vrai
  téléphone et par 5 participants × 2 descentes.

## Décision du studio

Aucun score nouveau ni « qualité commerciale » attestée avant
manipulation Android réelle. GO technique constaté après trois CI verts
`test-web`, `android-web`, `build`, mais **NO-GO artistique**
tant que l'ergonomie, l'autonomie/fluidité et les sessions 5×2 ne
sont pas constatées. Les notes provisoires DA **6/10** et Alpha
**7,5/10** ne doivent pas changer sans preuves humaines.

**Suite :** inspecter les artefacts, trier les défauts réels,
corriger un lot UI/ART prioritaire si nécessaire, puis valider avec
l'utilisateur. Le portage PC/Godot reste reporté.

## Résultats automatiques vérifiés — QA-097

- `test-web` : **385/385 Node**, **60/60 Chromium**.
- `android-web` : Chrome Android 13 émulé **succès**.
- `build` : APK émulé **succès**.
- 320×640 : carte 220 CSS px, largeur minimale de touche 47 px,
  médiane/p95 0,9/1,6 ms.
- 360×780 : carte 335,4 CSS px, largeur minimale de touche 52,5 px,
  médiane/p95 0,8/1,6 ms.
- 393×704 : carte 284 CSS px, largeur minimale de touche 57,3 px,
  médiane/p95 0,8/1,5 ms.
- Les 13 centres tactiles touchables à chaque format, hauteur minimale
  44 px ; 44 cases non visibles dans chaque scène, zéro fuite
  de lumière/ennemi, 22 redraws sans modification de save ou tour.
- Artefact `qa096-chromium-portraits` du
  [run 44706385938](https://github.com/MAthiks/Rogov-Android/actions/runs/44706385938).

**Les temps de redraw sont un diagnostic Chromium CI et non des FPS
de l'appareil.** Après ce lot, vérifier le déploiement `main`
indépendamment, demander la recette physique et la campagne 5×2.
Ne pas déclarer un GO artistique à partir de cette CI.

## Retours physiques utilisateur — Android réel (20 novembre 2026)

**Observations déclarées directement par le testeur**, à distinguer de
la CI et d'une campagne de validation complète :

- ROGOV graphique s'ouvre sur Android et affiche Nhal, Sprite C,
  les ennemis, le HUD et les commandes ; deux captures des menus ont été
  fournies dans la conversation QA.
- Pavé directionnel : déplacements **fluides et réactifs** selon le retour.
- Menus **Combat** et **Sac** : ouverture, fermeture par « Fermer », puis
  reprise normale des déplacements **confirmées**.
- Sauvegarde : fermeture complète de l'application puis relancement ;
  la partie reprend **là où elle avait été laissée**, confirmé par le testeur.
- **Défaut UI-098B1 à corriger :** pavé directionnel fixe visiblement
  superposé au bas des panneaux ; dans le Sac, le texte « Ton sac est vide »
  est partiellement masqué. Contrôler le défilement complet des menus
  et les boutons avec du contenu plus long. Priorité P1 potentielle.

**Non vérifiés sur appareil physique :** reprise sur ancienne sauvegarde
avant APK-098A, intégrité après mise à jour, persistance après extraction,
autonomie/FPS chiffrés, cas de combat complets, 5 testeurs × 2 descentes.
**Décision :** sous-contrôles physiques ci-dessus réussis ; **NO-GO
artistique global maintenu** jusqu'aux corrections et essais restants.
