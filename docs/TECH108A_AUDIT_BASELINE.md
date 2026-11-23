# TECH-108A — Audit initial, références et garde-fous

**Cadrage :** 23 novembre 2026 — ROGOV / MAthiks/Rogov-Android  
**SHA de référence immuable :** `12f5e20893ecf68ff8d9ec13fdc2c724e92a60d7` (branche `main`)  
**Statut :** audit en cours sur branche isolée ; pas de fusion ni de GO technique tant que les quatre CI et les contrôles prévus ne sont pas passés.

## 1. Portée et méthode

TECH-108A est une phase **non destructive**, avant TECH-108B (CSS/JS/art), TECH-108C (documents et suppressions prouvées sûres), TECH-108D (cache PWA/WebView, comparaison et validation Android réelle). Le dépôt a été interrogé au SHA ci-dessus : arborescence Git, manifestes, scripts de test, workflows, code de sauvegarde, logique du brouillard, cache et compte rendu QA-106G.

Les chiffres de cette section sont ceux des **fichiers suivis par Git**, non des tailles transférées par le navigateur, de la taille d'une APK compressée ni du stockage runtime. Les fichiers produits à la construction sont exclus des sommes de référence.

## 2. Métriques initiales (avant TECH-108)

| Mesure | Valeur | Définition |
| --- | ---: | --- |
| Entrées de l'arborescence | 376 | 345 blobs + 31 dossiers |
| Fichiers suivis | **345** | arborescence Git récursive |
| Volume suivi | **2 413 836 octets** | somme des tailles des blobs |
| Répertoire `docs/` | 220 fichiers, 1 352 045 octets | comprend jeu, PWA, styles et documentation |
| JavaScript dans `docs/` | **54** fichiers, 392 333 octets | non minifié, non compressé |
| CSS dans `docs/` | **23** fichiers, 201 846 octets | non minifié, non compressé |
| Markdown | **135** fichiers, 784 014 octets | totalité du dépôt |
| Modules de tests `tests/*.test.mjs` | **84** | tests préservés |
| Répertoire `tests/` | 84 fichiers, 851 994 octets | sources de tests |
| Workflows GitHub Actions | **6** | voir `.github/workflows/` |
| CSS référencés depuis `docs/index.html` | **23** | feuilles chargées séquentiellement |
| Scripts directs depuis `docs/index.html` | **1** | `app.js`, module ES important le reste |
| Fichiers précachés par `docs/sw.js` | **93** références distinctes | y compris deux icônes PNG générées |
| Longueur de l'identifiant de cache | 353 caractères | cible de simplification uniquement en TECH-108D |

Les plus gros fichiers suivis sont `tests/mobile-browser.test.mjs` (281 911 octets), `docs/game.js` (66 163), `ROADMAP.md` (61 979), `docs/app.js` (55 287) et `docs/style.css` (52 533). Ces tailles désignent des priorités d'**investigation**, pas des candidats à suppression.

## 3. Cartographie des dépendances

- **PWA :** `docs/index.html` → 23 CSS + `docs/app.js` → modules JavaScript du moteur, du rendu et des contrôles. `docs/game.js` conserve la clé de sauvegarde **`rogov-web-v1`** ; `docs/exploration-visibility.js` porte le brouillard de guerre. Les actifs de Sprite C sont notamment `hero-art.js`, `character-art103d.js` et `art103d-sprite-c-portrait.svg`.
- **Hors ligne :** `docs/sw.js` précache 93 ressources. `docs/manifest.webmanifest` utilise `icon-192.png` et `icon-512.png`, **générés par `tools/make-icons.mjs`** lors du build ; leur absence de l'arbre Git ne prouve pas une dépendance cassée.
- **WebView moderne :** le module `webapp` embarque directement les actifs de `../docs` par `assets.srcDir("../docs")` et les sert depuis `https://appassets.androidplatform.net/assets/` via `WebViewAssetLoader`. Ce n'est **pas** une copie autonome du moteur. LocalStorage y est distinct de celui de Chrome/PWA.
- **APK Android classique :** module Kotlin `app`, moteur natif séparé, `LocalSaveStore.kt`. Ne pas confondre ses sauvegardes et celles de la PWA.
- **Outillage Node :** Node.js 22 en CI, `package.json` v0.7.0-alpha.6, pas de `dependencies` ni `devDependencies` déclarées ; Playwright **1.56.0** est installé ponctuellement dans les workflows.
- **Outillage Android :** Java 17, Gradle 8.13 (CI), Android Gradle Plugin 8.13.2, Kotlin 2.3.21, compileSdk 36, minSdk 26, targetSdk 33. `webapp` utilise `androidx.webkit:webkit:1.11.0` ; `app` utilise JUnit 4.13.2 pour ses tests.
- **Dépendances internes à protéger :** carte du tutoriel 15×9, Nhal profond 11×11, progression/tours/RNG, inventaire, contrats d'extraction, sauvegardes héritées, visibilité et rendu. Tous sont hors du périmètre de modification de TECH-108A.

L'audit technique ajouté par ce chantier utilise `git ls-files` pour comptabiliser les sources et inspecte les références HTML, ES imports statiques simples, URL CSS, icônes du manifeste et liste PWA CORE. Il signale les fichiers manquants ou doublons de précache, **mais ne prétend pas analyser tous les chemins générés dynamiquement**. Une ressource non trouvée par cette analyse ne sera jamais effacée sans recherche spécifique et test de non-régression.

## 4. Baseline CI et risque ouvert

À l'issue de QA-106G, la PR [#88](https://github.com/MAthiks/Rogov-Android/pull/88) avait quatre validations réussies, **avec relance du job WebView moderne**. Sur le SHA `12f5e208` de `main`, les exécutions distinctes les plus récentes étaient :

| Contrôle | Résultat observé | Preuve |
| --- | --- | --- |
| Web / Pages | Succès | [run 45207608505](https://github.com/MAthiks/Rogov-Android/actions/runs/45207608505) |
| APK classique | Succès | [run 45207608869](https://github.com/MAthiks/Rogov-Android/actions/runs/45207608869) |
| WebView moderne | **Échec** | [run 45207608080](https://github.com/MAthiks/Rogov-Android/actions/runs/45207608080) |
| Chrome Android 13 | Pas de run sur ce push | workflow sur PR et manuel |

Le run WebView a **construit et signé** l'APK puis a échoué à l'étape d'inspection CDP : `Android WebView JS inspection failed: fetch failed` dans `tests/webapk-android-emulator.test.mjs`. Le journal ne prouve ni crash de l'application ni corruption de sauvegarde. Le script de relance ne reconnaît actuellement qu'un motif précis de cible CDP absente. **Statut : anomalie à diagnostiquer (risque P1 potentiel), pas de correction validée.** Cela rejoint les intermittences documentées par QA-106G et interdit un GO technique par simple extrapolation d'une relance verte.

Le dépôt signale par ailleurs que `main` est **non protégée** : sans enforcement automatique, les fusions devront être conditionnées explicitement à la revue des quatre CI. La configuration des règles de protection est à traiter séparément avec autorisation et capacité GitHub adéquate ; elle n'est pas modifiée ici.

## 5. Garde-fous et vérification

TECH-108A ajoute `tools/tech108-audit.mjs` et un passage dans `dev080-ci.yml` :

1. générer les deux icônes pour refléter le build réel ;
2. inventorier les sources Git, référencer les liens internes statiques, vérifier la présence des actifs et des invariants `rogov-web-v1` / visibilité / Sprite C ;
3. publier `tech108a-baseline.json` comme artefact de PR, utilisable pour les comparaisons TECH-108B à D.

Commande locale après checkout : `node tools/make-icons.mjs && node tools/tech108-audit.mjs --check`. Cette vérification est **additionnelle** aux tests de syntaxe, gameplay, brouillard, sauvegardes et émulateurs existants. Elle ne mesure pas encore la latence des écrans, les FPS, le temps de démarrage, le stockage réel PWA ni la taille d'APK : ces mesures devront être recueillies de façon reproductible en TECH-108D.

**Interdictions inchangées :** pas de mutation gameplay, pas de migration de sauvegarde, pas d'ajustement du brouillard, pas de changement des sprites approuvés, pas de suppression préventive. Aucun fichier n'est encore déclaré inutile.

## 6. Ordre de clôture

| Étape | Preuve attendue | État |
| --- | --- | --- |
| A — audit, baseline, garde-fous | rapport + artefact + quatre CI sur PR | En cours |
| B — rationalisation de styles/JS/ressources | diff restreint + tests visuels et fonctionnels | Non démarré |
| C — documentation/checkpoints | inventaire des liens + motifs explicites pour toute suppression | Non démarré |
| D — cache/WebView/comparatif | mesures avant-après, reprise offline et diagnostic WebView | Non démarré |
| GO technique final | quatre workflows verts, sauvegardes, PWA offline, Android physique | **Non accordé** |

**Recette physique obligatoire après la CI :** Android Chrome et PWA, APK classique et WebView moderne ; trois cycles de sauvegarde → fermeture forcée → reprise → mode avion, avec comparaison exacte du tour, de la carte, du sac, du brouillard et des commandes. QA-106G reste ouverte sur cette partie. Ne pas reprendre les changements de gameplay avant clôture TECH-108.


## 7. Résultats initiaux et correctifs de stabilisation (23 novembre 2026)

Premier passage CI de PR #90 :
- **419/419 tests moteur** et inventaire de ressources TECH-108A : succès.
- Chrome Android 13 et APK classique : succès.
- Chromium/Playwright : 80/81 sous-tests réussis ; un chevauchement tactile réel à 320×640 (raccourcis jusqu'à y=503,16 ; D-pad à y=492).
- APK WebView moderne : échec au démarrage du débogage CDP, cibles `[]`, puis processus absent lors de la relance. Aucune preuve de perte de sauvegarde à ce stade.

Mesures de stabilisation dans la même PR, en amont du nettoyage B :
1. `docs/uiart106e.js` : sur écran court uniquement (largeur ≤350, hauteur ≤700), le minimum de caméra passe de 200 à 160 px pour que la vraie carte puisse se placer au-dessus des commandes ; **topologie 11×11, règles, brouillard, sprites et cibles tactiles inchangés**.
2. `tests/uiart106e-responsive.test.mjs` : garde-fou pour 320×640, six raccourcis et 121 cases ; l'assertion Chromium existante reste inchangée.
3. `tools/smoke-webapk.sh` : diagnostic du PID, port ADB/CDP, processus et logs ; ne pas laisser `pipefail` interrompre la collecte lors d'un `pidof` absent. Une seule relance n'est permise que sur perte de transport CDP au démarrage, **jamais** sur un échec fonctionnel de jeu, de sauvegarde ou de mode hors ligne.

Les quatre workflows doivent être à nouveau verts **sur le dernier commit de la PR #90** avant toute fusion. Le risque WebView reste ouvert dans [issue #91](https://github.com/MAthiks/Rogov-Android/issues/91) et la recette Android physique demeure obligatoire.


### QA sur la synchronisation de la caméra après un changement de viewport

Le deuxième passage CI de PR #90 a confirmé **3/4 workflows verts** (Chrome Android, APK classique, WebView moderne), mais le dernier test Chromium a donné exactement les mêmes coordonnées de chevauchement au **premier instant** après `page.setViewportSize`. Ce test lisait la géométrie sans laisser la boucle graphique exécuter les callbacks `resize` / `ResizeObserver` de la caméra. Un contrôle supplémentaire attend désormais **deux vraies frames d'affichage** avant l'assertion **inchangée** de non-chevauchement et relève explicitement la largeur réelle de la caméra et la fin des raccourcis.

Aucun délai arbitraire n'a été ajouté et aucun seuil tactile ou assertion de brouillard/sauvegarde n'a été relâché. Si la disposition persiste après stabilisation, l'échec bloquera toujours la fusion. Les quatre workflows devront être réexécutés sur le nouveau SHA.
