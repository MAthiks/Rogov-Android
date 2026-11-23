# ROGOV — TECH-108B1 : inventaire des styles et des imports du moteur

**Base de travail :** `main@253995dcd62c3cae9e4c9018b2d619ff9b69f25e` (TECH-108A, PR #90 fusionnée)  
**Statut :** premier lot de rationalisation ; validation de PR nécessaire avant fusion.

## Objectif

Commencer TECH-108B en réduisant la dette de styles **sans** toucher au rendu de Nhal, à Sprite C, aux contrôles ou aux mécanismes de sauvegarde. Cette PR est volontairement petite : une déclaration CSS clairement masquée, un inventaire reproductible et sa validation CI.

## Baseline protégée

L'audit initial TECH-108A a mesuré 54 fichiers JavaScript sous `docs/` (392 333 octets), 23 CSS (201 846 octets), 84 modules de test Node, et 93 références distinctes dans le cache PWA. Voir [rapport TECH-108A](TECH108A_AUDIT_BASELINE.md). Ces mesures initiales sont des **tailles de fichiers Git**, pas des poids téléchargés ni des chiffres FPS.

Ce lot ne change pas la liste des 23 feuilles CSS chargées par `index.html`, ni le graphe des imports JavaScript, ni la liste `CORE` du service worker. Le moteur ES modules et les deux APK existants sont conservés à l'identique.

## Diff strictement visuel et déterministe

Dans `docs/uiart106a.css`, le même bloc contenait :

`min-height:55px;min-width:0;min-height:44px;`

La première valeur `min-height:55px` était systématiquement remplacée par la **dernière** déclaration `min-height:44px` du même bloc CSS (sans règle conditionnelle intermédiaire). Elle est retirée ; la règle calculée reste `min-height:44px`. Il ne s'agit ni d'une diminution des cibles tactiles ni d'une modification de la grille du donjon.

Aucune autre déclaration, sélecteur, texture, sprite ou ressource n'est supprimé.

## Inventaire CSS et JavaScript

`tools/tech108b-inventory.mjs` produit un rapport JSON contenant :

- le nombre et les tailles des CSS et JS suivis par Git ;
- les CSS réellement référencés depuis `index.html` ;
- l'entrée JavaScript `app.js` et la fermeture du graphe d'**imports statiques locaux** ;
- la liste des références statiques cassées ou des liens CSS dupliqués ;
- les fichiers non présents dans le graphe d'entrée statique, classés **« à investiguer »**, **jamais** « inutiles ».

Les modules invoqués dynamiquement, les chemins construits à l'exécution, les ressources du service worker, les tests, la version APK Kotlin et le packaging Android peuvent expliquer une absence du graphe statique. **Aucune suppression ne peut être justifiée par cette liste seule.**

Exécution locale :
`node tools/tech108b-inventory.mjs --check`

La CI `DEV-080 — PR validation` exécute ce contrôle et stocke le résultat comme artefact `tech108b1-entrypoints`. Les quatre workflows Android/Web et leurs tests originaux restent nécessaires avant fusion.

## Conditions de livraison

1. Quatre validations CI réussies sur le SHA final de la PR.
2. Graphes CSS/JS vérifiés : aucune référence statique manquante, aucune entrée CSS dupliquée.
3. Taille de la CSS modifiée et liste précise des fichiers comparées avec le commit d'entrée.
4. Tests des six raccourcis, du D-pad à 320 × 640, du brouillard, de la PWA hors ligne et des APK conservés et réussis.
5. Aucune suppression de ressource ni adaptation des sauvegardes, du RNG ou du gameplay.

## Étapes TECH-108B suivantes

- **B2 :** regrouper progressivement les règles CSS seulement lorsqu'une comparaison de cascade et un test de capture prouvent une équivalence, par lots modestes.
- **B3 :** réduire les duplications JavaScript de rendu et/ou de chargement uniquement avec tests à comportement identique.
- **B4 :** cartographier les SVG, sprites et textures consommés par CSS/ES modules/PWA/APK ; ne supprimer aucun actif sans preuve complète des dépendances.

L'incident WebView intermittent continue d'être suivi dans [issue #91](https://github.com/MAthiks/Rogov-Android/issues/91), à diagnostiquer en TECH-108D. La recette physique Android reste obligatoire avant le GO final TECH-108.


## Répétition d'un incident du runner WebView (tentatives CI du 23 novembre 2026)

Le premier passage de la PR #92 a obtenu trois workflows verts (Web/Chromium, Chrome Android 13, APK classique). Le quatrième a échoué **après restauration de la sauvegarde** : `savePresent=true` et `tiles=121`, suivis de `CDP WebSocket closed before response`.

La relance *du même code* a reproduit une fermeture du processus avec la même signature système :
`ActivityManager: Killing ... com.rogov.webapk ... depends on provider com.google.android.gms/.fonts.provider.FontsProvider in dying proc com.google.android.gms.persistent`.

Cette indication est plus spécifique qu'un défaut CDP générique : le runner Android 13 `google_apis` a fait mourir le processus de l'application lorsque son fournisseur Google Play Services est tombé, ce qui a interrompu l'inspection WebView. Le comportement du jeu est distinct et n'est pas reconnu comme fautif sans preuve.

**Isolement du runner, uniquement CI :** le workflow `.github/workflows/webapk-qa.yml` utilise désormais `target: default` (image Android AOSP, sans Google Play Services) pour contrôler la WebView intégrée. Il conserve l'API 33, l'architecture x86_64, les scénarios JS natifs, la signature APK, les tests d'interface, la sauvegarde et le hors-ligne. La QA Google Chrome sur Android 13 reste assurée par `dev080-android-qa.yml` et n'est pas modifiée. Cette séparation écarte la dépendance de l'émulateur WebView à Google FontsProvider sans amoindrir les assertions.

Le changement reste **candidat** : si l'image AOSP ou l'une des assertions échoue, la PR #92 reste bloquée ; les **quatre workflows verts sur le dernier SHA** sont indispensables. L'issue [#91](https://github.com/MAthiks/Rogov-Android/issues/91) reste ouverte pour la recette physique et les éventuelles intermittences résiduelles.


### Résultat de l'essai AOSP complet et encadrement des diagnostics

Le [run WebView #45232509632](https://github.com/MAthiks/Rogov-Android/actions/runs/45232509632) sur l'image Android 13 `default` a **démarré l'émulateur et installé l'APK**. L'étape a ensuite échoué : ADB est passé hors ligne pendant une commande CDP de lancement de la partie (`Runtime.evaluate`), puis `adb logcat` s'est bloqué sur un appareil hors ligne. Le job a été annulé par sa limite de 35 minutes ; ce n'est **pas** une validation WebView.

Correctif d'outillage candidat : image `aosp_atd` Android 13/x86_64 allégée (2 cœurs, 3 Gio RAM et heap de 512 Mio), scénario de recette limité à 240 s pour éviter les exécutions infinies et commandes **diagnostiques ADB** limitées à 7 s. Les assertions de gameplay, de brouillard, de sauvegarde, de rendu et de mode hors ligne restent inchangées, une panne ADB reste un échec. Les autres workflows maintiennent leurs propres validations Android et Web ; aucune ressource ni moteur de jeu n'a été changé.

Cette hypothèse doit être vérifiée dans une **nouvelle CI de 4/4** sur le dernier commit de PR #92. L'issue [#91](https://github.com/MAthiks/Rogov-Android/issues/91) reste ouverte pour les tests multi-cycles et appareil physique.


### Retrait de la variante expérimentale ATD

L'image `aosp_atd` a été testée sur [run #45239174357](https://github.com/MAthiks/Rogov-Android/actions/runs/45239174357) : émulateur démarré et APK installé, mais la connexion ADB est à nouveau passée à `offline` lors d'une commande CDP `Runtime.evaluate`. Le test a échoué normalement ; les diagnostics bornés ont cette fois terminé en quelques secondes, sans blocage de 35 minutes. L'hypothèse « AOSP allégé corrige l'incident » est donc **invalidée par ce run**.

Le workflow revient à `google_apis` Android 13, 4 cœurs, 4096M RAM et heap 768M, paramètres qui avaient déjà permis 4/4 verts sur TECH-108A/PR #90. Les nouvelles sécurités (`timeout` de 240 s, diagnostics ADB de 7 s et log du fournisseur WebView) restent en place. Le risque d'intermittence Google Play Services demeure documenté dans l'issue #91, sans suppression des tests et sans GO physique.

La PR #92 ne peut toujours pas être fusionnée sans quatre succès sur le dernier SHA après ce retour à la configuration éprouvée.
