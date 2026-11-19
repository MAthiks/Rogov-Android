# UI-096D — Corrections de lisibilité après deux captures Android

**19 novembre 2026 — Lot correctif, sous recette CI + Android réel.**  
**Source humaine :** deux captures de ROGOV envoyées dans le chat après UI-096C, écran Nhal avec « 1 HOSTILE VISIBLE » et refuge Veyr avec coffre de 5 Fragments. Les captures ne sont pas copiées dans ce dépôt : images fournies dans la conversation, **pas des tests tactiles effectués par l'assistant**.  
**Base :** QA-096 / [PR #46](https://github.com/MAthiks/Rogov-Android/pull/46), qui fournit les captures Chromium et Android 13 émulé. QA-096 technique est intégré ; **GO esthétique et 5 testeurs × 2 descentes restent ouverts**.

## Constats directement visibles

1. **Nhal : la carte est trop timide sur les hauteurs courtes.** À 393×704 en Chromium, elle occupe 211 px de large, soit 19 px/case ; à 320×640, 192 px, soit 17 px/case. Les captures utilisateur confirment la disproportion entre le jeu et les panneaux. **Sévérité P1 ergonomique à confirmer après correction.**
2. **Nhal : alerte redondante.** « 1 HOSTILE VISIBLE » figure déjà dans `#threat-state`, puis une deuxième fois dans `#ui096-threat-banner` alors qu'aucune attaque imminente n'est indiquée. **P1 densité visuelle.**
3. **Veyr : accès Préparer/Forge/Échos/Égaré repoussés sous la première fenêtre**, en raison du grand masthead, d'une grille de quatre informations sur deux lignes, de la bannière puis du briefing. Le CTA de départ reste bien visible et ne doit pas être déplacé. **P1 parcours.**
4. **Veyr : sous-titre encore « WEB ALPHA 0.6.1 »** alors que la page de titre annonce 0.7f. **P2 incohérence.**
5. **Nhal : jauge d'Endurance trop verte et saturée sur Chrome Android**, en désaccord avec la palette pierre/turquoise froid. **P2 cosmétique.**
6. **Sprites 24×24 et intentions :** les éléments sont présents dans la capture mais leur reconnaissance spontanée par des testeurs n'est pas encore connue. Pas de recoloration ni de changement des états avant retour qualitatif.

## Correctifs UI-096D

- Nouveau fichier CSS additif `docs/ui096d.css?v=1` après UI-096C. Sur Android portrait de hauteur ≤760 px : carte `min(100%, calc(100dvh - 420px), 430px)`, avec réserve supplémentaire lorsque la véritable prévision d'attaque imminente est visible `calc(100dvh - 462px)`. Les panneaux, commandes, boutons et handlers existants restent intacts. La carte reste 11×11 et le dock garde ses cibles ≥44px.
- `docs/ui096.js` : ne plus doubler le nombre d'ennemis visibles ; conserver le bandeau seulement lorsqu'une prévision ennemie réellement visible est imminente. La donnée vient toujours des nœuds DOM filtrés par le brouillard. **Aucune menace cachée n'est projetée.**
- Veyr Android : masthead resserré, retrait du sous-titre **seulement visuel** (le texte source reste), niveau/XP/extractions sur une ligne, bannière un peu moins haute et marges contrôlées. Les quatre boutons et le vrai coffre/forge restent inchangés ; la fiche unique demeure accessible.
- `docs/index.html` : sous-titre historique corrigé vers `WEB ALPHA 0.7f`; pas de version de gameplay modifiée.
- Endurance : valeur réelle conservée, teinte turquoise assourdie via contrôles de progression CSS.
- PWA `docs/sw.js` : nouveau nom de cache et préchargement local du CSS UI-096D. Sauvegardes `rogov-web-v1` / schéma 1 inchangées.

## Contrat de recette

1. **Node :** nouvelle suite `tests/ui096d-compact.test.mjs`, anciennes assertions de doublon mises à jour, non-mutation de l'état.
2. **Chromium :** 320×640 et 393×704 → carte agrandie, aucune carte sous dock, aucun défilement horizontal, commandes ≥44px ; 393×704 menace imminente → bandeau présent et carte toujours au-dessus du dock ; 360×780 et 393×704 Veyr → navigation accessible plus tôt, CTA visible, stats toujours réelles.
3. **Android 13 Chrome émulé / APK :** les workflows PR doivent passer. Captures QA-096 de la PR à comparer avec les images utilisateur avant arbitrage.
4. **Android physique :** reprendre des captures des deux écrans après publication, avec présence d'un ennemi, puis vérifier en manipulant pendant au moins deux descentes que le geste de soin, le déplacement, l'interaction, le menu, l'extraction et le Rappel sont sûrs et lisibles.
5. **Invariants :** aucune modification moteur / équilibrage / rng / fog / statistiques / sprites C / objets / capacité du sac / ASCII / sauvegarde. Tests humains et GO artistique **non revendiqués**.

## Décision studio

Développer et fusionner UI-096D **uniquement si** `test-web`, `android-web`, `build` sont verts et si le rapport de géométrie montre les bonnes proportions. Maintenir Alpha 7,5/10, direction artistique 6/10 provisoires jusqu'à validation physique et 5 testeurs × 2 descentes. Ne pas ouvrir de nouveau lot fonctionnel.

## Incident CI pendant la recette (résolu côté protocole, nouvelle CI à vérifier)

Le premier passage de la PR #47 a obtenu `test-web=success` et `build=success`, mais `android-web=failure` : les **neuf scénarios Android 13 précédents ont réussi**, puis `page.screenshot()` a dépassé les 30 s sur le Chrome 109 de l'émulateur pendant la capture de Veyr. Aucune erreur fonctionnelle du jeu n'est remontée dans ces neuf parcours. Pour éviter qu'une panne facultative de la voie CDP fasse échouer des assertions ergonomiques, les deux captures Android sont désormais **best effort avec délai borné** ; la validité du refuge, les 121 cellules, la présence du PJ, le non-recouvrement, l'absence de défilement horizontal et une largeur minimale de carte **275 CSS px** en 393×704 restent des assertions bloquantes. Les six captures Chromium de QA-096 et les captures réelles fournies par l'utilisateur constituent les références visuelles principales ; ne pas affirmer que les deux nouveaux PNG Android existent sans vérifier l'artefact. Relancer les trois jobs sur le dernier commit avant fusion.
