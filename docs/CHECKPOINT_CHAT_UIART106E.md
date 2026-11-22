# ROGOV — Checkpoint de reprise UI/ART-106E

**Date :** 22 novembre 2026  
**Dépôt :** `MAthiks/Rogov-Android`  
**Dernière évolution gameplay/graphismes fusionnée :** UI/ART-106E — PR #81, commit `790c7654ec1f3d62e3808706599161d2c05046bc`.  
**CI :** 4/4 workflows sur le commit tête `3cb548b1b49d8940cfab58a0d2787b9bbaf992bb` (Chromium, Chrome Android 13, APK, WebView moderne).  
**Roadmap :** actualisée sur main après fusion.

## Bilan cumulé des écrans Nhal

- UI/ART-106A (#76) : bannière, tour/profondeur, 3 cartouches PV/END/Sac, carte encadrée, six onglets, dock D-pad, raccourcis et Actions réels.
- UI/ART-106B (#77) : gravures et métal forgé, patine/ombre, sprites Bandage et Tonique.
- ART-106C (#78) : sol/murs/piliers 24×24, torches et ombres locales connues seulement.
- ART-106D (#79) : Sprite C (quatre faces), trois créatures existantes, coffres, portes, Arche et Faille vert acide.
- UI/ART-106E (#81) : `uiart106e.js` calcule la largeur de la carte à partir des dimensions de l'écran et du dock ; `uiart106e.css` compacte la composition en gardant 44 px tactiles ; `art106e-cavern-bridge.svg` habille les vides du tutoriel sans générer de cases fictives.

## Tests et limites

- 4/4 pipelines verts sur la PR #81 ; minMap 214 px sur 320×640, 11×11 et 15×9 non déformés.
- Sauvegarde `rogov-web-v1`, moteur, carte, IA, fog, tours, clavier, PWA hors ligne et APK intacts.
- **Captures générées par Chromium** dans l'artefact `qa096-chromium-portraits` du workflow [DEV-080 — PR validation](https://github.com/MAthiks/Rogov-Android/actions/runs/45053865229) : `qa106e-deep-11x11-320x640.png`, `qa106e-deep-11x11-393x704.png`, `qa106e-tutorial-360x800.png` et autres formats.
- Tests automatisés ≠ validation esthétique sur téléphone physique. La référence haute résolution montre plus de détails que les sprites actuels 24×24 ; la correspondance pixel par pixel n'est pas atteinte.

## Priorité proposée pour la suite

**UI/ART-106F — Refuge Veyr et panneaux secondaires**, puis **QA-106G — revue graphique réelle sur téléphone Android**. Conserver l'écran Nhal tel qu'il est jusqu'à comparaison sur appareil, éviter de réouvrir des travaux sur les sprites sans capture attestant du problème.

## Instruction de reprise

Lire `ROADMAP.md` et ce checkpoint, inspecter `main` avant nouvelle branche. Pour chaque lot : développer réellement, ajouter tests et captures, vérifier quatre CI, puis fusionner une PR. Ne pas prétendre qu'une illustration a été mise en jeu si elle n'est pas reliée au code.
