# ART-096B — Coffres, pièges et intentions tactiques lisibles

**Date :** 19 novembre 2026.  
**Statut :** fusionné dans `main` via [PR #44](https://github.com/MAthiks/Rogov-Android/pull/44). CI Node/Chromium/Chrome Android 13/APK validée ; test esthétique sur téléphone physique toujours à faire.  
**Cadre :** [UI-096](UI096_V3_VISUAL_MOCKUPS.md), [ART-096A](ART096A_MATERIAL_SILHOUETTE.md), [UI-096B](UI096B_NHAL_COCKPIT_IMPLEMENTATION.md).  
**Objectif :** augmenter la lisibilité de l'alpha dans le **rendu véritable** à 20–30 CSS px, pas créer une simple peinture conceptuelle.

## Modifications limitées

**Coffres SVG 24×24 :**
- coffre intact (`loot`) : couvercle abaissé, renforts métalliques et serrure très lisibles ;
- coffre ouvert (`chest_open`) : couvercle levé, ouverture intérieure sombre et évidée ;
- mêmes identifiants, mêmes transitions, aucune modification du loot ni de l'échange de sac.

**Pièges SVG 24×24 :**
- soupçon (`trap_clue`) : poussière/fissure discrète, **aucune pique ou information de type divulguée** ;
- révélé (`trap_revealed`) : deux dents anguleuses explicites sur le mécanisme ;
- désamorcé (`trap_disabled`) : pointes brisées et barre oblique de neutralisation ;
- déclenché (`trap_triggered`) : lit mécanique épuisé et croix de mécanisme consommé.

**Intentions ennemies visibles :**
- `docs/tiles.js` interroge `currentEnemyIntent(run,enemy)` **uniquement dans la branche `if(enemy)`**, elle-même atteinte après `const enemy=visible?enemyAt(...):null`. Les cellules inconnues/oubliées restent dépourvues d'entité et de marqueur.
- `intent-imminent` : `!` rouge sur la case d'un ennemi réellement visible qui va frapper (mêlée, coup lourd, onde, charge) ;
- `intent-preparing` : `…` ocre pour une préparation réelle ;
- `intent-guarding` : `▣` gris froid pour la garde haute du Gardien.
- Le texte exact de `currentEnemyIntent` se trouve aussi dans l'attribut `title` de la case. Le panneau Combat et le bandeau d'alerte UI-096B continuent à afficher les avertissements complets et cohérents.
- Aucun nouveau tour, animation, IA, statut, save field ou logique de ciblage. La sélection se fait toujours par le vrai contrôle de la case. Les marqueurs CSS `pointer-events:none` ne bloquent pas les touches. Le badge PV reste en bas à droite, le nouvel indice en haut à droite. **Aucun cadre autour de Sprite C joueur.**

**Mise à jour PWA :** nouvelle révision `CACHE_NAME=rogov-v0.7f-art096b-combat-legibility`, sans téléchargement d'asset externe.

## Contrat d'invariance

Les fichiers de règles **`docs/game.js`**, `docs/enemy-ai.js`, `docs/combat.js`, `docs/traps.js`, `docs/deep-dungeon.js` et `docs/floors.js` restent inchangés. `SAVE_KEY=rogov-web-v1` et `SCHEMA_VERSION=1` sont maintenus. Pas de nouvelle case de danger, pas de révélation d'un piège encore caché, pas de prévision d'un ennemi hors du champ de vision. L'ASCII et tous les accès tactiles existants restent en place.

## Tests exigés et résultats validés en CI

**Résultats du 19 novembre 2026 : 357/357 tests Node, 47/47 tests Chromium portrait, Chrome Android 13 et build/installation APK réussis.**

1. Node : états SVG distincts et 24×24, respect des 15 identifiants interactifs, conservation de l'ancien modèle des pièges, absence d'effets sur jeu/sauvegarde et cache PWA versionné.
2. Chromium portrait : un **Gardien visible** en préparation puis coup lourd imminent affiche le bon marqueur, et un **Charognard distant caché** ne publie aucune information DOM ; ciblage informatif sans tour.
3. Chromium portrait : un piège réellement révélé a ses dents visibles, puis désamorcé perd ses dents et affiche le verrou de neutralisation, sans changer les tours ni les dimensions 24×24.
4. Régressions existantes : 11×11, cadrage 320×640/360×780/393×704, PWA offline, déplacements, coffres, ennemis, brouillard, ASCII ; Chrome Android 13 et build/install APK signée.
5. **À confirmer avec un téléphone physique :** visibilité des marqueurs `!` / `…` / `▣` à taille réelle, capacité de distinguer coffre ouvert/fermé et piège suspect/révélé/désamorcé ; conditions de faible luminosité. **Cinq joueurs × deux descentes toujours non réalisés.** Aucun score artistique ne doit être rehaussé sur simple réussite de tests.

## Prochaine étape

Après l'approbation des rendus sur Android, compléter la passe visuelle des interactions restantes (coffre au sol, pièges en corridor), puis **UI-096C** : Veyr, sac/coffre et fiche personnage. Éviter de créer de nouveaux PNJ, sorts, talents ou marchandises fictives.
