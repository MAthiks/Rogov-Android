# Roadmap ROGOV — état du 18 novembre 2026

## Produit prioritaire : Web HTML/PWA pour Android

| Version | État | Livrable |
|---|---|---|
| 0.1–0.3 | Livré | Refuge, descente, extraction/Rappel, sauvegarde, carte, journal |
| 0.4 | Livré | Deux ennemis, première DA, combat simple |
| 0.5 | Livré | Soins, attente, état de santé |
| 0.5.1 | Livré | Écran titre |
| 0.6 | Livré | Bible visuelle lovecraftienne, Charognard/Gardien revus, Larve de faille |
| 0.6.1 | Livré | Correctif responsive et cache Android |
| 0.6.2 | Livré | Sélection sans tour, panneau contextualisé et intentions (aperçu) |
| 0.7a | Livré | Attaque explicite ; esquive, parade, blocage et repli |
| 0.7b | Livré | Six attributs héros/ennemis, équipement, migration et fiche repliable |
| 0.7c | Livré | Jets de toucher/critiques, défense active influencée par équipement, Endurance et RNG sauvegardé |
| 0.7d | Livré | Gardien : préparation/coup lourd/garde haute ; intentions du Charognard et de la Larve |
| 0.7e | Livré | Carte, dangers, reliques, ennemis, extraction variables après l'introduction ; voies de retour contrôlées |
| **0.7f** | **Économie de refuge (prototype)** | Fragment de cendre convertible en Lame cendrée ou Bandages ; investissement risqué et forge de Veyr ; QA Android à faire |
| **0.7** | **Combat hybride en prototype ; équilibrage et validation humaine à faire** | **Combat hybride sur carte + panneau contextuel, cibles explicites, distances, défenses actives, intentions et repli** |
| 0.8 | À cadrer | Équilibrage combat / économie d'extraction / ergonomie |
| 1.0 | À cadrer | Version testable élargie, progression et contenu stabilisés |

**Référence de la prochaine version :** [GDD combat v0.7](docs/COMBAT_DESIGN_V0.7.md) et [prompt v0.7](docs/DEV_PROMPT_V0.7.md).

**Nouvelle direction systémique (conception) :** [caractéristiques, équipement, critiques, classes et magie](docs/STATS_EQUIPMENT_CLASSES_V0.7.md). Avant d'ajouter des sorts, développer les six attributs communs aux personnages et adversaires, les calculs d'équipement, les chances de critique/parade/blocage et l'Endurance de combat.

**Critères de la cible Alpha 8/10 :** [bilan de studio et scorecard](docs/QUALITY_REVIEW_6_TO_8.md). DEV-070 (contrat), DEV-071 (panneau) et DEV-072 (actions tactiques) sont développés. DEV-073A (attributs) et DEV-073B (jets statistiques reproductibles) sont développés ; DEV-073C (intentions avancées et garde du Gardien) est développé ; **QA-074 sur Android et équilibrage** sont les prochains jalons.

**Audit Alpha 8/10 (QA-074, 17/11/2026) :** [résultats détaillés](docs/QA074_ALPHA_8_ASSESSMENT.md). Les 129 tests sont verts mais **la note 8/10 n'est pas validée** : variété insuffisante (trois extractions identiques sans dégâts), Fragment de cendre non utilisé, absence de validation mobile et de 5 testeurs. VAR-077 et ECO-078 sont implémentés en prototypes. La **recette Android réelle**, l'équilibrage des coûts et les retours de **5 testeurs × 2 descentes** priment sur les nouvelles classes/sorts.

## Direction artistique — Sprite C validé

**Décision validée le 18 novembre 2026 :** la planche « Sprite C », **PJ avec capuche relevée dans les quatre directions**, constitue la nouvelle référence visuelle de ROGOV. Garder la palette sombre et la lisibilité tactique : personnages identifiables à 24×24 px, Charognard bas, Gardien massif, Larve segmentée, portes/coffres/pièges avec états distincts. PNJ du refuge en concepts, pas encore en gameplay. [Contrat graphique et lots ART-091A à ART-091D](docs/ART_DIRECTION_SPRITE_C_V1.md).

**ART-091A — L'Égaré encapuchonné implémenté** : quatre vues SVG 24×24 bas/haut/gauche/droite, direction selon déplacements réels, compatibilité ASCII, sauvegardes et PWA offline. [Contrat d'intégration et recette](docs/ART091A_IMPLEMENTATION.md). Les tests automatisés et la recette physique Android conditionnent la validation artistique finale. **ART-091B** (trois ennemis), **ART-091C** (interactifs/lieux) et **ART-091D** (PNJ/objets) restent dans cet ordre. DEV-090D (interface de préparation) et DEV-089D (familles architecturales) sont des chantiers distincts.

**ART-091B — Silhouettes ennemies Sprite C intégrées en prototype** : Charognard bas à bec osseux et griffes, Gardien déchu massif et cuirassé, Larve de faille segmentée horizontale. Trois SVG 24×24 isolés dans `docs/enemy-art.js` ; tous les indicateurs de danger, PV, intentions, brouillard et mode ASCII restent conservés. [Contrat d'implémentation et QA](docs/ART091B_IMPLEMENTATION.md). La validation esthétique sur téléphone physique reste ouverte. **ART-091C** (interactifs et lieux) puis **ART-091D** (PNJ/objets) demeurent les deux prochains lots graphiques.

## Priorité UI Android — DEV-090

**DEV-090A livré et fusionné (PR #13, 18 novembre 2026)** : le terrain, le pavé directionnel, l'attente et les soins sont regroupés ; quatre raccourcis de navigation sans tour et une légende pliable réduisent le défilement sur Android. CI : **220/220 tests moteur, 16/16 tests Chromium mobile, Chrome Android 13 et APK réussis**. Recette sur appareil physique encore à confirmer.

**DEV-090B livré et fusionné (PR #14, 18 novembre 2026)** : dock de combat à proximité de la carte, cible et intention visibles, PV ennemis, cinq actions sur deux rangées et détails repliables. CI : **221/221 tests moteur, 18/18 Chromium mobile, Android 13 Chrome et APK réussis**. La mécanique du combat et la compatibilité des sauvegardes sont inchangées. **DEV-090C livré et fusionné (PR #15, 18 novembre 2026)** : dock « À portée », coffre/porte/piège/secret/site contextuels, cinquième raccourci gratuit et sac repliable avec jauge et catégories. **222/222 tests moteur, 21/21 Chromium mobile, Chrome Android 13 et APK réussis**. Prochaine proposition : **DEV-090D**, interface de préparation et d'équipement au refuge. **DEV-089D** reste suspendu pour l'instant.

## Exploration profonde de Nhal — GDD v0.9

Le [GDD exploration v0.9](docs/GDD_EXPLORATION_NHAL_V0.9.md) est la référence courante. La [v0.8](docs/GDD_EXPLORATION_NHAL_V0.8.md) reste archivée comme jalon initial. **DEV-080 à DEV-088 sont intégrés à la version Web jouable** (salles/couloirs/portes, visibilité, secrets, pièges, événements, extraction). Ils ont été validés par les suites de tests et le déploiement GitHub Pages ; l'utilisateur a confirmé le fonctionnement de DEV-088 sur Android.

**DEV-089A, DEV-089B et DEV-089C sont fusionnés** le 18 novembre 2026 : nouvelles formes de salles, textures SVG 24×24, graphes de 8 à 12 salles, liaisons transversales et itinéraires de retour validés. Reste **DEV-089D** pour les familles de secteurs ; les impasses facultatives dotées de récompenses spécifiques restent un chantier de design futur.

| Lot | Statut | Livrable |
|---|---|---|
| DOC-079 | GDD v0.8 archivé | Contrats d'exploration, sécurité du retour |
| DEV-080 à DEV-088 | **Livrés** | Donjon profond, secrets, pièges, salles spéciales et rapport d'extraction |
| **DEV-089A** | **Livré — PR #10** | Salles en L, piliers, alcôves et secteurs effondrés avec géométrie réelle |
| **DEV-089B** | **Livré — PR #11** | Direction artistique « ruines de pierre froide », tiles SVG 24 × 24, palette et états lisibles |
| **DEV-089C** | **Livré — PR #12** | Graphe variable de 8 à 12 salles, liaisons et boucles ; deux voies de retour sécurisées |
| **DEV-089D** | À développer | Ruines, galeries, forteresse enfouie et complexe fracturé comme familles architecturales |

**WIP = 1.** Deux trajets de retour indépendants, aucun secret ni piège obligatoire, tests multi-graines, compatibilité des sauvegardes, cohérence ASCII/graphique, consultation du brouillard et recette Android réelle à chaque étape.

## Principes de production

- WIP = 1 : un lot actif, tests automatisés avant déploiement.
- Conserver les sauvegardes existantes, les graphismes originaux, le mode ASCII, les commandes tactiles et le jeu hors ligne.
- La mort déclenche le Rappel ; le sac est perdu, le coffre et la progression restent acquis.
- Inspirations : Darkest Dungeon pour la lecture tactique et la tension, Escape from Tarkov pour le risque d'extraction, roguelikes pour la carte. **Aucune copie visuelle ou mécanique servile.**

## Voie Android native — historique séparé

Le prototype Kotlin/APK de compatibilité reste disponible dans `app/`, mais il n'est **pas** le canal de diffusion prioritaire. Les anciennes étapes Kotlin/ASCII → génération procédurale → classes → boss → graphismes ont été replanifiées et ne représentent plus une séquence de livraison active.
