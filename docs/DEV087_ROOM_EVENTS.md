# ROGOV — DEV-087 : Salles spéciales et événements d'exploration

**Statut : fusionné dans `main` via [PR #8](https://github.com/MAthiks/Rogov-Android/pull/8), commit `6f017a7d4828743867e43cc04d835875e1ecb38f`, le 18 novembre 2026.**
**Source :** GDD Exploration profonde de Nhal v0.8, section 2.3 (rôles de salles) et section 4 (observer/interagir).

## Problème de gameplay

Les salles fonctionnent aujourd'hui comme de simples espaces de circulation : portes, ennemis et coffres existent, mais les rôles « atelier », « chambre de l'Écho » et « cache » n'apportent aucun choix. DEV-087 crée trois occasions de s'arrêter et de décider si un tour supplémentaire vaut l'exposition à la menace.

## Fonctionnalités livrées dans le prototype

| Lieu | Situation / choix exclusif | Coût et effet |
|---|---|---|
| **Atelier abandonné** | Récupérer un Fragment de cendre **ou** confectionner un bandage | 1 tour, +1 objet, +1 XP |
| **Chambre de l'Écho** | Relever les inscriptions **ou** écouter la résonance | 1 tour, +1 XP **ou** 1 tour, 2 END, +2 XP |
| **Cache oubliée** | Prendre un tonique **ou** un Fragment de cendre | 1 tour, +1 objet, +1 XP |

L'atelier occupe la salle de rôle `atelier_abandonne` (id 10). La chambre de l'Écho et la cache occupent **des salles différentes et variables** selon la graine du donjon : pas de coordonnées fixes mémorisables d'une descente à l'autre.

Les choix sont déterministes : aucune chance cachée de dégât, aucune modification du RNG de combat. L'ennemi réagit normalement après un tour passé à fouiller. Un sac plein ou une Endurance insuffisante bloque le choix sans coût de tour. Les objets ne sont sécurisés qu'après extraction à Veyr.

## Placement et garanties

- La génération place les événements **après** la géométrie, les portes, les ennemis, les coffres, les failles, les passages secrets et les pièges.
- Les emplacements sont des cases ordinaires praticables, non occupées par un objet ou un mécanisme et accessibles depuis l'entrée sans franchir un ennemi ni un piège.
- Le générateur peut rejeter une configuration si les lieux ne sont pas accessibles. Il conserve les deux routes de retour et les règles d'extraction déjà validées.
- Un lieu ne peut délivrer sa récompense qu'une fois. Sa position, le choix effectué et son statut sont enregistrés dans `run.sites`. La sauvegarde est validée strictement.
- Les anciens runs **sans `run.sites`** restent jouables sans apparition rétroactive de salles interactives.

## Android, brouillard de guerre et ASCII

La carte représente les lieux non résolus par : `a` (atelier), `e` (Écho) et `k` (cache). Un `v` indique un lieu déjà exploité, y compris dans le plan mémorisé une fois la zone connue. Les quatre états utilisent des sprites SVG originaux dans le mode graphique.

Les repères et choix restent cachés derrière le brouillard. Dès que l'Égaré est **sur une case adjacente ou sur le lieu lui-même** et possède la ligne de vue, le panneau « Découverte de Nhal » présente exactement deux boutons adaptés au contexte, sans commande ambiguë. Aucun mouvement ou tour n'est dépensé par l'inspection.

Le module `docs/room-events.js` est inclus dans le cache PWA `rogov-v0.7f-dev087-room-events`.

## Vérifications

- Jeu pur : `npm run check:web` et `npm run test:web`.
- `tests/room-events.test.mjs` : 200 graines, placement, accessibilité, non-divulgation, coûts, récompenses uniques, garde-fous et ancien format de sauvegarde.
- `tests/mobile-browser.test.mjs` : bouton tactile, brouillard, effet en un tour et persistance après rechargement.
- Workflow Android Chrome 13 et tests de compatibilité APK historique : **distincts du client PWA**.
- **Recette physique encore recommandée après fusion :** deuxième descente neuve, découvrir les trois lieux, vérifier les choix exclusifs, leur persistance après rechargement et la sécurité du retour. Les tests automatisés étaient verts avant fusion ; cela ne constitue pas une confirmation du téléphone physique.

## Statut de publication

Le code est intégré à `main`, mais le déploiement public GitHub Pages est distinct et nécessite une vérification spécifique. L'ancienne descente en cours n'est pas modifiée par cette évolution.
