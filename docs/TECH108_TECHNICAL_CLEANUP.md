# TECH-108 — Assainissement et optimisation technique

**Date :** 23 novembre 2026  
**Dépôt :** `MAthiks/Rogov-Android`  
**Point de départ :** `main`, QA-106G fusionné (PR #88, `ee8c4fe`).  
**Statut :** TECH-108A développé sur branche ; CI et fusion à vérifier.

## Objectif et garde-fous

Réduire les anomalies et le coût des prochaines modifications sans changer le jeu. Le produit actif reste **HTML/CSS/JavaScript, PWA et APK Android WebView**. Godot/PC demeurent reportés.

**Interdictions sur TECH-108A :** aucune suppression de fichier, aucune modification du moteur de jeu, du RNG, du FOV, de l'IA, des combats, des tours, du loot, des états du Rappel, de l'ASCII, du format ou de la clé de sauvegarde `rogov-web-v1`, ni des identifiants de l'interface. Ne pas effacer les données utilisateur (localStorage / données applicatives).

## Audit initial vérifié

| Sujet | Observation sur `main` | Décision |
| --- | --- | --- |
| CSS | **23** feuilles de style distinctes déclarées par `docs/index.html` ; la cascade porte les couches historiques et UI/ART jusqu'à 106F. | Ne pas les concaténer ou supprimer à l'aveugle. Cartographier d'abord leurs dépendances et spécificités Android (TECH-108B). |
| PWA | `docs/sw.js` maintient une liste `CORE` statique et versionnée, indépendante des liens HTML. | Garder cette stratégie hors ligne, mais ajouter un test croisé exact CSS/JS/CORE. |
| Cache sur origine partagée | Avant ce lot, `activate` supprimait **toutes** les clés Cache Storage autres que `CACHE_NAME` ; sur `github.io`, d'autres applications sous la même origine pourraient être touchées. | Corriger en ne supprimant que les clés préfixées `rogov-`. Les anciennes caches ROGOV restent éligibles à la rotation. |
| Tests | `tests/pwa-assets.test.mjs` vérifie déjà l'existence des fichiers `CORE` et les icônes PNG. | Conserver le test existant ; le compléter par les nouvelles invariants de non-duplication, versions exactes et cloisonnement des caches. |
| Documentation | `README.md` et `WEB_README.md` contiennent des passages historiques dont certains parlent de fonctionnalités aujourd'hui intégrées comme si elles étaient à venir. | Archiver/indexer, **sans effacer les décisions historiques**, en TECH-108C. Le nombre total de fichiers obsolètes reste à mesurer. |
| QA Android | QA-106G PR #88 atteste la recette automatisée 3 reprises PWA hors ligne. Une validation sur téléphone physique et un incident intermittent WebView restent ouverts. | Ne pas revendiquer de GO mobile avec les seuls tests automatisés. Documenter tout nouvel échec WebView et conserver la matrice physique. |

## Changements limités de TECH-108A

1. Dans `docs/sw.js`, définir `CACHE_PREFIX = "rogov-"` et limiter le nettoyage d'activation aux clés de ce préfixe, en préservant le cache actif.
2. Ajouter `tests/tech108a-assets.test.mjs`, exécuté par `npm run test:web` :
   - unicité et sûreté des chemins précachés ;
   - présence **avec la même version de requête** de chaque feuille CSS et script d'entrée HTML dans `CORE` ;
   - simulation de l'activation : effacement de l'ancien cache ROGOV, préservation de caches tiers et `clients.claim()`.
3. Fournir `npm run test:assets` pour lancer ce contrôle avec la vérification préexistante des icônes.
4. Archiver les règles du chantier ici, et annoncer le lot dans `ROADMAP.md`.

Ce lot ne réduit volontairement **pas encore** la taille du CSS ou le nombre de documents : les suppressions sans inventaire et sans preuve d'absence d'usage sont un risque de régression, pas une optimisation.

## Feuille de route technique (WIP = 1)

| Lot | But | Conditions d'acceptation |
| --- | --- | --- |
| **TECH-108A — audit/sécurisation** | Corriger la portée du cache et empêcher les divergences HTML/CORE. | `npm run test:assets`, `npm run test:web`, `npm run check:web`, puis 4 CI Web/Android/APK réussies. |
| **TECH-108B — simplification code/graphismes** | Cartographier les 23 CSS et les couches graphiques ; regrouper uniquement les doublons démontrés. | Captures/régressions aux 4 formats Android ; mêmes 11×11 et 15×9, Sprite C, objets, couleurs de menace, zéro fuite du brouillard ; aucun changement fonctionnel. |
| **TECH-108C — rangement documentation/dépôt** | Produire un index « actif / référence / historique », compter et classer les Markdown anciens ; archive traçable. | Liens README/ROADMAP/GDD fonctionnels ; pas de disparition de décisions ni de suppression d'un fichier utilisé par CI / PWA / Android. |
| **TECH-108D — performance et QA finale** | Mesurer CSS/JS/atlas/cache et temps de chargement, optimiser seulement après baseline ; fiabiliser les reprises offline/WebView. | Pas d'augmentation du coût des ressources critiques, mêmes états sauvegardés, tests 3 reprises offline, matrice CI verte, recette physique Android restant à faire séparément. |

## Procédure de validation / retour arrière

1. Sur la branche `feature/tech-108a-repo-safety-audit` : `npm run test:assets` puis `npm run check:web` et `npm run test:web`.
2. Attendre les quatre workflows GitHub (Web/Chromium, Chrome Android 13, APK de compatibilité, WebView moderne).
3. Contrôler que les tests d'extraction, Rappel, FOV/ASCII et anciennes sauvegardes restent verts ; aucune migration ni nettoyage du localStorage.
4. En cas de rouge : corriger la PR, ne **pas** fusionner. En cas de régression après fusion, revert de cette PR plutôt que purge des sauvegardes.
5. Sur appareil physique : contrôler Chrome PWA et APK en ligne/hors ligne, au moins trois reprises de descente 11×11 avec tour/inventaire identiques. Le GO physique n'est pas attribué par TECH-108A.

**Base produit à préserver :** `docs/game.js`, `docs/app.js`, Sprite C 24×24 quatre directions, trois ennemis, sites, extraction/Rappel, génération déterministe, `rogov-web-v1`, PWA hors ligne et fonctionnement APK Android.
