# CHECKPOINT — ROGOV UI/ART-099 (20 novembre 2026)

**Projet** : `MAthiks/Rogov-Android`, ROGOV PWA et WebView Android.
**Base stable avant le lot** : ART-097C2 fusionné PR #58, commit `340aa21`;
UI-098B1 (PR #57) et ses panneaux au-dessus du pavé fixés.
**Branche** : `feature/ui-art-099-mobile-focus`.
**Décision utilisateur** : « Oui. On y va ! Pouvons nous faire un gros bloc d'un coup exceptionnellement »,
après deux captures Android montrant Nhal et ses sections Combat/Sac accessibles
au défilement mais occupant une longue page.

## Un seul chantier exceptionnel

1. **Carte d'abord** en portrait ≤730px : seuls la carte, HUD réel,
   menace visible, six accès rapides et contrôles tactiles permanents
   occupent le parcours principal. Les autres interfaces ne sont plus
   dupliquées sous la carte.
2. **Vrais tiroirs UI-092/UI-098B1** : Combat, Sac, Journal et Rapport,
   sans clone et avec les écouteurs d'origine.
3. **Menu = informations** : fiche PJ, objectif, inspection, mini-carte
   et légende déplacés dans le vrai Menu sans changement de game state.
   Ils retournent aux emplacements historiques sur bureau/refuge.
4. **Retour d'information** : bande courte sous les raccourcis, qui
   reprend l'action déjà affichée et l'intitulé d'inspection d'une case
   visible. Aucune information de brouillard ajoutée.
5. **Matières** : sols plus sobres et murs aux plans contrastés sur
   l'atlas actuel 54× SVG 24px ; Sprite C inchangé.
6. **Sauvegardes/compatibilité** : HTML/PWA/WebView/ASCII, schéma 1,
   aucune mécanique ni nouveau tirage aléatoire ; cache hors ligne
   révisé.

[Contrat de recette](UI_ART_099_ANDROID_MAP_FOCUS.md).

## Vérification

Nouveau `tests/ui099-focus.test.mjs` inclus à Node ; QA Chromium
`tests/mobile-browser.test.mjs` étendue aux trois résolutions, au
Menu original, au Sac et aux vraies actions de combat.
Les tests d'exploration existants sont adaptés au nouveau chemin
explicite « Combat » lorsque nécessaire.

**À consigner après retour CI :** résultats détaillés des quatre
workflows Node/Chromium, Android Chrome 13, WebView 13, APK historique ;
capturer les échecs éventuellement reproductibles ; ne pas
attribuer de validation sur le vrai Samsung sans nouvelle réponse.

## Suite

Une seule PR ; pas de nouvelle mécanique, pas de portage Godot/PC.
Après CI : inspection captures, Android physique, décision de fusion,
puis recette des sauvegardes et de l'APK principal actualisé.
