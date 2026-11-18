# Intégration de l’exploration profonde de Nhal — 18 novembre 2026

## État confirmé sur GitHub

**Fusionnés dans `main`, dans cet ordre** (méthode `merge`, historique conservé) :

| PR | Objet | Commit de fusion |
|---|---|---|
| [#1](https://github.com/MAthiks/Rogov-Android/pull/1) | DEV-080 — salles, couloirs, portes, caméra | `a4d4911f9106fbfc0150371910ae8c5288f0d43d` |
| [#2](https://github.com/MAthiks/Rogov-Android/pull/2) | DEV-081 — brouillard, LOS, mémoire | `ab4b4c4e5b27758a225b1121d83c96e54a8c044f` |
| [#3](https://github.com/MAthiks/Rogov-Android/pull/3) | DEV-082 — passages secrets facultatifs | `b40ee011c4ce90696707fb65351400a68afc31eb` |
| [#4](https://github.com/MAthiks/Rogov-Android/pull/4) | QA-084 — Charognards visibles, coffres, failles et sécurité des retours | `51aa5d6fa06bc7df981ddaa38902ed923fac9bbb` |
| [#5](https://github.com/MAthiks/Rogov-Android/pull/5) | DEV-085 — seuils encadrés, six portes / dix-sept connexions, passages ouverts | `eca44be979a289c3f51becbc96b48df668556ffd` |

**Point de restauration conservé** : branche [`backup/main-pre-exploration-2026-11-18`](https://github.com/MAthiks/Rogov-Android/tree/backup/main-pre-exploration-2026-11-18), créée à partir du commit `23a3834466dda968495fc0da90781586f9b7dd5f`, avant la première fusion.

**DEV-085 fusionnée à la demande expresse du joueur**, sans attendre une nouvelle recette physique des portes. La PR #5 est close et intégrée à `main`. **Point de restauration immédiatement antérieur à DEV-085** : [`backup/main-pre-dev085-2026-11-18`](https://github.com/MAthiks/Rogov-Android/tree/backup/main-pre-dev085-2026-11-18). La QA physique spécifique du nouveau placement demeure non effectuée : ne pas la considérer comme validée. Le commit de fusion est `eca44be979a289c3f51becbc96b48df668556ffd`.

## Sécurité et recette

- **DEV-085 :** 190/190 tests moteur, 8/8 Chromium mobile, 4/4 Chrome Android 13 émulé, workflow APK réussi avant la fusion ; [CI moteur et navigateur](https://github.com/MAthiks/Rogov-Android/actions/runs/44280623169), [Chrome Android 13](https://github.com/MAthiks/Rogov-Android/actions/runs/44280623120), [APK](https://github.com/MAthiks/Rogov-Android/actions/runs/44280623079). La présence des nouvelles portes a été vérifiée dans le code de `main` après fusion. **Aucun nouveau test sur appareil physique DEV-085** n'a été rapporté.

- Les lots DEV-080/081/082 et QA-084 ont passé les scénarios Android réels demandés au joueur : visibilité des ennemis/coffres/failles, ouverture coffre, sauvegarde sans doublons, combat Charognard, extraction/coffre sécurisé, faille/Rappel et stabilité.
- Les tests du moteur et Chromium pour les lots fusionnés ont passé leurs suites respectives. Les tests Chrome Android 13 émulé de #1, #2 et #3 sont verts.
- La **dernière CI Android 13 de la PR #4 est rouge après deux essais**, les journaux montrant un décrochage du navigateur/DevTools/CDP de l'émulateur en cours de scénarios, non une assertion démontrant une rupture du gameplay. Cette réserve **n'est pas effacée** : la PR #5, contenant les corrections QA-084, a réussi les quatre scénarios Chrome Android 13 sur son dernier commit, et le joueur a validé QA-084 sur téléphone physique.
- **Les cartes d'une descente sont stockées dans la sauvegarde** et ne sont jamais régénérées au rechargement. Les anciennes descentes sont acceptées par les validateurs et ne sont pas transformées de façon rétroactive. Pas de changement intentionnel de la clé de stockage `rogov-web-v1`.
- L'extraction doit rester libre, les secrets optionnels, les deux voies publiques indépendantes, l'économie du coffre de Veyr préservée. Maintenir les tests à chaque prochain changement.
- Ces opérations sont des **fusions de code dans `main`**, pas une vérification d'un déploiement public, d'un APK PWA correspondant au code ou d'une nouvelle version numérotée. La version précédemment affichée v0.7f ne doit pas être renommée sans décision distincte.

## Suite

1. Réaliser un **contrôle post-fusion recommandé, non bloquant** du placement DEV-085 sur téléphone réel : nouvelle deuxième descente, seuils, portes ouvertes/fermées, extraction et reprise d'une ancienne sauvegarde.
2. Conserver la sauvegarde historique ; ne jamais l'effacer pour masquer une incompatibilité. Contrôler la version effectivement déployée avant toute annonce de nouvelle version publique.
3. DEV-083 (pièges contournables/désamorçage) demeure non commencé ; une revue de périmètre est nécessaire avant le prochain lot.
