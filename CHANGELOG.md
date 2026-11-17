## Fondation du combat v0.7 — DEV-070 (2026-11-17)

- Nouveau module pur `docs/combat.js` : distances CONTACT/PROCHE/LOIN, lignes de vue rectilignes, sélection/désélection de cible sans coût de tour, aperçu de l'IA actuelle, états de défense contrôlés et modèle de données pour le futur panneau.
- 12 nouveaux tests `tests/combat-contract.test.mjs` ; les 37 tests précédents restent actifs.
- Le gameplay publié v0.6.1, le format des sauvegardes et le Rappel restent inchangés. Le combat hybride complet n'est pas encore disponible.
- Bilan de studio 6/10 et objectifs qualité 8/10 sauvegardés dans `docs/QUALITY_REVIEW_6_TO_8.md`.

## Préparation v0.7 — décision de conception (NON PUBLIÉE, 2026-11-17)

- Adoption du **combat hybride sur carte**, avec panneau tactique contextuel plutôt qu'une arène séparée.
- Intentions retenues : cibles explicites, distances CONTACT/PROCHE/LOIN, esquive, parade, blocage, repli et intentions ennemies annoncées.
- Préparation de la documentation : GDD combat v0.7, prompt d'implémentation, Master Prompt et plan de production.
- **Aucun changement de code de combat v0.7 et aucune nouvelle version jouable à ce stade.**

## Web v0.6.1 — correctif Android (2026-11-17)

- Correctif de l'écran titre trop large sur Samsung.
- CSS critique embarqué et ressources PWA d'interface versionnées.
- Version jouable Web de référence, distincte des APK natifs.

## Web v0.6 — bestiaire et direction artistique (2026-11-17)

- Lignées visuelles originales et nouvelle Larve de faille, avec onde à distance.
- Bible visuelle et prompt v0.6 intégrés.

## Historique Android natif

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
