# Backlog de production — ROGOV (WIP maximal = 1)

**Version Web : Alpha v0.7e — Nhal procédural (VAR-077, premier lot).**  
**Décision actée : Combat hybride v0.7.**  
**État actuel : DEV-070 à DEV-073C développés ; intentions et garde du Gardien, avertissements Charognard/Larve. Les tests Android et l'équilibrage restent ouverts.**

## Priorité P0 — v0.7, un lot à la fois

- [x] **DOC-007 — Valider la direction hybride** : carte conservée, panneau tactique contextuel, inspiration fonctionnelle Darkest Dungeon
- [x] **DOC-008 — Documenter** : GDD combat, prompt d'implémentation, Master Prompt et roadmap
- [x] **DEV-070 — Contrat du combat et tests** : distance CONTACT/PROCHE/LOIN, sélection explicite, intention, états défensifs, sauvegarde
- [x] **DEV-071 — Panneau contextuel Android** : cible, PV, distance, intentions et actions, carte toujours visible
- [x] **DEV-072 — Actions tactiques** : attaque explicite (sans attaque par déplacement), esquive, parade, blocage, repli
- [x] **DEV-073A — Statistiques et équipement** : six attributs PJ/PNJ, Endurance, emplacements et bonus, anciennes sauvegardes
- [x] **DEV-073B — Résolution des coups** : précision, critique, parade, blocage, esquive selon caractéristiques/équipement ; RNG reproductible
- [x] **DEV-073C — IA et annonces (prototype)** : Charognard, Gardien déchu, Larve de faille ; contre-jeu lisible
- [ ] **DEV-075 — Premier kit de classe** : Mercenaire (Garde, Frappe lourde) et moteur d'aptitudes, après stabilisation du combat
- [ ] **DEV-076 — Sorts low magic** : un prototype avec coût/risque, pas onze classes livrées d'un coup
- [ ] **QA-074 — Compatibilité et livraison** : 129 tests automatisés réussis, mais recettes Android et testeurs réels à réaliser
- [x] **VAR-077 — Variété des descentes (prototype)** : carte de tutoriel stable, secteurs variables ensuite, ennemis/objets/Arche déplacés, chemins alternatifs vérifiés
- [ ] **ECO-078 — Valeur du butin (bloquant Alpha 8/10)** : usage concret du Fragment de cendre au refuge et arbitrage d'extraction

**Audit QA-074 effectué pour le moteur :** [bilan Alpha 8/10](docs/QA074_ALPHA_8_ASSESSMENT.md) — **129 tests réussis**, mais **objectif 8/10 refusé**. Trois descentes identiques terminées sans dégâts, même carte/ennemis/butin, Fragment de cendre sans utilité actuelle. **VAR-077 livré en prototype** : [détails des garanties de parcours](docs/VAR077_PROCEDURAL_NHAL.md). Les descentes 2+ varient et le moteur refuse les plans sans retour alternatif. **Prochain lot actif : ECO-078 — donner un usage au Fragment de cendre à Veyr**, puis QA Android et 5 testeurs × 2 runs. Pas de nouvelle classe avant validation de la boucle.

**Objectif de qualité :** [bilan 6/10 → 8/10](docs/QUALITY_REVIEW_6_TO_8.md) ; aucune note de 8/10 ne sera attribuée sans tests sur téléphone et retours de joueurs.

## Critères bloquants

- Aucune perte involontaire d'une sauvegarde v0.6.1.
- Mort = retour au refuge, disparition du sac porté/récolté, coffre et héros préservés.
- Une sélection et une action impossible n'infligent aucun dégât et ne consomment pas de tour.
- Éviter les clics tactiles d'attaque accidentels.
- Les tests Node.js et le déploiement Pages doivent réussir pour déclarer une version publiée.

## Archive Android/Kotlin (non prioritaire)

- [x] TÂCHE-001 à 004 : socle Kotlin, moteur refuge/descente et tests initiaux
- [x] TÂCHE-005 : chaîne de compilation APK et diagnostics de compatibilité sur émulateur
- [ ] Validation d'installation réelle sur Samsung (bloquée dans les essais précédents)
- [ ] Portage natif éventuel du combat, **après stabilisation du Web**

Consulter [docs/COMBAT_DESIGN_V0.7.md](docs/COMBAT_DESIGN_V0.7.md), [docs/STATS_EQUIPMENT_CLASSES_V0.7.md](docs/STATS_EQUIPMENT_CLASSES_V0.7.md) et [docs/DEV_PROMPT_V0.7.md](docs/DEV_PROMPT_V0.7.md) avant toute modification de gameplay.
