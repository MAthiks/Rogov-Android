# CHECKPOINT — APK-098A et QA-097, 20 novembre 2026

**Dépôt :** `MAthiks/Rogov-Android`.
**Base :** `main 3abf81f7e0d2b8c565993b02137e03206aeb515e`.
**Dernière fusion confirmée : APK-098A / PR #56**, commit
`ae68c5ecde8a49692a3528c8d3dfd7283fec78c7`.
**Précédent :** QA-097 / PR #55, 385/385 Node et 60/60 Chromium.
**GO technique** du nouveau package WebView Android 13 ; **NO-GO artistique**
sans retour sur un vrai téléphone.

## Découverte bloquante pour distribution APK moderne

L'APK `com.rogov.android.compat` construit par
`android-debug.yml` est **le prototype Kotlin v0.1.x** ;
la capture d'émulateur montre `Prototype v0.1.1`. Les améliorations
UI/ART-097 sont sur la **PWA**, testée dans Chrome Android, mais
pas dans ce package Kotlin. Ne pas proposer l'artefact COMPAT
comme la version Android graphique actuelle.

## Chantier de correction isolé

Branche `feature/apk098a-current-pwa-shell` :
nouveau module Gradle `:webapp`, identifiant séparé
`com.rogov.webapk`. Une WebView locale HTTPS via AssetLoader
charge directement les fichiers `docs/` (JS ES modules + sprites
réels), sans changement du moteur, du 11×11, des actions, des
sauvegardes du jeu ou des règles de brouillard.
Tests PR : build/signature APK, installation, CDP vérifiant le titre,
sprite C, 121 cases, vrais panneaux, ASCII, reprise après kill,
hors ligne ; capture Android de contrôle.
PWA Chrome : toujours disponible et inchangée.

**Sauvegardes :** même clé logique `rogov-web-v1` mais
origine/appareil **séparé**. Aucune migration automatique
depuis Chrome ou le prototype Kotlin ; ne pas désinstaller
ni effacer les données actuelles.

**Statut :** module Android WebView modernisé fusionné ; quatre workflows
PR verts. Le test réel sur téléphone et la signature de distribution
restent ouverts. Ne pas assimiler debug APK à une release stable.
Après réussite des tests, contrôle physique utilisateur du nouvel
APK, puis tests 5×2. Voir `docs/APK098A_CURRENT_PWA_ANDROID.md`.

## Livraison vérifiée

- PR #56 fusionnée dans `main`, issue du module `:webapp` ;
  ancien module COMPAT conservé.
- [Workflow modern-apk Android 13](https://github.com/MAthiks/Rogov-Android/actions/runs/44714799523)
  réussi, plus `test-web`, `android-web` et `build` verts.
- Tests CDP effectifs : tutoriel 135 cases, Nhal 121 cases, Sprite C,
  six accès, panneau Sac, ASCII, sauvegarde après kill et fonctionnement
  offline après désactivation des réseaux.
- Capture native de la nouvelle UI inspectée ; APK debug distinct
  `com.rogov.webapk`, version `0.7f-qa098a`.
- Les sauvegardes Chrome/PWA restent liées à un **autre domaine** ;
  aucune migration automatique. Les builds debug successifs n'ont pas
  encore de chaîne de signature stable. Ne pas désinstaller de version
  en cours d'utilisation.
- **Suite immédiate :** recette physique Android du nouvel APK sur
  une nouvelle partie de test, sans toucher à la PWA et à ses saves,
  puis signature de publication et 5×2 utilisateurs.
