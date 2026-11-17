# ROGOV — Roguelike d'extraction tactique

**Version jouable Web : v0.6.1 (HTML/PWA).**  
**Prochaine version en conception : v0.7 — combat tactique hybride (non implémenté).**

Jouer sur Android ou ordinateur, sans APK : **https://mathiks.github.io/Rogov-Android/**

ROGOV se déroule entre le **refuge de Veyr** et les profondeurs de **Nhal**. Il conjugue exploration au tour par tour, combat, équipement à risque, extraction et horreur cosmique originale.

## Boucle fondamentale

**Refuge de Veyr → préparation → descente dans Nhal → butin → extraction ou Rappel → refuge.**

- Le héros, son expérience et ses niveaux persistent après une mort.
- Ce qui reste dans le coffre de Veyr est sécurisé.
- Ce qui est transporté ou récupéré pendant la descente est **perdu en cas de mort**.
- Une extraction réussie dépose le sac dans le coffre.

## État des deux applications

| Branche produit | État | Sources |
|---|---|---|
| **Web HTML/PWA** | **Jouable v0.6.1** : carte, sprites, trois ennemis, combat de collision simple, journal, soins, Rappel et extraction | `docs/` |
| **Android natif Kotlin** | Prototype de compatibilité APK **v0.1.3** ; installation sur Samsung non confirmée | `app/` |
| **Combat hybride v0.7** | **Conception actée ; développement à faire**, pas encore présent sur le site | documents de conception v0.7 |

Le déploiement public Web passe par GitHub Pages et le workflow « ROGOV Web — Tests and GitHub Pages ». Chaque navigateur garde sa propre sauvegarde locale. Le mode PWA permet une utilisation hors ligne après chargement initial.

## Nouvelle orientation du combat — v0.7 (prévue)

Rester sur **la carte**, avec un **panneau tactique contextuel** plutôt qu'une arène séparée. Choisir explicitement une cible et une action : **Attaquer**, **Esquiver**, **Parer/Bloquer**, **Reculer**. Tenir compte des distances CONTACT / PROCHE / LOIN, des intentions ennemies et du risque de perdre le sac. Le simple déplacement vers un ennemi ne devra plus provoquer une attaque automatique.

**DEV-070 réalisé :** un contrat de combat indépendant dans `docs/combat.js`, vérifié par des tests de distance, sélection, intentions et anciennes sauvegardes. **L'interface et la résolution tactique restent à développer.**

Cette orientation reprend des principes fonctionnels de combat tactique, sans reproduire visuellement Darkest Dungeon ni emprunter des ressources à des jeux tiers.

### Documents de référence

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
