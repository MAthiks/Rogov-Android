# GAME-095A1 — Fondations du butin (proposition en branche)

**Orientation :** gameplay roguelike / extraction d'abord. Le lore accompagne Nhal ; il ne détermine plus le prochain lot.
**Base :** `main` après NAR-094 (#27), commit `7b9c2c13`.
**Périmètre :** données d'objets, calculs réutilisant le moteur actuel, table de récompenses pure et tests. **Aucune distribution en donjon, aucun changement d'interface, aucune fusion** dans ce lot.

## Objets préparés, non encore distribués

| Identifiant | Objet | Emplacement / effet | Compromis |
|---|---|---|---|
| `weapon.bone_dagger` | Dague d'ossement | mainHand, dégâts 2, précision +8, critique +6 | Dégâts modestes |
| `weapon.iron_mace` | Masse ferrée | mainHand, dégâts 5, attaque +2 | Précision -8, parade +1 |
| `shield.worn_buckler` | Rondache usée | offHand, blocage +6, absorption +1 | Mobilité -1 |
| `armor.scavenged_cuirass` | Cuirasse de récupération | body, armure +3 | Mobilité -1 |
| `armor.broken_plate` | Armure de plaques disjointes | body, armure +6 | Mobilité -4 |
| `consumable.vigor_salts` | Sels de vigueur | futur consommable d'Endurance | Aucun effet actif avant A2 |

Les six objets disposent de pictogrammes SVG Sprite C 24×24 pour le sac Android, avec symboles ASCII de repli. Les cinq icônes historiques restent présentes ; aucun de ces nouveaux objets n'apparaît dans la génération active.

Ces chiffres sont **provisoires et non équilibrés sur Android**. La formule actuelle retranche `Math.floor(armor/3)` aux dégâts physiques : cuirasse -1, plaques -2. Vérifier l'absence d'immunité frustrante avant activation du butin.

## Contrat de la future troisième récompense profonde

Le module `docs/loot.js` prépare une sélection indépendante : un Fragment de cendre et un Bandage garantis, puis un troisième objet variable (70 % catégorie équipement / 30 % catégorie consommable). Dans le sous-pool équipement : dague 30, masse 20, rondache 20, cuirasse 20, plaques 10 ; dans les consommables : Tonique 50, Sels 50. La règle actuelle des coffres reste **inchangée jusqu'à GAME-095A3**.

- Fonction pure `planDeepChestLoot(descentNumber)`, uniquement pour une descente >= 2.
- Graine propre aux récompenses, basée sur le numéro de descente et distincte de `run.rngState`.
- Aucune consommation du RNG de combat, aucun tirage à l'ouverture, aucune mutation d'une carte en cours.
- À A3, affecter les récompenses pendant la génération, puis stocker les identifiants dans `run.loot` comme aujourd'hui, sans recalcul au chargement.
- Maintenir l'entrée de tutoriel, les itinéraires de retour et les placements existants.

## Invariants de GAME-095A1

- `SAVE_KEY = "rogov-web-v1"`, `SCHEMA_VERSION = 1`, sac de 8 unités.
- Coffre, Rappel, extraction, NAR-094, expérience, portes, pièges, brouillard, mode ASCII et Sprite C inchangés.
- Objets existants, Lame cendrée et deux recettes de forge inchangés.
- La future utilisation des Sels et le changement manuel d'équipement seront abordés à GAME-095A2.
- Les tests de non-régression existants doivent rester verts ; le lot ne justifie pas une revendication de recette Android physique.

## Suites prévues

- **A2** : choix explicite des emplacements, quantités à la préparation, consommation des Sels, abandon avec confirmation, contrôles tactiles.
- **A3** : distribution du butin dans les nouveaux donjons uniquement, validation rétrocompatible des anciens `run.loot`, aucune modification de génération pour les parties en cours.
- **A4** : simulations d'équilibrage, sessions physiques Android et protocole humain QA-092.


## GAME-095A2 — Équipement utilisable et préparation du sac (branche de travail)

**Code proposé, non fusionné.** GAME-095A1 a été fusionné dans `main` via [PR #29](https://github.com/MAthiks/Rogov-Android/pull/29), commit `4992595a`. A2 rend utilisables les définitions créées par A1 sans toucher aux placements de butin (A3) ni aux étages (GAME-095B).

### Préparation à Veyr

- L'ancienne API `beginRun(state, ["item", ...])` reste stricte et compatible : au plus un exemplaire par identifiant ; doublons rejetés.
- Une nouvelle API `beginRun(state, {"item": quantité, ...}, loadout)` permet de prendre plusieurs Bandages, avec validation du coffre et **8 unités maximum au total**. Aucun retrait ne se produit si la préparation est invalide.
- Choix gratuits de l'arme principale, du bouclier et de l'armure dans les seules cases cochées ; les objets non équipés restent physiquement dans le sac et sont exposés au Rappel.
- Les anciennes épées conservent leur priorité de sélection automatique (Lame cendrée puis Épée usée). En l'absence de choix explicite, une nouvelle arme, rondache ou armure déjà possédée peut être équipée automatiquement.
- Aucun champ obligatoire de sauvegarde ajouté ; `run.loadout` et `run.carried` conservent leur format existant.

### Dans Nhal

- **Équiper / Retirer :** 1 tour et une réaction ennemie ; l'objet reste possédé, seul le slot change. L'information tactique et les attributs dérivés sont recalculés automatiquement.
- **Abandonner 1 unité :** confirmation Android explicite, 1 tour et réaction ennemie ; objet définitivement détruit, jamais placé dans le coffre ni sur une case fantôme. On ne peut pas jeter le dernier exemplaire équipé sans l'avoir retiré.
- **Sels de vigueur :** consomme 1 unité transportée, restaure jusqu'à 6 Endurance (sans dépasser le maximum), coûte 1 tour et provoque la réaction ennemie. Aucun effet sur les PV, aucun effet si Endurance déjà pleine, aucune consommation dans le coffre.
- **Sac, rapport, Sprite C, ASCII :** le sac reste accessible via le tiroir UI-092A, affiche l'équipement et ses actions ; aucun changement aux commandes de mouvement ni au brouillard.
- **Rappel :** perte de tout le sac et de l'équipement actif ; **extraction :** sécurisation de toutes les quantités. Les indices NAR-094 et la progression du héros restent persistants.

### Critères de sortie

Tests Node sur les quantités, objets illégaux, ancien modèle, armures, changement d'arme, consommables, abandon, Rappel, extraction et sauvegardes. Chromium mobile : vraie sélection au refuge, quantités, préparation des slots, changement d'arme dans le sac et utilisation des Sels après recharge. GitHub Actions Web, Chrome Android 13 et APK obligatoires avant toute fusion. La recette sur appareil physique reste distincte.

**A3 reste à réaliser :** aucune nouvelle récompense ne peut tomber dans une descente normale tant que le générateur des coffres n'a pas été adapté.
