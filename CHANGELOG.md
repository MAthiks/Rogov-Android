## v0.1.3 — diagnostic de compatibilité (2026-11-17)

- Nouvel identifiant `com.rogov.android.compat` pour exclure un conflit d'installation.
- Target SDK 33, correspondant à Android 13.
- Signatures v1 et v2 activées explicitement dans Gradle pour élargir la compatibilité.
- Maintien du test réel `adb install` et démarrage sur émulateur Android 13.
- Aucune modification des données du jeu ni de la progression.

## 0.1.2 — 17 novembre 2026
- Version d'installation diagnostic Android, avec identifiant distinct `com.rogov.android.installtest`.
- Ne remplace aucune version existante de ROGOV et ne modifie pas ses sauvegardes.
- Ajout d'un test GitHub Actions sur émulateur Android 13 : installation, lancement et vérification du processus.
- Examen de la signature, du manifeste et de l'alignement APK déjà présents dans la CI.

## 0.1.1 — 17 novembre 2026
- Corrections de configuration Gradle et du build Android.
- Vérifications de l'extraction et du Rappel.
