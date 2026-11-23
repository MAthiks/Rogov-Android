# TECH-108 — Isolation de l'éviction des caches PWA

**Base :** `main@1d2a8fc1f97d0a9f77e0854157a01e9f5f225f68` (TECH-108B3 fusionné).
**Origine :** extraction limitée de la PR historique [#89](https://github.com/MAthiks/Rogov-Android/pull/89), dont la branche originale est obsolète et en conflit avec `main`.

## Défaut prouvé par inspection
Dans `docs/sw.js`, l'activation supprimait **tous** les caches de la même origine dont le nom différait de `CACHE_NAME`. Sur une origine partagée, cela pouvait effacer les ressources hors ligne d'autres applications. Le worker n'a pas à agir sur leurs caches.

## Correctif non destructif
- Introduire la constante `CACHE_PREFIX = "rogov-"` et limiter l'éviction aux noms commençant par ce préfixe et différents du cache courant.
- Conserver la constante et la valeur **exacte** de `CACHE_NAME`, les 93 entrées du précache `CORE`, l'ordre des événements `install`/`activate`, le modèle network-first CSS/JS, le comportement hors ligne et le message `SKIP_WAITING`.
- Ne toucher à aucun autre fichier runtime, au gameplay, à `rogov-web-v1`, au brouillard, à Sprite C, au rendu et aux APK.

Le correctif ne supprime pas des caches au moment de cette PR : il modifie les futures suppressions déclenchées **uniquement lors de l'activation du service worker**. Il conserve volontairement les caches d'autres applications. Les anciens caches ROGOV préfixés continuent à être purgés normalement.

## Garde-fou testable
`tests/tech108-cache-isolation.test.mjs` est intégré au `npm run test:web` obligatoire. Il vérifie :
- les URLs de cache uniques, locales et sans chemin parent ;
- la présence et la version identique de toutes les feuilles et du script d'entrée de `docs/index.html` dans le `CORE` ;
- l'éviction simulée des anciens caches ROGOV, sans toucher au cache actif et aux caches tiers, et le `clients.claim()` attendu.

Les tests Web/Chromium, Chrome Android 13, APK classique et WebView moderne restent des prérequis de fusion. L'intermittence de l'émulateur WebView [issue #91](https://github.com/MAthiks/Rogov-Android/issues/91) et les tests sur Android physique restent ouverts.

**Important :** la PR #89 historique ne doit pas être fusionnée par-dessus cette correction ; seule cette adaptation contrôlée du patch est intégrable.
