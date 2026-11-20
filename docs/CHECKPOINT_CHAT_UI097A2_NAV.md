# CHECKPOINT — ROGOV UI-097A2 : Carte et navigation (20 novembre 2026)

**Repo :** `MAthiks/Rogov-Android`.
**Base :** main `44a4a9f7ebddf551d459d465218e577b55561013`.
**Dernier merge vérifié :** UI-097A1 / PR #50, `5951506` ;
373/373 Node, 54/54 Chromium, Chrome Android 13 et APK réussis.

## Lot fusionné — UI-097A2, navigation sous la carte

PR #51, fusion `38323e45ddbf28006571d89205d1770bfe07ac7a`,
branche `feature/ui097a2-map-first-navigation`. Le module de
présentation `docs/ui097a2.js` déplace les **véritables** six raccourcis
et l'alerte `ui096-threat-banner` après la carte graphique/ASCII.
Leur place d'origine est restaurée sur desktop et au clavier.
CSS `docs/ui097a2.css` pour la barre tactique, six touches ≥44 CSS px
et absence de chevauchement du dock. Test Node dédié et Playwright
trois portraits, y compris attaque imminente, mode ASCII et tiroir Sac.

**Aucun nouveau gameplay :** 11×11, Sprite C 24×24, moteur HTML/CSS/JS,
fog/secret, save `rogov-web-v1` schéma 1, PWA offline et APK inchangés.

## Gates

`test-web`, `android-web`, `build` verts avant fusion et inspection
des captures 320×640, 360×780, 393×704. Ne pas revendiquer de test
physique Android sans retour. DA 6/10 et alpha 7,5/10 provisoires,
5 participants × 2 descentes non réalisés. Puis ART-097B personnages
et ART-097C éclairages selon priorité.

Voir `docs/UI097A2_MAP_FIRST_NAVIGATION.md` et `ROADMAP.md`.

## Bilan final confirmé

375/375 tests Node, 56/56 Chromium, Chrome Android 13 et APK
émulés verts. Captures 320×640, 360×780, 393×704 : carte 11×11,
footer de six raccourcis entièrement au-dessus du pavé fixe ; aucune
nouvelle mécanique ou incompatibilité de sauvegarde introduite.
QA sur téléphone physique et tests utilisateurs restent ouverts.
**Prochaine étape :** ART-097B personnages / puis ART-097C ambiance.
