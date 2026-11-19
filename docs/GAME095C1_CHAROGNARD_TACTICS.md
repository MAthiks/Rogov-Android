# GAME-095C1 — Charge annoncée du Charognard

**Objectif :** proposer un nouveau comportement tactique observable et évitable, sans augmenter artificiellement le danger des étages ni briser les sauvegardes.

**Canal :** ROGOV Android (PWA hors ligne, APK de compatibilité), Sprite C. Le portage PC/Godot reste différé comme prévu au GDD.

## Nouveau comportement : le Charognard de profondeur

Seul le **Charognard éclaireur** des étages 2 et 3 **nouvellement générés** depuis GAME-095C1 reçoit un état tactique supplémentaire. Les Charognards des anciens étages, du tutoriel et des sauvegardes existantes conservent leur poursuite / morsure d'origine. Le type d'ennemi, ses attributs, ses PV (3), sa précision, son coût de combat, sa portée d'aggro et son butin sont inchangés.

| État | Déclenchement et effet | Réponse joueur |
|---|---|---|
| **En chasse** (`stalking`) | Marche et frappe normalement. À **2 cases alignées**, avec une case de sol libre entre lui et le joueur, prépare sa charge au lieu d'avancer. | Voir / anticiper le signal |
| **En préparation** (`winding`) | **Un tour entier d'annonce sans déplacement ni attaque**, journal de danger + contour orange pointillé sur son sprite + intentions de combat et annonce de menace au prochain tour. | Se déplacer latéralement, avancer vers lui ou préparer esquive / parade / blocage |
| **Charge** | Si l'axe est encore valide au tour suivant, avance **d'une case**, puis frappe au **contact** avec les dégâts ordinaires de Charognard, utilisant le hasard de combat normal. | Une défense active préparée agit normalement, sans bonus de précision ou de dégâts caché |
| **Interruption** | Si l'alignement est rompu, l'intervalle est obstrué ou le joueur se rapproche au contact, la charge est annulée, **sans attaque et sans jet de RNG** ; retour en chasse. | Exploiter la géométrie et l'initiative |
| **Récupération** (`recovering`) | Après une charge réussie ou ratée, l'ennemi passe un tour à reprendre ses appuis, sans nouvelle attaque ni jet de RNG, puis reprend sa chasse. | Opportunité de repli, riposte ou soin |

**Restrictions spatiales :** la charge ne traverse jamais les murs, angles, portes ni pièges. Elle ne saute pas au-dessus d'une autre créature et ne bloque pas volontairement les seuils des salles. Seule une **ligne droite de deux cases** et un point d'arrivée de sol libre dans la même chambre peuvent déclencher le comportement sur une carte profonde. Les deux voies de retour vers l'Arche restent inchangées.

## Compatibilité et intégration

- `docs/enemy-ai.js` est la source de vérité pure et partagée : `CHAROGNARD_TACTICS`, `charognardLane`, `charognardDecision`, `charognardIntent`.
- `docs/game.js` exécute la même décision au prochain tour. L'attaque utilise `receiveEnemyAttack` comme auparavant : défense stat/équipement, critique et Rappel non modifiés.
- `docs/combat.js` expose deux intentions supplémentaires `charognard_prepare` et `charognard_lunge`, dans le panneau de combat existant. **Une intention ne dévoile jamais une créature hors du champ de vision.** Le contour couleur est appliqué par `docs/tiles.js` uniquement aux Charognards visibles en état `winding`.
- `docs/depth-balance.js` initialise `tactic:"stalking"` seulement lors du **nouveau tirage** d'un étage 2/3 B2, sur l'unique éclaireur de ce type. Aucun changement de nombre de créatures, des coffres, des pièges, des salles, des points de retour ou des statistiques.
- Champ `enemy.tactic` optionnel dans les sauvegardes : `stalking`, `winding`, `recovering` sont validés **uniquement sur un Charognard**. Les anciens enregistrements sans `tactic` restent chargés tels quels, sans migration forcée ni changement de comportement. Les Larves ne peuvent pas recevoir un état de Gardien ou de Charognard ; les Gardiens conservent leurs états propres.
- `SAVE_KEY="rogov-web-v1"`, `SCHEMA_VERSION=1` et la graine de combat restent inchangés. Le cache PWA change de version pour servir le moteur, l'intention et le CSS hors ligne.

## Contrôles de qualité

1. Vérifier avant, pendant et après la charge : intention prédite, carte, PV, tours, hasard et états persistés.
2. Démontrer qu'un **pas de côté** ou une **approche au contact** annule sans coup ni jet, qu'une défense fonctionne, et que le temps de récupération donne un vrai choix.
3. Vérifier que murs, pièges, cases occupées ou seuils refusent la charge.
4. Reprendre une ancienne partie ou une ancienne rencontre sans champ `tactic` : aucun changement, pas de corruption de sauvegarde.
5. Simuler une nouvelle transition vers les étages 2 et 3 : **4 ennemis et récompenses B2 inchangés**.
6. Tester sur Chromium Android portrait et sur Chrome Android 13 en émulateur : warning, repère visuel, sauvegarde/reprise en préparation, interruption via commandes tactiles.
7. Tests CI Node, Chrome, compilation/signature APK et installation émulateur **tous verts avant fusion**. La recette sur téléphone physique, le rythme ressenti des combats et le protocole **5 joueurs × 2 expéditions** demeurent ouverts.

**Hors périmètre C1 :** nouveaux monstres ou sprites, attaques à plus de deux cases, damage scaling, ennemis supplémentaires, quête narrative, nouvelles classes, réécriture Godot. À suivre : GAME-095C2 (autres variations environnementales et contre-jeu), puis GAME-095D (équilibrage qualitatif).
