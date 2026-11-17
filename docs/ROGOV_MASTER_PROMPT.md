# ROGOV — Master Prompt v1.3 (référence de production)

**Dernière mise à jour : 17 novembre 2026.**  
**Canal prioritaire : HTML5/CSS/JavaScript/PWA jouable sur Android.**  
**Version Web : v0.7a (prototype tactique), cible v0.7 : IA et équilibrage validés.**

## Vision

Développer rapidement un roguelike d'extraction tactique, solo, hors ligne, lisible au téléphone et facile à mettre à jour. Monde low fantasy et horreur cosmique originale : **Veyr** (refuge) et **Nhal** (profondeurs).

## Boucle de jeu non négociable

**REFUGE DE VEYR → PRÉPARATION → DESCENTE DANS NHAL → RISQUE ET BUTIN → EXTRACTION OU MORT → REFUGE.**

- Le personnage, son niveau et son expérience restent permanents.
- Les objets du coffre ne sont jamais exposés à la mort lors d'une descente.
- Le sac temporaire regroupe les objets emportés depuis Veyr **et** ramassés dans Nhal.
- La mort déclenche le **Rappel** : retour au refuge, **perte intégrale du sac**, mais conservation du héros et du coffre.
- L'extraction sécurise le sac en le transférant au coffre.
- Le Rappel est un phénomène narratif mystérieux propre à ROGOV.

## Décision majeure — combat tactique hybride v0.7

Le combat v0.6.1 par collision/contre-attaque est transitoire et **sera remplacé**. La v0.7 conserve exploration et rencontres **sur la carte** et révèle un **panneau tactique contextuel**, sans écran d'arène séparé.

- Cible sélectionnée explicitement ; inspecter/sélectionner ne déclenche pas d'attaque ni de tour.
- Action explicite pour combattre : attaquer, esquiver, parer, bloquer ou reculer.
- Distances de combat : **CONTACT / PROCHE / LOIN**.
- Intentions ennemies lisibles avant les actions importantes : préparation, attaque, capacité surnaturelle.
- Éviter et fuir doivent être de vrais choix : tout combat risque de faire perdre le butin porté.
- Référence Darkest Dungeon limitée à la lisibilité, aux intentions, au positionnement et à la pression, sans copier le jeu.
- Les règles numériques fines et l'implémentation sont **encore à tester**.

**Source de vérité :** docs/COMBAT_DESIGN_V0.7.md.  
**Prompt d'exécution :** docs/DEV_PROMPT_V0.7.md.

## Évolution de combat : caractéristiques, équipement, classes

Décision de conception : le critique, la parade, le blocage et l'esquive doivent tenir compte des caractéristiques **des deux camps**, de leur matériel, de l'Endurance et des compétences de classe. Garder les **six attributs du GDD** (FOR, AGI, CON, PER, VOL, INT), ainsi que les **onze archétypes** (Mercenaire, Éclaireur, Médecin, Récupérateur, Chasseur, Artisan, Érudit, Filou, Cultiste, Paladin, Lépreux). La magie reste rare, liée aux classes/reliques, avec contreparties en Stabilité et ressources.

**Source de vérité :** [STATS_EQUIPMENT_CLASSES_V0.7.md](STATS_EQUIPMENT_CLASSES_V0.7.md). C'est un **plan de conception**, pas encore une fonctionnalité jouable ; le prototype v0.7a utilise toujours des effets fixes. Ne pas implémenter les onze classes ou des dizaines d'objets en même temps : commencer par le modèle commun, puis Mercenaire et Gardien pour valider les calculs.

## Direction artistique

- Horreur cosmique et archéologique ; sprites originaux sobres, silhouettes contrastées sur mobile.
- Trois familles : Charognards de Nhal, Gardiens déchus, Choses de la Faille.
- Personnage humain stable ; ennemis organiques / minéraux / anormaux ; pas de tentacules gratuits ni de copie d'illustrations lovecraftiennes existantes.
- Garder la palette sombre, la légende graphique, le mode ASCII et l'écran titre approuvé.

Référence : docs/VISUAL_BIBLE_V0.6.md.

## Architecture et livraison

- Application web prioritaire : docs/game.js (moteur), docs/app.js (UI), docs/tiles.js (sprites), docs/index.html, docs/style.css.
- Les données sauvegardées doivent rester versionnées et migrables ; ne jamais effacer silencieusement les parties.
- Tests du moteur dans tests/web-game.test.mjs ; ressources offline via service worker et déploiement GitHub Pages.
- Dépôt public ; faire attention aux droits d'auteur des ressources et prévoir une licence explicite.
- **WIP = 1.** Avancer par lots verticaux testés, avec historique documenté.
- Le prototype natif Kotlin/Android existe dans app/, mais reste une voie historique, pas la diffusion prioritaire.

## Exigence qualité : passer de 6/10 à 8/10

Le bilan de studio de référence est conservé dans [QUALITY_REVIEW_6_TO_8.md](QUALITY_REVIEW_6_TO_8.md). Le concept a de bonnes bases, mais le gameplay, la rejouabilité, la valeur du butin, l'ergonomie et notre rigueur de tests doivent progresser. Priorité : **rendre dix minutes de descente réellement intéressantes**, pas seulement livrer des versions.

Mesures minimales : tests automatiques, sauvegardes préservées, essais Android réels, au moins cinq testeurs sur deux descentes et une majorité exprimant l'envie de rejouer. La cible 8/10 reste **un objectif**, pas une note atteinte.

**DEV-070, DEV-071 et DEV-072 développés :** sélection, portée et panneau de cible ; actions Attaquer, Esquiver, Parer (avec épée), Bloquer, Reculer. La collision ne provoque plus d'attaque ni de tour. Les défenses consomment un tour et protègent contre le prochain coup compatible. **DEV-073A/B/C : modèle statistique, jets déterministes et intentions avancées.** Vérification sur Android encore nécessaire.

## Règle de suivi

Ne jamais annoncer une fonction v0.7 comme publiée tant qu'elle n'est pas codée, testée et déployée. Conserver la distinction **décidé / en cours / livré**.
