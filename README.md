# ROGOV — Roguelike d'extraction tactique

**Version Web : v0.7f — forge de Veyr et valeur du butin (HTML/PWA).**  
**Prochaine version en développement : v0.7 — combat tactique hybride (non jouable intégralement).**

Jouer sur Android ou ordinateur, sans APK : **https://mathiks.github.io/Rogov-Android/**

ROGOV se déroule entre le **refuge de Veyr** et les profondeurs de **Nhal**. Il conjugue exploration au tour par tour, combat, équipement à risque, extraction et horreur cosmique originale.

## Exploration profonde — DEV-080 à DEV-086 intégrés

Le [GDD Exploration profonde de Nhal](docs/GDD_EXPLORATION_NHAL_V0.8.md) définit la génération de salles/couloirs, le brouillard de guerre, les passages secrets et les pièges détectables/désamorçables, sans blocage arbitraire du retour. **Ces fonctions sont intégrées au moteur Web sur `main`** après fusion des lots DEV-080/081/082, QA-084, DEV-085 et **DEV-083** le 18 novembre 2026. Les deux pièges initialement livrés sont la dalle instable et le fil d'alarme, avec indices, avertissement avant danger et désamorçage. [Spécification DEV-083](docs/DEV083_TRAPS_IMPLEMENTATION.md). **La fusion GitHub ne suffit pas à prouver le succès du déploiement Pages** : vérifier le workflow et le site avant d'annoncer la version publique. **DEV-086** place désormais le fil d'alarme dans un vrai couloir entre deux salles et la dalle instable à proximité immédiate d'un coffre profond. Les indices restent accessibles, les deux chemins de retour restent sûrs et les anciennes sauvegardes ne sont pas régénérées. [Compte-rendu DEV-086](docs/DEV086_STRATEGIC_TRAPS.md). Les descentes existantes restent inchangées ; les pièges apparaissent dans les nouvelles descentes profondes.

## DEV-087 — Salles spéciales interactives (branche de recette)

Le prototype [DEV-087](docs/DEV087_ROOM_EVENTS.md) ajoute trois salles à choix exclusif, visibles après exploration : **atelier abandonné**, **chambre de l'Écho** et **cache oubliée**. Chaque interaction demande un tour et apporte un butin ou des connaissances, avec des coûts explicites et un état persistant. Les rôles des salles varient selon la descente ; les anciennes parties continuent sans ces nouveaux événements. La publication sur `main` dépend de la validation CI et Android réel.

## Descentes variables dès la deuxième expédition

La première descente reste une initiation au combat et à l'extraction. Dès la deuxième, les murs, les failles, le butin, les positions des créatures et l'emplacement de l'Arche changent selon une graine propre à la descente. Le générateur vérifie la présence de routes de retour alternatives et d'une extraction atteignable sans combattre. Les anciennes sauvegardes en cours utilisent toujours leur carte historique. **ECO-078 ajoute désormais une première économie au refuge : les Fragments de cendre servent à fabriquer une arme ou des soins. Les coûts doivent encore être équilibrés avec des testeurs.**

## Forge de Veyr — premier choix de butin

Le Fragment de cendre extrait devient une ressource : **2 Fragments permettent de forger une Lame cendrée (Arme +1)** ; **1 Fragment peut être converti en 2 Bandages**. Les objets restent sécurisés au coffre jusqu'à leur départ en expédition. La Lame cendrée inflige davantage de dégâts et améliore la parade et les critiques, mais elle est perdue au Rappel si elle est emportée. La forge ne fonctionne qu'au refuge. Voir [ECO-078 — Forge et économie](docs/ECO078_REFUGE_ECONOMY.md).

## Boucle fondamentale

**Refuge de Veyr → préparation → descente dans Nhal → butin → extraction ou Rappel → refuge.**

- Le héros, son expérience et ses niveaux persistent après une mort.
- Ce qui reste dans le coffre de Veyr est sécurisé.
- Ce qui est transporté ou récupéré pendant la descente est **perdu en cas de mort**.
- Une extraction réussie dépose le sac dans le coffre.

## État des deux applications

| Branche produit | État | Sources |
|---|---|---|
| **Web HTML/PWA** | **Jouable v0.7f** : carte, sprites, trois ennemis, combat tactique explicite, statistiques, intentions, soins, Rappel et extraction | `docs/` |
| **Android natif Kotlin** | Prototype de compatibilité APK **v0.1.3** ; installation sur Samsung non confirmée | `app/` |
| **Combat hybride v0.7** | **DEV-070 à 073C développés : duel tactique, statistiques, garde et coup lourd télégraphié ; validation Android/équilibrage à compléter** | documents de conception v0.7 |

Le déploiement public Web passe par GitHub Pages et le workflow « ROGOV Web — Tests and GitHub Pages ». Chaque navigateur garde sa propre sauvegarde locale. Le mode PWA permet une utilisation hors ligne après chargement initial.

## Nouvelle orientation du combat — v0.7 (prévue)

Rester sur **la carte**, avec un **panneau tactique contextuel** plutôt qu'une arène séparée. Choisir explicitement une cible et une action : **Attaquer**, **Esquiver**, **Parer/Bloquer**, **Reculer**. Tenir compte des distances CONTACT / PROCHE / LOIN, des intentions ennemies et du risque de perdre le sac. Le simple déplacement vers un ennemi ne provoque plus d'attaque automatique dans la v0.7a.

**DEV-070 à DEV-073C développés :** module de combat, panneau contextuel, attaques et défenses statistiques. Le Gardien prépare son coup lourd et peut adopter une garde haute ; les menaces imminentes s'affichent même sans cible verrouillée. **L'équilibrage et la vérification réelle sur Samsung restent à faire.**

Cette orientation reprend des principes fonctionnels de combat tactique, sans reproduire visuellement Darkest Dungeon ni emprunter des ressources à des jeux tiers.

### Documents de référence

- [Caractéristiques, équipement, classes et magie (conception)](docs/STATS_EQUIPMENT_CLASSES_V0.7.md) — architecture cible : critiques et défenses dépendant des statistiques.
- [DEV-073A — Modèle héros/PNJ et équipement](docs/DEV073A_ACTOR_STATS.md) — six caractéristiques et équipement.
- [DEV-073B — Résolution statistique](docs/DEV073B_COMBAT_RULES.md) — précision, critique, défense, Endurance et graine de jets persistante.
- [DEV-073C — IA et intentions ennemies](docs/DEV073C_ENEMY_AI.md) — coup lourd télégraphié, garde haute et alertes Android.
- [VAR-077 — Génération contrôlée de Nhal](docs/VAR077_PROCEDURAL_NHAL.md) — chemins, butin et ennemis variables ; extraction et deux voies de retour garanties par les tests.

- [Bilan du studio et objectif Alpha 8/10](docs/QUALITY_REVIEW_6_TO_8.md) — points faibles, critères qualité et tests joueurs
- [GDD de combat hybride v0.7](docs/COMBAT_DESIGN_V0.7.md) — règles, flux de tour, UI, sauvegardes, tests
- [Prompt de développement v0.7](docs/DEV_PROMPT_V0.7.md) — étapes d'implémentation
- [Master Prompt](docs/ROGOV_MASTER_PROMPT.md) — objectifs et contraintes communs
- [Bible visuelle v0.6](docs/VISUAL_BIBLE_V0.6.md) — identité originale des créatures
- [Roadmap](ROADMAP.md) · [Backlog](BACKLOG.md) · [Journal des modifications](CHANGELOG.md)
- [Guide PWA et historique Web](WEB_README.md) · [Guide de test](TESTING.md)

## Historique de compatibilité APK

Le prototype natif de diagnostic **ROGOV COMPAT 0.1.3** utilise le paquet `com.rogov.android.compat`, cible Android 13 (API 33), et des signatures debug v1/v2. Il ne remplace pas l'application web ni ses sauvegardes. Des vérifications d'installation ont été effectuées en émulateur, mais le problème de distribution sur téléphone Samsung a motivé la priorité donnée au Web.

**Ne pas désactiver Play Protect pour forcer l'installation.** L'identifiant et la signature des APK debug peuvent varier entre des builds ; les deux voies de développement restent distinctes.

Ce dépôt est public ; une licence de réutilisation explicite reste à définir. Ne pas supposer que « public » équivaut à « libre de droits ».
