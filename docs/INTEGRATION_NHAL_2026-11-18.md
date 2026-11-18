# Intégration de l’exploration profonde de Nhal — 18 novembre 2026

## État confirmé sur GitHub

**Fusionnés dans `main`, dans cet ordre** (méthode `merge`, historique conservé) :

| PR | Objet | Commit de fusion |
|---|---|---|
| [#1](https://github.com/MAthiks/Rogov-Android/pull/1) | DEV-080 — salles, couloirs, portes, caméra | `a4d4911f9106fbfc0150371910ae8c5288f0d43d` |
| [#2](https://github.com/MAthiks/Rogov-Android/pull/2) | DEV-081 — brouillard, LOS, mémoire | `ab4b4c4e5b27758a225b1121d83c96e54a8c044f` |
| [#3](https://github.com/MAthiks/Rogov-Android/pull/3) | DEV-082 — passages secrets facultatifs | `b40ee011c4ce90696707fb65351400a68afc31eb` |
| [#4](https://github.com/MAthiks/Rogov-Android/pull/4) | QA-084 — Charognards visibles, coffres, failles et sécurité des retours | `51aa5d6fa06bc7df981ddaa38902ed923fac9bbb` |

**Point de restauration conservé** : branche [`backup/main-pre-exploration-2026-11-18`](https://github.com/MAthiks/Rogov-Android/tree/backup/main-pre-exploration-2026-11-18), créée à partir du commit `23a3834466dda968495fc0da90781586f9b7dd5f`, avant la première fusion.

**Pas encore fusionnée** : [PR #5 — DEV-085 portes architecturales](https://github.com/MAthiks/Rogov-Android/pull/5), maintenant directement basée sur `main`, **brouillon**, moteur et CI automatisée validés, mais recette physique spécifique du placement des nouveaux seuils non encore déclarée réussie par le joueur. Ne pas présumer qu'elle fait partie de `main`.

## Sécurité et recette

- Les lots DEV-080/081/082 et QA-084 ont passé les scénarios Android réels demandés au joueur : visibilité des ennemis/coffres/failles, ouverture coffre, sauvegarde sans doublons, combat Charognard, extraction/coffre sécurisé, faille/Rappel et stabilité.
- Les tests du moteur et Chromium pour les lots fusionnés ont passé leurs suites respectives. Les tests Chrome Android 13 émulé de #1, #2 et #3 sont verts.
- La **dernière CI Android 13 de la PR #4 est rouge après deux essais**, les journaux montrant un décrochage du navigateur/DevTools/CDP de l'émulateur en cours de scénarios, non une assertion démontrant une rupture du gameplay. Cette réserve **n'est pas effacée** : la PR #5, contenant les corrections QA-084, a réussi les quatre scénarios Chrome Android 13 sur son dernier commit, et le joueur a validé QA-084 sur téléphone physique.
- **Les cartes d'une descente sont stockées dans la sauvegarde** et ne sont jamais régénérées au rechargement. Les anciennes descentes sont acceptées par les validateurs et ne sont pas transformées de façon rétroactive. Pas de changement intentionnel de la clé de stockage `rogov-web-v1`.
- L'extraction doit rester libre, les secrets optionnels, les deux voies publiques indépendantes, l'économie du coffre de Veyr préservée. Maintenir les tests à chaque prochain changement.
- Ces opérations sont des **fusions de code dans `main`**, pas une vérification d'un déploiement public, d'un APK PWA correspondant au code ou d'une nouvelle version numérotée. La version précédemment affichée v0.7f ne doit pas être renommée sans décision distincte.

## Suite

1. Tester le nouveau placement DEV-085 sur téléphone réel, idéalement via le port Termux `8769`, en démarrant une **nouvelle deuxième descente** ; vérifier seuils, portes, portes ouvertes/fermées et sauvegarde.
2. Après confirmation terrain, réévaluer [PR #5](https://github.com/MAthiks/Rogov-Android/pull/5), puis l'intégrer séparément avec SHA attendu et contrôles post-fusion.
3. Conserver la sauvegarde historique ; ne jamais l'effacer pour masquer une incompatibilité. Faire un contrôle de bout en bout sur la version réellement déployée avant toute annonce de nouvelle version publique.
