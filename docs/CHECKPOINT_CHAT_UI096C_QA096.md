# CHECKPOINT — Changement de chat ROGOV (19 novembre 2026)

**Dépot :** `MAthiks/Rogov-Android`  
**Branche de travail :** `main`  
**Dernier lot fusionné :** **UI-096C**, [PR #45](https://github.com/MAthiks/Rogov-Android/pull/45), merge commit `705fee3bdc1fded6ccffb5f7f1930b098b640fa7`.  
**Dernier HEAD vérifié avant ce checkpoint :** `e6df90da38e11f5439b2630f873417cf2cb51bad` (dossier et ROADMAP actualisés après fusion).

## Direction du studio désormais prioritaire

**UI / Graphismes / Lisibilité tactile** plutôt qu'ajouter des mécaniques. Style **dark fantasy / low magic**, Veyr (refuge ambre/pierre) contre Nhal (donjon froid/menaçant), la **carte avant les panneaux**, danger lisible sans lecture excessive. Conserver **Sprite C** : personnage à capuche relevée dans les quatre directions, **pas de cadre vert autour du PJ**. Inspirations Pixel Dungeon / Shattered Pixel Dungeon pour l'ergonomie de roguelike, **sans recopier leurs illustrations ou leur UI**.

Alpha studio provisoire : **7,5 / 10** ; note direction artistique **6 / 10**, à ne pas augmenter sans vraie validation du rendu sur téléphone. Objectif final du cycle : qualité perçue et plaisir de rejouer.

## Travaux fusionnés dans main

1. **GAME-095D3C / PR #41** — duo tactique optionnel Gardien/Larve aux profondeurs 2–3 ; risque à évaluer. Tests bots : `exit_only` 5/6 sorties et `scavenge` 5/6 (vs 6/6 avant), aucun test humain effectué.
2. **UI-096B / PR #42** — cockpit de Nhal (HUD resserré, carte dominante, six raccourcis, alerte de menace déjà visible). **348/348 tests Node, 44/44 Chromium mobile, Chrome Android 13 et APK validés**.
3. **ART-096A / PR #43** — sols, murs, ouvertures/portes, Arche/Faille, détails des trois silhouettes en 24×24 Sprite C. **352/352 Node, 45/45 Chromium, Chrome Android 13 et APK validés**.
4. **ART-096B / PR #44** — coffres, quatre états des pièges, intentions d'ennemis visibles `!` / `…` / `▣`, pas de fuite du brouillard. **357/357 Node, 47/47 Chromium, Chrome Android 13 et APK validés**.
5. **UI-096C / PR #45** — nouveau refuge Veyr pierre/ambre, panorama pixel-art SVG original, 4 raccourcis Préparer/Forge/Échos/Égaré, coffre sécurisé vs sac de Nhal, jauge 0–8, bouton de départ fixe Android et **une seule vraie fiche personnage déplacée entre Veyr et Nhal**. Aucune modification des règles, du schéma de sauvegarde ni du catalogue. **361/361 tests Node, 49/49 Chromium mobile, Chrome Android 13 et APK validés avant fusion**. Documentation [UI-096C](UI096C_VEYR_REFUGE_IMPLEMENTATION.md).

**Publication :** un nouveau déploiement GitHub Pages sur `main` était encore en attente lors du dernier contrôle ; **vérifier son résultat** avant d'affirmer que le site public est actualisé.

## Sources de référence

- [ROADMAP](../ROADMAP.md)
- [Principes artistiques et maquettes UI-096](UI096_V3_VISUAL_MOCKUPS.md)
- [Maquette Nhal V2](UI096A_NHAL_V2_REVIEW.md)
- [Maquette Veyr V1](UI096A_VEYR_V1_REVIEW.md)
- [UI-096B cockpit](UI096B_NHAL_COCKPIT_IMPLEMENTATION.md)
- [ART-096A](ART096A_MATERIAL_SILHOUETTE.md)
- [ART-096B](ART096B_CHESTS_TRAPS_INTENTS.md)
- [UI-096C](UI096C_VEYR_REFUGE_IMPLEMENTATION.md)

## Prochaine priorité : QA-096

**Ne pas reprendre un nouveau lot fonctionnel immédiatement.** Vérifier d'abord le **déploiement GitHub Pages de UI-096C**, puis préparer/exécuter ce qui peut l'être de la **recette visuelle et ergonomique Android** : affichage 320×640 / 360×780 / 393×704, contraste des sprites, lisibilité des marqueurs tactiques, commandes (≥44 CSS px), absence de superposition de la carte et du dock, refuge avec vrai coffre/forge/préparation, fiche personnage unique, ASCII et PWA offline, compatibilité des sauvegardes.

**Limite importante :** le studio virtuel ne peut pas prétendre avoir effectué lui-même un test sur le téléphone physique de l'utilisateur. Il faut un **retour de capture et de manipulation réelle sur Android**, puis un protocole d'observation : **5 testeurs × 2 descentes**, au moins 4/5 voulant rejouer, pour soutenir le passage vers 8/10. En parallèle, surveiller l'équilibrage GAME-095D3C, où une politique de sortie automatique a perdu 1/6 sur 6 seeds.

**Exigence de production :** travailler sur branche de fonctionnalité, PR, checks `test-web`, `android-web`, `build` tous verts avant fusion, mettre `ROADMAP.md` et le contrat du lot à jour. Ne jamais déclarer « fusionné », « publié » ou « testé sur téléphone » sans vérification.

**Godot/PC :** portage conservé dans le GDD, **reporté** ; Android prioritaire.

## Prompt prêt à coller dans le prochain chat

> Reprenons ROGOV depuis GitHub `MAthiks/Rogov-Android`. Dernier lot fusionné : **UI-096C, PR #45**. Le chantier UI-096/ART-096 a refondu le cockpit de Nhal, les tiles, coffres/pièges/intentions ennemies et le refuge Veyr. Les tests de la PR #45 étaient verts : **361/361 Node, 49/49 Chromium mobile, Chrome Android 13 et APK**. Consulte `docs/CHECKPOINT_CHAT_UI096C_QA096.md` et `ROADMAP.md`. Priorité **QA-096** : vérifier publication et qualité visuelle/ergonomique sur Android ; rester fidèle à Sprite C, préserver le gameplay, les sauvegardes, le brouillard et le mode ASCII. Ne pas prétendre que des essais humains ont été réalisés. Avançons !
