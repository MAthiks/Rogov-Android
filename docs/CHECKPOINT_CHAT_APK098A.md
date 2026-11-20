# CHECKPOINT — APK-098A et QA-097, 20 novembre 2026

**Dépôt :** `MAthiks/Rogov-Android`.
**Base :** `main 3abf81f7e0d2b8c565993b02137e03206aeb515e`.
**Dernière fusion confirmée :** QA-097 PR #55, 385/385 Node,
60/60 Chromium, Web et ancien workflow APK verts, mais **NO-GO artistique**
sans retour sur un vrai Android.

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

**Statut :** PR QA en attente de CI, aucun GO APK moderne annoncé.
Après réussite des tests, contrôle physique utilisateur du nouvel
APK, puis tests 5×2. Voir `docs/APK098A_CURRENT_PWA_ANDROID.md`.
