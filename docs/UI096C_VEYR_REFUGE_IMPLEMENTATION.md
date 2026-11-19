# UI-096C — Refuge de Veyr, coffre, sac et fiche de l'Égaré

**Date :** 19 novembre 2026.  
**Statut :** fusionné dans `main` via [PR #45](https://github.com/MAthiks/Rogov-Android/pull/45). CI Web/Chromium/Chrome Android 13/APK validée ; essai esthétique sur téléphone physique encore ouvert.  
**Références :** [UI-096 concept](UI096_V3_VISUAL_MOCKUPS.md), [Veyr v1](UI096A_VEYR_V1_REVIEW.md), [cockpit Nhal UI-096B](UI096B_NHAL_COCKPIT_IMPLEMENTATION.md), [ART-096B](ART096B_CHESTS_TRAPS_INTENTS.md).

## Objectif

La première boucle du jeu doit devenir plus claire : **arrivée au refuge → matériel sécurisé → sélectionner huit unités maximum → choisir son équipement → repartir**. Le refuge doit contraster avec Nhal, avec une lumière ambrée et une hiérarchie calme. Aucun marchand, PNJ actif, sort, réparation, repos ni nouvelle ressource n'est créé.

## Implémentation

**Écran Veyr :**
- `docs/veyr-refuge-banner.svg` : panorama **pixel art original**, hors ligne, montrant l'architecture pierre/forge et une source de chaleur centrale ; illustration décorative, pas un nouvel écran jouable.
- `docs/ui096c.css` : palette pierre/ambre/ivoire appliquée à `.frame.is-refuge`, bandeau d'ambiance compact, mission plus sobre, coffre sécurisé explicite et mise en évidence des objets sélectionnés, forge existante harmonisée.
- `docs/index.html` : quatre raccourcis vers les **vrais éléments du DOM** : Préparer, Forge, Échos, Égaré ; nouvelle jauge purement visuelle `#refuge-prep-meter`, **8 places réelles** ; texte « Conservé à Veyr » opposé à « Sac de descente · butin exposé ».
- `#start-btn` : même bouton et même handler pour démarrer, présenté **fixe en bas sur Android ≤730px**, jamais un second bouton. Il est désactivé si le vrai sac dépasse huit unités. Garder libre l'accès aux commandes de forge et au coffre via défilement.
- `docs/ui096c.js` : **déplace l'unique nœud `#actor-stats-sheet`** vers `#refuge-character-slot` lorsque `state.run===null` ; replace ce même nœud après un point de repère dans Nhal quand une descente est active. Aucun clone, aucune nouvelle sauvegarde, aucune statistique inventée. Les quatre raccourcis ne font que défiler vers des sections ; pour Échos et Égaré, ils ouvrent le `details` réel. Aucune action ne consomme un tour.
- `docs/app.js` : appelle le véritable `renderActorStats` au refuge **et** pendant l'expédition, synchronise la jauge 0–8 après sélection, appelle le contrôleur UI-096C en fin de rendu.
- `docs/style.css` conserve le comportement en descente, avec un simple changement visuel du sac (danger visuel + texte « perdu au Rappel » déjà existant). Aucun changement d'item/catalogue ni de `game.js`.

## Risques et garde-fous

1. **État du personnage :** la fiche au refuge doit utiliser `heroDerivedStats(state)` avec l'équipement réellement porté en descente, et **sans bonus fictif d'objet seulement sélectionné** au refuge. Un objet choisi au coffre ne devient équipé que lorsque l'expédition démarre. Les stats du refuge reflètent l'état non équipé.
2. **Économie :** `forge.ashen_blade` = 2 Fragments, `supply.bandages` = 1 Fragment pour 2 bandages ; inchangé. L'atelier peut être ouvert pendant la préparation ; le solde doit se mettre à jour immédiatement.
3. **Sac :** 8 unités, pas 8 types. L'équipement de départ reste choisi dans les vrais sélecteurs. Le sac de descente demeure exposé au Rappel et ses actions gardent leur coût de **1 tour**.
4. **Personnage :** un seul ID `actor-stats-sheet`, et six vraies caractéristiques. L'ancien mode ASCII, les combats et le drawer UI-092A restent fonctionnels.
5. **Sauvegarde :** `SAVE_KEY="rogov-web-v1"`, `SCHEMA_VERSION=1`. Navigation et repositionnement DOM **sans persist()**, aucun champ UI sauvegardé.
6. **Accessibilité :** quatre accès rapides d'au moins 44px, contrôles clavier, menu principal et retour conservés ; éviter tout débordement horizontal et recouvrement du CTA par les safe-areas.
7. **Offline :** cache PWA versionné, précharge `ui096c.js`, `ui096c.css?v=1` et `veyr-refuge-banner.svg`, aucune requête externe.

## Validation technique confirmée (19 novembre 2026)

**Résultats : 361/361 tests Node et 49/49 tests Chromium mobile réussis ; Chrome Android 13 et APK compilée/installée réussis.**

- Node : moteur et tests de présentation, absence de nœuds dupliqués, stats valides sans run, modes de sauvegarde inchangés.
- Chromium tactile **320×640, 360×780, 393×704** : menu rapide, fiche du refuge puis de la descente (un seul vrai panneau), sélection du coffre, jauge et départ ; aucune carte cachée ou bouton de départ superposé à un autre contrôle.
- Chromium : forge avec deux vrais Fragments, fabrication 1 → 2 bandages, aucun tour perdu au refuge, solde persisté.
- Chromium UI-092A, ASCII, brouillard et reprise après rechargement, Chrome Android 13, signature et installation de l'APK.
- **Non réalisés automatiquement :** regard esthétique sur un téléphone Android physique, test tactile prolongé et cinq personnes × deux descentes ; une réussite CI ne donne pas le GO final à l'ergonomie.

## Suite

Inspecter le rendu réel de l'écran Veyr, la densité des éléments et la position du CTA en conditions physiques. Après correction d'éventuelles anomalies : **QA-096 / évaluation visuelle** et retour éventuel sur le polish de Nhal. Ne pas reprendre les nouveaux systèmes de gameplay avant ces validations.
