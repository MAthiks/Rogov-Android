# ROGOV — Roguelike d'extraction tactique

**Version Web : v0.7f — forge de Veyr et valeur du butin (HTML/PWA).**  
**Prochaine version en développement : v0.7 — combat tactique hybride (non jouable intégralement).**

Jouer sur Android ou ordinateur, sans APK : **https://mathiks.github.io/Rogov-Android/**

ROGOV se déroule entre le **refuge de Veyr** et les profondeurs de **Nhal**. Il conjugue exploration au tour par tour, combat, équipement à risque, extraction et horreur cosmique originale.

## Direction artistique approuvée — Sprite C

**Validation utilisateur du 18 novembre 2026 :** [Sprite C, PJ encapuchonné](docs/ART_DIRECTION_SPRITE_C_V1.md) est la référence artistique de production pour le héros, les PNJ, les trois ennemis et les assets. Les lots graphiques sont déployés progressivement : **ART-091A** a intégré le héros encapuchonné dans les quatre orientations ; **ART-091B** intègre les silhouettes du Charognard, du Gardien déchu et de la Larve de faille, avec [spécification et recette Android](docs/ART091B_IMPLEMENTATION.md). **ART-091C** intègre également 15 sprites d'interactifs et de lieux (portes, coffres, pièges, Arche, faille, secret et sites), documentés dans [ART-091C](docs/ART091C_IMPLEMENTATION.md) ; **ART-091D** (PNJ et objets) reste à réaliser. L'ensemble de la planche n'est pas encore intégré.

## Exploration profonde — DEV-080 à DEV-088 intégrés

Le [GDD Exploration profonde de Nhal v0.9](docs/GDD_EXPLORATION_NHAL_V0.9.md) définit la génération de salles/couloirs, le brouillard de guerre, les passages secrets et les pièges détectables/désamorçables, sans blocage arbitraire du retour. **Ces fonctions sont intégrées au moteur Web sur `main`** après fusion des lots DEV-080/081/082, QA-084, DEV-085 et **DEV-083** le 18 novembre 2026. Les deux pièges initialement livrés sont la dalle instable et le fil d'alarme, avec indices, avertissement avant danger et désamorçage. [Spécification DEV-083](docs/DEV083_TRAPS_IMPLEMENTATION.md). **La fusion GitHub ne suffit pas à prouver le succès du déploiement Pages** : vérifier le workflow et le site avant d'annoncer la version publique. **DEV-086** place désormais le fil d'alarme dans un vrai couloir entre deux salles et la dalle instable à proximité immédiate d'un coffre profond. Les indices restent accessibles, les deux chemins de retour restent sûrs et les anciennes sauvegardes ne sont pas régénérées. [Compte-rendu DEV-086](docs/DEV086_STRATEGIC_TRAPS.md). Les descentes existantes restent inchangées ; les pièges apparaissent dans les nouvelles descentes profondes.

## DEV-087 et DEV-088 — Salles spéciales et retour vers Veyr

**DEV-087**, fusionné via [PR #8](https://github.com/MAthiks/Rogov-Android/pull/8), ajoute trois salles à choix exclusif après leur découverte : **atelier abandonné**, **chambre de l'Écho** et **cache oubliée**. Chaque interaction consomme un tour et donne un butin ou de l'expérience ; les choix restent sauvegardés. Les rôles des salles varient selon la descente. [Documentation DEV-087](docs/DEV087_ROOM_EVENTS.md).

**DEV-088**, fusionné via [PR #9](https://github.com/MAthiks/Rogov-Android/pull/9), ajoute un **rapport d'expédition** : butin exposé à la perte, coffre déjà sécurisé, opportunités découvertes et chemin indicatif vers l'Arche si celle-ci et un trajet sont connus. Aucun déplacement automatique, aucun spoiler du brouillard et aucun tour dépensé à consulter le rapport. [Documentation DEV-088](docs/DEV088_EXTRACTION_DECISIONS.md).

**GitHub `main` est mis à jour ; la disponibilité publique sur GitHub Pages doit être confirmée séparément.** Les sauvegardes en cours ne se voient pas attribuer rétroactivement les nouveaux lieux.

## DEV-089 — Diversité architecturale et direction artistique (GDD v0.9)

**DEV-089A et DEV-089B fusionnés dans `main` le 18 novembre 2026** ([PR #10](https://github.com/MAthiks/Rogov-Android/pull/10) puis [PR #11](https://github.com/MAthiks/Rogov-Android/pull/11)). Le donjon dispose de quatre aménagements de salles aux obstacles réels (L, pilier, effondrement, alcôve), ainsi que de **6 variations de sols et 48 murs SVG 24 × 24**, des portes plus lisibles et un autotiling sans fuite du brouillard. **DEV-089C est fusionné** ([PR #12](https://github.com/MAthiks/Rogov-Android/pull/12)) : nouvelles descentes avec **8 à 12 salles**, liaisons variables, galeries transversales, boucles et deux voies de retour vérifiées. Les anciennes sauvegardes restent intactes. Le [GDD exploration v0.9](docs/GDD_EXPLORATION_NHAL_V0.9.md) prépare **DEV-089D** (quatre familles architecturales), encore à développer ; les impasses réellement optionnelles et récompensées restent un lot futur. Les sauvegardes historiques, les deux trajets de retour, les indices de piège et le mode ASCII restent prioritaires. [v0.8 historique](docs/GDD_EXPLORATION_NHAL_V0.8.md).

## DEV-090 — Interface de descente et combat Android (fusionnés)

**[DEV-090A, PR #13](https://github.com/MAthiks/Rogov-Android/pull/13) est fusionné dans `main` le 18 novembre 2026** : carte immédiatement suivie des commandes tactiles, attente centrale, soins rapides, raccourcis Carte/Combat/Rapport/Sac sans coût en tour et légende repliable. La compatibilité ASCII, sauvegardes et les règles de combat est conservée. **220 tests moteur, 16 tests Chromium mobile, Chrome Android 13 et compilation APK réussis** ; recette finale sur téléphone physique à confirmer. [Spécification et vérification Android](docs/DEV090A_ANDROID_UI.md). **DEV-090B (PR #14) est également fusionné** : combat contextuel sous les commandes, jauge de PV, intentions et cinq actions en deux rangées, informations détaillées repliables. Les 221 tests moteur, 18 scénarios Chromium, Chrome Android 13 et APK ont réussi. [Spécification DEV-090B](docs/DEV090B_TACTICAL_UI.md). **DEV-090C (PR #15) est désormais fusionné** : actions locales regroupées dans « À portée », raccourci sans tour, inventaire repliable avec capacité et catégories. CI : **222/222 tests moteur, 21/21 Chromium mobile, Chrome Android 13 et APK réussis**. [Spécification DEV-090C](docs/DEV090C_CONTEXT_BAG.md). **Suite recommandée : DEV-090D**, préparation et équipement au refuge, avant de reprendre DEV-089D.

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
