# CHECKPOINT — ROGOV UI/ART-099 (20 novembre 2026)

**Projet** : `MAthiks/Rogov-Android`, ROGOV PWA et WebView Android.
**Base stable avant le lot** : ART-097C2 fusionné PR #58, commit `340aa21`;
UI-098B1 (PR #57) et ses panneaux au-dessus du pavé fixés.
**Branche de développement** : `feature/ui-art-099-mobile-focus`.
**État final** : FUSIONNÉ dans `main` le 20 novembre 2026 via PR #59,
commit `0ceb9688851708bff655031c12765b192bf73d1a`.
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

**Résultat CI final de la PR #59 : 4/4 workflows verts** au HEAD
`a52430422fc7d8dd64243591b6ea9f6a5cb5dd8e`.
- [Node + Chromium](https://github.com/MAthiks/Rogov-Android/actions/runs/44742592212) : **394/394** tests Node, **65/65** parcours Chromium.
- [Chrome Android 13](https://github.com/MAthiks/Rogov-Android/actions/runs/44742592226) : vert.
- [WebView Android 13 et vrai APK](https://github.com/MAthiks/Rogov-Android/actions/runs/44742592222) : vert, y compris continuité de sauvegarde et hors ligne.
- [APK Kotlin historique](https://github.com/MAthiks/Rogov-Android/actions/runs/44742592243) : vert.

Les anciens tests de panneaux ont été ajustés pour exiger le vrai
parcours de navigation par tiroir, sans masquer tours, combats,
brouillard ou sauvegardes. L'émulateur WebView était sujet à un
chargement différé : le test attend maintenant la description de
sauvegarde dans l'écran titre, la visibilité de la partie et le
bouton Fermer réellement mesurable. Un re-démarrage d'application
unique ne s'applique qu'à l'absence spécifique de cible CDP ;
tout échec fonctionnel reste bloquant.

**QA-099 — retour utilisateur sur Android réel, le 20 novembre 2026 : favorable.**
Après la fusion, une nouvelle capture montre le cockpit UI/ART-099
dans Nhal : carte prioritaire, six raccourcis, bande de statut et pavé
de déplacement fixe. Après la demande de vérifier Menu, Sac, fermeture
des panneaux et reprise du déplacement, le joueur répond
« Tout s3mble correct ». Il ne signale aucun dysfonctionnement.

**Périmètre précis :** contrôle visuel sur capture et appréciation
globale positive de l'utilisateur. Aucun relevé détaillé geste par geste
ni mesure de FPS ; ni preuve complète d'un cycle hors ligne / sauvegarde
sur cet appareil. Les 5 testeurs × 2 descentes, la validation artistique
globale et la recette étendue restent ouverts. Le GO technique CI est acquis.

## Suite

Une seule PR #59, fusionnée (squash). Pas de nouvelle mécanique ni
portage Godot/PC. Prochaine étape WIP=1 : consolider cette
recette physique initiale, contrôler la distribution PWA et les
sauvegardes/hors ligne sur appareil, puis préparer une petite campagne
joueurs plutôt qu'une nouvelle refonte. Un APK déjà installé ne reçoit
pas cette mise à jour par simple fusion.
