# ROGOV — checkpoint de sauvegarde — 18 novembre 2026

**Référence actuelle :** branche `dev/dev-082-secrets`, PR [#3](https://github.com/MAthiks/Rogov-Android/pull/3), toujours **brouillon**, empilée sur DEV-081 et DEV-080. **Ne pas fusionner ni déployer.**

## Statut de livraison

- **Public / GitHub Pages :** `main`, version jouable **v0.7f**, inchangée.
- **DEV-080 :** salles/couloirs/portes, caméra mobile 11×11 ; branche `dev/dev-080-salles-camera`, [PR #1](https://github.com/MAthiks/Rogov-Android/pull/1), base `main`, commit de référence `3001dcdb74c8e628b0078c3542d47d15e5727189`.
- **DEV-081 :** LOS, brouillard/mémoire, mini-carte ; branche `dev/dev-081-fog-los`, [PR #2](https://github.com/MAthiks/Rogov-Android/pull/2), base DEV-080, commit de référence `37369d1776f561d7505ac54fbcf4b72725dbaaa3`.
- **DEV-082 :** passages secrets optionnels, indices locaux passifs, fouille confirmée à 1 tour, conservation du secret dans `run.secrets` et `run.map`, récompense unique ; branche `dev/dev-082-secrets`, [PR #3](https://github.com/MAthiks/Rogov-Android/pull/3), base DEV-081. **Dernier commit applicatif testé :** `84aaa313eec661b01fa41f32d4e5390c3396d316` (ce document de checkpoint vient ensuite).
- **DEV-083 :** pièges et désamorçage **non commencés**. **QA-084** à planifier après recette des lots précédents.

## Tests vérifiés sur le dernier commit DEV-082

- **180/180 tests Node**, **5/5 tests Chromium mobile** : [workflow 44251118919](https://github.com/MAthiks/Rogov-Android/actions/runs/44251118919) — succès.
- **3/3 scénarios sur véritable Chrome exécuté dans un émulateur Android 13** : [workflow 44251118876](https://github.com/MAthiks/Rogov-Android/actions/runs/44251118876) — succès. Cas : caméra/portes/sauvegardes et offline (DEV-080), fog/LOS/mémoire/anti-fuite (DEV-081), indice/fouille/ouverture/butin unique/offline (DEV-082).
- **240 graines procédurales** validées dans la campagne DEV-082, avec vérification d'itinéraires ordinaires.
- La CI « Android APK » verte ne démontre **pas** que la PWA DEV-082 a été intégrée à l'ancien projet natif `app/`.

**Limite de validation :** aucune recette physique attestée sur le téléphone du joueur. Un émulateur Android 13 et un navigateur Chromium de test ne remplacent pas les gestes, les performances et la conservation de la sauvegarde sur l'appareil réel.

## Contraintes non négociables

1. Préserver les anciennes sauvegardes et le coffre, le héros, les PV et l'XP ; pas de réinitialisation forcée.
2. L'Arche et les voies de retour sont praticables **sans secret découvert** ; pas de difficulté artificielle.
3. Inspection sans coût ; fouille confirmée (1 tour) ; passage ouvert dans les deux sens ; butin de cache non duplicable au rechargement.
4. Seules les informations effectivement visibles apparaissent dans l'interface ; aucun ennemi caché dans les cibles ou la mini-carte.
5. Pas de changements sur `main` ou GitHub Pages sans validation explicite ; PR #1, #2 et #3 en **brouillon** ; règle **WIP = 1** pour la promotion en production.

## Point de reprise

**Priorité :** effectuer une session de jeu complète sur Android physique : première descente, deuxième descente, caméra, portes, brouillard, indice, fouille, passage découvert, récompense, Rappel/extraction, reprise de sauvegarde et fonctionnement hors ligne. Observer l'ergonomie en portrait et consigner les captures d'écran / anomalies. Ne pas annoncer la validation terrain avant confirmation par le testeur.

Guides existants :
- [DEV-080 — test physique](DEV080_TEST_ANDROID_REEL.md) : port 8765
- [DEV-081 — test physique](DEV081_TEST_ANDROID_REEL.md) : port 8766
- [DEV-082 — implémentation et essai physique](DEV082_IMPLEMENTATION.md) : port 8767

**Documents sources :** [Master Prompt](ROGOV_MASTER_PROMPT.md), [GDD Exploration profonde de Nhal v0.8](GDD_EXPLORATION_NHAL_V0.8.md). Le Master Prompt décrit la base publique et doit être lu en complément de ce checkpoint concernant l'avancement expérimental.
