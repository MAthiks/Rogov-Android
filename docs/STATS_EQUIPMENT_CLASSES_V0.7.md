# ROGOV — Système caractéristiques, équipement, classes et magie

**Décision de direction : 17 novembre 2026.**  
**Statut : orientation validée sur le principe ; valeurs à prototyper et équilibrer, non implémentées.**  
**Version jouable : Web Alpha v0.7a, avec parade, blocage et dégâts encore fixes.**

## Vision

Garder le combat hybride tactique sur la carte (CONTACT/PROCHE/LOIN, intentions et actions choisies). Les caractéristiques du joueur, des PNJ et des ennemis, combinées à leur équipement et leur entraînement, déterminent les chances de réussite, la protection et les coups critiques. Inspiration de RPG à la World of Warcraft pour les statistiques, sans recopier de système ni surcharger l'écran mobile.

**La décision tactique déclenche l'action ; les statistiques, l'équipement et la situation décident de son résultat.**

## Les six caractéristiques déjà définies dans le GDD

| Caractéristique | Contribution principale |
|---|---|
| Force (FOR) | Puissance physique, armes lourdes, parade |
| Agilité (AGI) | Esquive, mobilité, armes rapides |
| Constitution (CON) | Santé, résistance, absorption au bouclier |
| Perception (PER) | Précision, lecture des ouvertures, critique |
| Volonté (VOL) | Résistance mentale, discipline, maîtrise de risques occultes |
| Intellect (INT) | Sorts, savoir, reliques et soins techniques |

L'**Endurance** est une **ressource de combat distincte** des caractéristiques : elle se dépense pour attaques puissantes, esquive, parade et compétences. Santé, Endurance et Stabilité mentale restent séparées. L'armure lourde protège davantage mais gêne l'esquive et la récupération d'Endurance. Les blessures peuvent affecter les caractéristiques dérivées.

Tous les acteurs (héros, ennemis, PNJ combattants) partagent le même format de statistiques, sans tricher sur les défenses d'un adversaire : un Gardien peut parer grâce à sa technique et son armure ; une Larve de faille peut résister de façon surnaturelle mais ne porte pas arbitrairement un bouclier.

## Équipement et calcul des capacités

Équipement : arme principale, main secondaire/bouclier, armure, relique, consommables. Chaque objet peut contribuer aux dégâts, à la précision, au critique, à la parade, au blocage, à l'esquive, à l'armure, à la résistance et au coût en Endurance. Conserver l'idée de qualité Normal / +1 / +2 / +3, de durabilité/usure et d'inventaire limité. Ne pas considérer ces bonus comme définitifs avant équilibrage.

Les caractéristiques dérivées sont recalculées depuis attributs de base + classe/compétences + équipement + états : pas de doublon permanent de valeurs modifiées dans les sauvegardes.

- **Arme** : dégâts, précision, chance de critique, aptitude à parer, portée et usure.
- **Bouclier** : capacité de blocage, absorption, Endurance nécessaire, usure.
- **Armure** : mitigation physique contre pénalité d'esquive/mobilité.
- **Relique** : pouvoirs, résistances ou sorts, avec une contrepartie en Stabilité, risque ou ressource.
- **Entraînement de classe** : modificateurs de réussite et accès à des capacités spécifiques.

Tout équipement emporté dans Nhal est perdu au Rappel ; le contenu sécurisé à Veyr reste intact. Le système doit rendre ce risque plus intéressant, pas moins.

## Ordre du combat calculé — proposition à tester

1. Vérifier cible vivante, portée, visibilité, prérequis d'arme/compétence et ressources disponibles.
2. Une action valide consomme son tour et son coût d'Endurance / autre ressource.
3. Jet de touche : précision de l'attaquant contre défense de la cible (le GDD antérieur évoquait d20 + modificateurs).
4. Jet de critique si la touche réussit : PER, AGI, arme, talent et résilience adverse influencent la chance ; un critique majore dégâts ou état, jamais une mort arbitraire.
5. Défense choisie : esquive, parade ou blocage, selon les statistiques, l'équipement, l'Endurance et le type d'attaque.
6. Armure/résistances, dégâts finaux, états/blessures, éventuelle riposte et journal clair.
7. Résolution de l'intention/attaque ennemie puis nouveau tour.

**Pas de pourcentages décidés arbitrairement pour l'Alpha.** Ajouter des bornes et plafonds de probabilités afin d'éviter des personnages intouchables ou des critiques systématiques. Les jets doivent utiliser une graine sauvegardée ou un générateur injecté reproductible en tests.

Exemples de dépendance (non formules définitives) :

| Événement | Facteurs de calcul | Sens tactique |
|---|---|---|
| Touche | Précision arme + PER + entraînement contre défense | Une arme adaptée évite les attaques ratées |
| Coup critique | PER/AGI + arme + talent contre résilience | Récompense un positionnement favorable |
| Esquive | AGI + mobilité + Endurance contre charge d'armure | Tout ou rien, faible contre les attaques de zone |
| Parade | FOR/AGI + aptitude de l'arme + technique + Endurance | Réduction et riposte éventuelle, pas contre les ondes |
| Blocage | CON/FOR + qualité et usure du bouclier + Endurance | Absorbe davantage avec bouclier, moins fiable sans lui |
| Sort | INT/VOL + affinité + relique contre résistance occulte | Résultat puissant avec coût/risque |

**Défense active ≠ bonus automatique.** Choisir Esquiver augmente ou permet le jet d'esquive de cette action. Choisir Parer nécessite une arme/technique adéquate. Choisir Bloquer est optimal avec un bouclier ; une garde improvisée sans bouclier pourra rester possible avec faible efficacité pour ne pas supprimer brutalement l'action des anciennes sauvegardes. Les ennemis ont eux aussi défense, résistances et critique selon leur anatomie/équipement.

## Classes et spécialités : conserver les 11 archétypes du GDD

Les noms ci-dessous sont ceux déjà définis ; les capacités sont des **pistes à valider**, pas encore des fonctions jouables.

| Archétype | Spécialité conservée | Exemple de talent / compétence |
|---|---|---|
| Mercenaire | Combat, parade, armures | Garde, Frappe lourde |
| Éclaireur | Mobilité, reconnaissance | Pas de côté |
| Médecin | Soins | Intervention |
| Récupérateur | Butin et reliques | Fouille méthodique |
| Chasseur | Tir et pistage | Tir ajusté |
| Artisan | Réparation | Renforcer un équipement |
| Érudit | Nhal et reliques | Lire les signes |
| Filou | Discrétion | Frappe d'ouverture |
| Cultiste | Savoir interdit | Rituel coûteux en Stabilité |
| Paladin | Défense et serment | Garde jurée |
| Lépreux | Combat lourd et résilience | Tenir bon |

Les compétences et la classe du héros sont **persistantes après le Rappel** ; les armes, sorts consommables et reliques emportées ne le sont pas. Tous les archétypes ne doivent pas devenir des lanceurs de sorts. **Magie rare, low magic, dangereuse et coûteuse** : Volonté/Intellect, Stabilité, préparation et contreparties de reliques comptent.

Définir des capacités actives, passives et des sorts via un moteur unique : identifiant, classe(s), prérequis, portée, coût, temps de préparation, cible, effets, éventuel cooldown. Effets génériques réutilisables : damage, heal, move, apply_status, modify_stat ; spawn hors MVP.

## Architecture technique cible

- ActorStats : six attributs primaires, niveau, états et classe, communs PJ/PNJ/ennemis.
- EquipmentLoadout : emplacements, durabilité et bonus d'objets.
- DerivedStats : précision, critique, parade, blocage, esquive, armure, résistances.
- CombatResolver : validation d'action, jets reproductibles, mitigation et contre-attaque.
- AbilityDefinition / Spell : compétences et sorts de classe, avec coût et conditions.
- SaveMigration : préserve héros, XP, coffre et expédition des versions v0.6/v0.7a ; ajoute les valeurs manquantes sans injecter de nouveaux ennemis.

## Plan de production (un lot actif à la fois)

1. **DEV-073A** : attributs communs PJ/PNJ, équipement, statistiques dérivées, migration de sauvegarde et tests.
2. **DEV-073B** : calculs de toucher/critique/parade/blocage/esquive, Endurance, jets à graine, tests contre Gardien.
3. **DEV-073C** : télégraphie ennemie (Charognard, Gardien, Larve), équilibrage et feedback lisible.
4. **DEV-075** : un premier kit de classe — Mercenaire (Garde, Frappe lourde) — et moteur générique d'aptitudes.
5. **DEV-076** : un prototype de sort low magic et ses risques, seulement après validation du combat physique.
6. **QA** : sessions complètes Samsung, compatibilité des anciennes sauvegardes, test de l'interface et retours de joueurs.

**Barre Alpha 8/10 :** le système doit permettre un véritable choix entre arme/bouclier, défense/esquive, puissance/survie et coût d'un sort, sans devenir une usine à gaz. Le critère central reste l'envie de refaire une descente.
