# APK-098A — APK WebView du vrai ROGOV UI/ART-097

**Date :** 20 novembre 2026. **Statut :** branche/PR en validation,
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
2. Android 13 : WebView CDP lit le **vrai DOM** du jeu, 121 tuiles,
   vrais boutons, mode ASCII, sauvegarde locale après redémarrage.
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
