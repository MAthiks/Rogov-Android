# GAME-095C2 — Repousser un Charognard et utiliser les pièges

**Décision du studio :** la profondeur tactique de ROGOV doit venir du terrain, de la position et de la préparation, plutôt que de PV ennemis gonflés, d'ennemis supplémentaires ou de verrouillage artificiel. Android reste la plateforme active ; le portage PC/Godot est différé.

## Nouvelle action de combat : Repousser

L'Égaré peut sélectionner un **Charognard visible au CONTACT** et utiliser **Repousser** (`G` au clavier, bouton tactile dans les commandes de combat).

- **Coût : 3 END et 1 tour**. Le mouvement du joueur et son sac ne changent pas.
- Nécessite **une case de sol libre, connue et visible immédiatement derrière l'ennemi**, sur le même axe orthogonal. Murs, portes, angles, autres créatures, coffres, failles et sorties sont infranchissables ; un lieu interactif ne peut pas être occupé par la projection.
- Les **Gardiens sont ancrés**, les Larves de faille sont fixées à leur anomalie : ces deux types ne sont pas repoussables. Aucune fausse « réussite » n'utilise des tours ou des ressources.
- Si possible, le Charognard recule d'une case, **sans perdre de PV en terrain normal**. Il reprend ses appuis pendant la phase ennemie en cours : aucune morsure instantanée ni charge au même tour. Le prochain tour reprend le comportement classique. Le joueur obtient un espace de repli ou une respiration, au prix de l'Endurance.
- **Pas de hasard caché** : l'action ne consomme aucun tirage de `run.rngState`. La chance de toucher et les dégâts des attaques normales restent identiques.

## Utilisation des pièges existants

Un repoussement sur **un piège déjà identifié** le déclenche **une seule fois** :

| Piège | Effet du repoussement | Conséquence tactique |
|---|---|---|
| Dalle instable révélée | **2 dégâts fixes sur le Charognard**, dalle marquée `triggered`. En cas de victoire, XP normale du Charognard, une seule fois | Investir dans le repérage du sol et l'alignement |
| Fil d'alarme révélé | Fil `triggered`, alerte Charognards pendant trois tours, sans dégât | Le terrain peut aussi pénaliser le joueur : ne pas pousser aveuglément |
| Piège désamorcé ou déjà déclenché | Case praticable, **aucun effet supplémentaire**, ni XP ni dégâts | Pas de duplication de récompense |
| Piège caché | Action impossible, **aucune révélation du type ou de l'emplacement** par le bouton | Les pièges restent à découvrir normalement |

La validation des sauvegardes accepte une créature sur une dalle **désamorcée ou déclenchée** uniquement. Elle refuse toujours une créature sur un piège caché ou encore armé. Les anciens runs, cartes procédurales et règles de placement des pièges ne sont pas régénérés.

## Interface et sauvegardes

- `docs/terrain-tactics.js` : calcul pur `shoveOpportunity(run,enemy)`, partagé par l'activation tactile et le moteur. Vérifie la visibilité, la case de destination et l'état déjà connu du mécanisme, sans dévoiler les zones non explorées.
- `docs/game.js` : `shoveTarget(state)`, transaction **copie → coût → déplacement → éventuel mécanisme → phase ennemie → sauvegarde**, avec validation avant tout coût. Aucune nouvelle propriété de sauvegarde obligatoire. Réutilise l'état de récupération du Charognard C1.
- `docs/combat-rules.js` : `TACTICAL_COSTS.shove=3`. `docs/combat.js` enregistre `shove` parmi les commandes de combat.
- `docs/index.html` et `docs/app.js` : bouton **Repousser** et conseil contextuel dans le combat mobile, désactivés si l'action est impossible ou si l'END manque ; raccourci **G**. Les détails du piège n'apparaissent que lorsque le joueur l'a déjà identifié.
- Cache hors ligne PWA mis à jour avec le nouveau module. **`SAVE_KEY="rogov-web-v1"` et `SCHEMA_VERSION=1` inchangés**. Les anciens personnages/ennemis/saves ne sont pas modifiés au chargement.

## Critères de validation

1. Aucune action sans cible, hors CONTACT, sans END, à travers une porte ou vers une case occupée. **0 tour et 0 RNG dépensés** en cas de refus.
2. Test de repoussement normal : **1 tour, -3 END, 1 case de recul, 0 dégât, 0 XP, 0 RNG**, ennemi empêché d'attaquer pendant cette phase.
3. Test sur **vraies cartes profondes générées** : dalle identifiée, mort possible et XP unique ; fil d'alarme à risque, alerte correcte ; piège caché ou épuisé sans avantage caché.
4. Après sauvegarde et rechargement : position ennemie, PV, pièges utilisés, ressources, RNG et structure de donjon conservés.
5. Tester le bouton tactile et son retour d'état en Chromium portrait et Chrome Android 13 émulé ; APK compilé, signé et installé.
6. Ne fusionner qu'après tous les contrôles CI Web/Android verts. Les **tests humains sur appareil physique et avec cinq joueurs** restent à organiser et ne sont pas assimilés à la CI.

**Hors périmètre :** pousser les Gardiens ou les Larves, franchir un obstacle par projection, créer de nouveaux pièges / ennemis / classes, dégâts de collision gratuits, téléportation, réécriture Godot. **Suite suggérée : GAME-095C3** (combinaisons supplémentaires de terrain), puis **GAME-095D** (attrition, fréquence des décisions, rejouabilité et tests réels).
