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

## Exploration profonde de Nhal — nouvelle direction (conception v0.8)

Le **[GDD exploration v0.8](docs/GDD_EXPLORATION_NHAL_V0.8.md)** a été intégré le 18 novembre 2026. **Aucune de ces nouveautés n'est encore jouable.** Le plan est de passer des petits secteurs VAR-077 à une carte de donjon plus vaste (cible initiale ~40×30 cases, 8–12 salles) et une caméra Android ; puis brouillard de guerre, passages secrets optionnels et pièges lisibles/désamorçables.

| Lot futur | Statut | Livrable |
|---|---|---|
| DOC-079 | **GDD rédigé** | Contraintes procédurales, exploration, anti-frustration, recettes de tests |
| DEV-080 | À faire | Salles, portes/couloirs, caméra et routes de fuite garanties |
| DEV-081 | À faire | Brouillard, mémoire des cases, ligne de vue et mode ASCII |
| DEV-082 | À faire | Cache/raccourci secret, indice et révélation non obligatoires |
| DEV-083 | À faire | Pièges annoncés : dalle, alarme, contournement/désamorçage |
| QA-084 | À faire | Tests graines, Rappel/extraction, migration, Android et testeurs |

**WIP = 1 ; priorité immédiate conservée : QA-074 de la boucle v0.7f.** Un piège ou passage secret ne peut jamais être indispensable pour sortir, ni détruire silencieusement la dernière voie de retour.

## Principes de production

- WIP = 1 : un lot actif, tests automatisés avant déploiement.
- Conserver les sauvegardes existantes, les graphismes originaux, le mode ASCII, les commandes tactiles et le jeu hors ligne.
- La mort déclenche le Rappel ; le sac est perdu, le coffre et la progression restent acquis.
- Inspirations : Darkest Dungeon pour la lecture tactique et la tension, Escape from Tarkov pour le risque d'extraction, roguelikes pour la carte. **Aucune copie visuelle ou mécanique servile.**

## Voie Android native — historique séparé

Le prototype Kotlin/APK de compatibilité reste disponible dans `app/`, mais il n'est **pas** le canal de diffusion prioritaire. Les anciennes étapes Kotlin/ASCII → génération procédurale → classes → boss → graphismes ont été replanifiées et ne représentent plus une séquence de livraison active.
