# APK-098A — APK WebView du vrai ROGOV UI/ART-097

**Date :** 20 novembre 2026. **Statut : PR #56 fusionnée**, commit `ae68c5ecde8a49692a3528c8d3dfd7283fec78c7`, CI Android 13 WebView verte ;
aucune installation Android physique revendiquée.

## Incident QA-097 découvert dans l'APK existant

Le workflow `.github/workflows/android-debug.yml` est vert,
mais construit l'ancien module Android Kotlin `:app` :
`com.rogov.android.compat`, version `0.1.3-compat`, avec écran
`Prototype v0.1.1 · Hors ligne`, renderer ASCII natif et moteur
`GameEngine.kt`. La capture `rogov-screen.png` de son artefact
montre cet écran ancien — **pas** le cockpit Web UI/ART-097.

Le workflow `android-web` vérifie **Chrome Android 13** utilisant
les vrais fichiers Web, mais **pas l'ancien APK Kotlin**. Il était
donc incorrect d'assimiler « APK vert » à « UI/ART-097 dans l'APK ».

## Correctif isolé dans un second module (APK-098A)

- `:app` : **intact**, ancien diagnostic Kotlin/compatibilité,
  package `com.rogov.android.compat`, sauvegardes historiques natives.
- `:webapp` : **nouvel APK de test** `com.rogov.webapk`,
  version `0.7f-qa098a`, séparé et non destructif.
- `webapp/build.gradle.kts` : ressources `../docs` empaquetées
  directement depuis **la même PWA** que GitHub Pages ; pas de copie
  manuelle ni nouvelle implémentation des règles.
- `MainActivity.kt` : Android WebView via
  `androidx.webkit.WebViewAssetLoader`, origine locale HTTPS
  `https://appassets.androidplatform.net/assets/`, JS et
  `localStorage` activés, accès `file://` désactivé, chargement
  de l'index et des modules JS **sans serveur Internet**.
- `docs/app.js` : seule variation Web, aucun ServiceWorker sur cette
  origine locale puisque tous les fichiers sont déjà embarqués ;
  fonctionnement PWA Chrome/GitHub Pages inchangé.
- `.github/workflows/webapk-qa.yml` : **nouveau** workflow
  construisant `:webapp:assembleDebug`, vérifiant la signature,
  installant sur émulateur Android 13 et exécutant une recette CDP
  sur la vraie WebView. Il produit son propre artefact
  `ROGOV-modern-web-0.7f-qa098a-android13-apk`.
- `tests/webapk-parity.test.mjs` : preuve d'absence de fork du moteur
  et de non-écrasement du package COMPAT.
- `tests/webapk-android-emulator.test.mjs` : prouve qu'une WebView
  Android 13 charge **`index.html`**, les 121 tuiles, Sprite C, les
  vrais raccourcis et le mode ASCII, puis reprend une sauvegarde
  après arrêt du processus et après coupure de réseau.

## Limites de sauvegarde — crucial

Les sauvegardes Web utilisent la clé `rogov-web-v1` et le schéma 1.
**Les origines Web sont isolées** : Chrome sur
`https://mathiks.github.io` et la WebView APK sur
`https://appassets.androidplatform.net` **ne partagent pas**
le `localStorage`, même avec la même clé. Les sauvegardes natives
de COMPAT (`SharedPreferences`) sont encore un troisième stockage,
d'un autre format.

**Il n'existe pas de migration automatique** dans APK-098A.
Ne pas demander à l'utilisateur de supprimer son installation ou de
réinitialiser sa partie. Pour reprendre une partie PWA existante,
continuer à utiliser Chrome/PWA. Ce lot évalue l'APK de la même version
à partir d'une nouvelle partie propre.

## Gates stricts

1. CI PR : `APK-098A — Current PWA WebView Android` vert et
   test Node `tests/webapk-parity.test.mjs` vert.
2. Android 13 : WebView CDP lit le **vrai DOM** du jeu,
   **135 cases au premier tutoriel historique (15×9)** puis **121 cases
   en descente profonde procédurale (11×11)** ; vrais boutons, mode
   ASCII et sauvegarde locale après redémarrage.
3. Test hors ligne **dans l'APK** avec WebView locale et aucun
   accès HTTP externe requis.
4. Capture Android natif : doit montrer l'interface graphique
   actuelle, pas `Prototype v0.1.1`. La CI produit une capture.
5. Vérifier `test-web`, `android-web` et l'ancienne compilation APK
   pour éviter une régression du dépôt.
6. **Aucun test de téléphone réel, de migration de sauvegarde ou
   de 5 testeurs × deux descentes revendiqué.**

Si le workflow échoue, laisser la PR en brouillon et diagnostiquer
sans fusionner. Après confirmation, tester le nouvel APK sur téléphone
**en conservant les installations existantes**.

**Signature du package de test :** le debug APK Android généré par CI utilise une signature de développement. Ne pas considérer des builds CI successifs comme des mises à jour installables sans migration ; une signature de publication stable et une procédure de mise à jour sont à préparer avant toute distribution générale. Ne pas désinstaller une application porteuse de sauvegardes en cours.

## Validation de livraison — PR #56

Le [workflow Android moderne du commit de PR](https://github.com/MAthiks/Rogov-Android/actions/runs/44714799523) a réussi. Il a construit un APK debug distinct, vérifié la signature, installé et lancé l'application dans un émulateur Android 13 et contrôlé **son DOM WebView réel** via Chrome DevTools direct.

**Le parcours automatisé a été réussi :** écran titre puis Veyr, première descente tutoriel 135 cases (15×9), descente profonde 121 cases (11×11), Sprite C, six boutons, ouverture/fermeture du vrai Sac, basculement graphique ↔ ASCII sans tour, reprise de sauvegarde `rogov-web-v1` après `force-stop`, puis rechargement sans Wi-Fi ni données. La capture native `rogov-webapk-qa098a-nhal.png` montre le nouveau cockpit graphique ; la capture COMPAT `Prototype v0.1.1` appartient seulement à l'ancien module.

**Les quatre contrôles PR étaient verts :** `modern-apk`, `test-web`, `android-web`, ancien `build`. L'artefact ZIP inclut le nouveau `webapp-debug.apk` et deux captures. Les sauvegardes navigateur et ancien prototype **ne sont toujours pas migrées**. Cette version est un **APK debug d'évaluation**, non une release signée pour mises à jour régulières.

**Restent ouverts :** test sur le téléphone réel de l'utilisateur, validité de l'installation selon fabricant, autonomie/latence, campagne de cinq testeurs × deux descentes et politique de signature/updates. Les workflows `main` postfusion doivent être contrôlés indépendamment.
