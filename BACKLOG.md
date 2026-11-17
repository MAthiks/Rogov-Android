# Backlog de production — ROGOV (WIP maximal = 1)

**Base publiée : Web Alpha v0.6.1.**  
**Décision actée : Combat hybride v0.7.**  
**État actuel : DEV-070 (contrat et tests) terminé ; le gameplay v0.6.1 reste inchangé.**

## Priorité P0 — v0.7, un lot à la fois

- [x] **DOC-007 — Valider la direction hybride** : carte conservée, panneau tactique contextuel, inspiration fonctionnelle Darkest Dungeon
- [x] **DOC-008 — Documenter** : GDD combat, prompt d'implémentation, Master Prompt et roadmap
- [x] **DEV-070 — Contrat du combat et tests** : distance CONTACT/PROCHE/LOIN, sélection explicite, intention, états défensifs, sauvegarde
- [ ] **DEV-071 — Panneau contextuel Android** : cible, PV, distance, intentions et actions, carte toujours visible
- [ ] **DEV-072 — Actions tactiques** : attaque explicite (sans attaque par déplacement), esquive, parade, blocage, repli
- [ ] **DEV-073 — IA et annonces** : Charognard, Gardien déchu, Larve de faille ; contre-jeu lisible
- [ ] **QA-074 — Compatibilité et livraison** : tests combat/Rappel/extraction/sauvegarde, ASCII, PWA, Android, GitHub Pages

**Prochain lot actif : DEV-071 — panneau contextuel Android**, en s'appuyant sur docs/combat.js. DEV-072 (actions tactiques) ne doit commencer qu'après validation du panneau et de la sélection sans effet.

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

Consulter [docs/COMBAT_DESIGN_V0.7.md](docs/COMBAT_DESIGN_V0.7.md) et [docs/DEV_PROMPT_V0.7.md](docs/DEV_PROMPT_V0.7.md) avant toute modification de gameplay.
