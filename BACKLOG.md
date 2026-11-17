# Backlog de production — ROGOV (WIP maximal = 1)

**Version cible : Web Alpha v0.7a — actions de combat explicites (DEV-072).**  
**Décision actée : Combat hybride v0.7.**  
**État actuel : DEV-070, DEV-071 et DEV-072 développés ; changement de conception validé pour des statistiques/équipements influençant le combat. Le système statistique n'est pas encore programmé.**

## Priorité P0 — v0.7, un lot à la fois

- [x] **DOC-007 — Valider la direction hybride** : carte conservée, panneau tactique contextuel, inspiration fonctionnelle Darkest Dungeon
- [x] **DOC-008 — Documenter** : GDD combat, prompt d'implémentation, Master Prompt et roadmap
- [x] **DEV-070 — Contrat du combat et tests** : distance CONTACT/PROCHE/LOIN, sélection explicite, intention, états défensifs, sauvegarde
- [x] **DEV-071 — Panneau contextuel Android** : cible, PV, distance, intentions et actions, carte toujours visible
- [x] **DEV-072 — Actions tactiques** : attaque explicite (sans attaque par déplacement), esquive, parade, blocage, repli
- [ ] **DEV-073A — Statistiques et équipement** : six attributs PJ/PNJ, Endurance, emplacements et bonus, anciennes sauvegardes
- [ ] **DEV-073B — Résolution des coups** : précision, critique, parade, blocage, esquive selon caractéristiques/équipement ; RNG reproductible
- [ ] **DEV-073C — IA et annonces** : Charognard, Gardien déchu, Larve de faille ; contre-jeu lisible
- [ ] **DEV-075 — Premier kit de classe** : Mercenaire (Garde, Frappe lourde) et moteur d'aptitudes, après stabilisation du combat
- [ ] **DEV-076 — Sorts low magic** : un prototype avec coût/risque, pas onze classes livrées d'un coup
- [ ] **QA-074 — Compatibilité et livraison** : tests combat/Rappel/extraction/sauvegarde, ASCII, PWA, Android, GitHub Pages

**Prochain lot actif : DEV-073A — modèle PJ/PNJ et équipement.** Avant de télégraphier et équilibrer des attaques dont le résultat dépendra des statistiques, il faut d'abord stabiliser leur source de vérité commune. Puis DEV-073B (résolution) et DEV-073C (intentions). Les tests sur Samsung restent indispensables avant d'augmenter la note qualitative.

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
