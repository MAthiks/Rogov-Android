# ROGOV — UI-096 · Maquettes de refonte visuelle, checkpoint v0.1

**Date : 19 novembre 2026.**  
**Statut : CONCEPTION v0.2 — maquettes Nhal itération 2 et Veyr première revue documentées ; aucune implémentation de gameplay autorisée par ce document.**  
**Déclencheur :** priorité utilisateur explicite à l'interface et aux graphismes, avant de poursuivre l'ajout de fonctionnalités.  
**Base :** [maquette UI v2](UI_V2_MAQUETTE_V1.md), [cockpit actuel UI-092A](UI092A_ANDROID_COCKPIT.md), [DA Sprite C](ART_DIRECTION_SPRITE_C_V1.md), [audit studio](QUALITY_REVIEW_6_TO_8.md), GAME-095D3C fusionné (PR #41).

## Avancement de la revue UI-096A (19 novembre 2026)

- [**Maquette Nhal v2 : audit des proportions, actions existantes, danger et carte**](UI096A_NHAL_V2_REVIEW.md). Les six raccourcis et la compatibilité 11×11 / 320–393px restent des contraintes ; la peinture d'ambiance ne définit pas les dimensions CSS finales.
- [**Maquette Veyr v1 : refuge, coffre sécurisé, forge et Échos réels**](UI096A_VEYR_V1_REVIEW.md). L'illustration générale peut montrer des fonctions fictives ; **pas de vente/achat, repos, sorts, talents, réparation, nouveaux PNJ actifs ou ressources inventées** à implémenter.
- **Prochaine décision attendue :** retour sur l'orientation et les proportions des deux écrans avant toute PR de code. Ensuite prototype UI-096B isolé, testé sur Android.

## Décision de direction du studio

La boucle roguelike existe déjà : Veyr → Nhal, trois profondeurs, combat au tour par tour, équipement, coffres facultatifs, Arche d'extraction, Rappel et forge. La qualité **perçue** doit rejoindre la qualité **systémique**. Pour ce cycle, ne pas ajouter de classes, ennemis, quêtes, ressources ou statistiques. L'ordre est : **maquettes → choix visuels validés → prototype isolé → recette Android → fusion**. WIP = 1.

La direction Sprite C **reste la référence**, avec PJ à capuche relevée dans les quatre directions ; elle n'est pas remplacée par une nouvelle identité. Le but : **dark fantasy basse magie, décharné, lisibilité Pixel Dungeon sans reproduction de ses sprites ni de son interface**. ROGOV garde sa propre signature Nhal/Veyr.

**Trois piliers non négociables :**
1. **Carte d'abord** : architecture et entités plus importantes que les panneaux.
2. **Tactique lisible** : intentions, dangers et actions compréhensibles sans ouvrir le journal.
3. **Sombre mais contrasté** : l'esthétique ne masque jamais une décision.

## Langage visuel proposé (à valider)

| Usage | Couleur de travail | Rôle |
|---|---|---|
| Fond nocturne | `#0B1017` | Écrans et vides |
| Panneau sombre | `#19212A` | Tiroirs et barre d'état |
| Pierre | `#353C44` | Mur, socle, relief |
| Ivoire | `#E9E2D3` | Texte et détails essentiels |
| Ambre mat | `#CBA36A` | Veyr, forge, sélection sûre |
| Turquoise froid | `#67B9AC` | Arche et issue (silhouette arquée unique) |
| Rouge poussière | `#C36F6B` | Coup annoncé, PV, danger immédiat |
| Violet désaturé | `#927FAD` | Échos, étrangeté |
| Vert malade | `#789B77` | Faille dangereuse (forme brisée, distincte de l'Arche) |

**Contraste avant palette :** les pictogrammes ont des formes distinctes et un libellé accessible, l'état n'est jamais transmis par la couleur seule. Sprites 24×24 à pixels nets, contraste vérifié à la taille d'usage réelle, pas de halo permanent autour du PJ. Géométrie top-down/3⁄4, déplacement cardinal, pas d'isométrie trompeuse.

## Maquette A — Nhal, cockpit de descente (priorité 1)

**Format de conception : Android portrait 360×780**, variantes prévues 320×640 et 393×704 ; gérer `env(safe-area-inset-bottom)`. Cette maquette n'est **pas un screenshot** du moteur actuel.

Hiérarchie de haut en bas :
1. **En-tête minimal** : `NHAL — PROFONDEUR 2/3`, compteur de tours, menu accessible. Aucune grande bannière.
2. **Statut vital compact** : PV + Endurance, chiffres exacts et deux jauges séparées. Sac `n/8` et menace visible seulement si connue par le moteur.
3. **Carte 11×11 dominante**, centrée sur le PJ capuchonné ; murs, couloirs, porte, coffre, ennemi et sortie hiérarchisés, brouillard inconnu complètement opaque. Pas de bordure verte persistante autour du PJ. Pictogrammes d'intention contextuels visibles uniquement si l'ennemi est réellement dans la ligne de vue.
4. **Bande de contexte unique** : `Gardien déchu · Coup lourd annoncé` ou `Aucun danger immédiat`, complétée par distance/portée, jamais des coordonnées cachées.
5. **Accès aux actions** par onglets/tiroirs non intrusifs : Combat, À portée, Sac, Carte, Rapport, Journal. Ne pas inventer de raccourcis qui exécutent une action sans tour.
6. **Dock de commandes fixe** : pavé cardinal quatre directions avec attente au centre, accès tactile aux soins existants (bandage/tonique) et action contextuelle ouvrant le vrai panneau historique. Cibles ≥44×44 CSS px, jamais sur la carte.

Le design doit explicitement distinguer *information de menace affichée* et *action de combat réellement disponible* ; le seul changement esthétique ne doit pas faire surgir une frappe involontaire. Le dock peut visuellement changer, mais ses handlers restent inchangés au lot de codage.

## Maquette B — Veyr, refuge entre les runs (priorité 2)

**Ambiance :** feu/ambre, contraste avec Nhal, pierre sombre, forge lumineuse, espace plus calme. Accueil clair de `L'Égaré`, parcours principal `PRÉPARER UNE DESCENTE`. Trois accès réellement prévus : **Coffre sécurisé**, **Forge**, **Dossier des Échos** (indications déjà jouables si révélées). Possibilité d'ouvrir la fiche et le journal. Marquer visuellement le butin sécurisé vs sac risqué.

**Ne pas inventer de PNJ cliquables** : Gardien du refuge, forgeron et érudite ART-091D restent des concepts ; une silhouette décorative ne doit pas promettre un dialogue. Ne pas créer de monnaie, commerce, écran de quête ou trophée non implémenté.

## Maquette C — Sac et coffre (après revue A/B)

Deux contextes sans ambiguïté : `SAC DE DESCENTE · perte au Rappel` et `COFFRE SÉCURISÉ · conservé à Veyr`. Limite `8 objets` réelle, icônes ART-091D, quantité, emplacement équipé, usage/équipement seulement s'ils existent dans le moteur. Préparation au refuge garde sa règle réelle d'un exemplaire par identifiant jusqu'à décision distincte sur les quantités.

## Maquette D — Personnage (après revue A/B/C)

Portrait encapuchonné, statistiques calculées, endurance, XP, équipement et capacités défensives déjà présentes. Pas de classe/sort fictif ; explication courte des probabilités et conséquences. Navigation simple vers la partie en cours.

## Répartition des prochains lots (WIP = 1)

- **UI-096A — Valider les maquettes et le design system** : écran Nhal puis écran Veyr ; comparer à 360×780, au 320×640 et au 393×704. Aucune édition de `docs/game.js` pour ce lot.
- **UI-096B — Implémenter progressivement le cockpit** : style/structure uniquement, actions du vrai moteur conservées, ancien ASCII et test de visibilité du brouillard, aucun chevauchement dock-carte.
- **ART-096 — Nettoyage des sprites et interactifs** : variantes de murs/sol à contraste stable, silhouettes 3 ennemis, états porte/coffre/piège, Arche distincte de Faille. Petits effets uniquement si télégraphiés et sans trahir le brouillard.
- **UI-096C — Refuge, sac et fiche perso** : après succès du cockpit ; modules séparés si trop grands.
- **QA-096 — Android physique et playtests** : 5 joueurs × 2 descentes, envie de rejouer ≥4/5, contrôle PWA offline et reprise après mise à jour.

**Règles de fusion :** Node, Chromium tactile/portrait, Chrome Android 13, build et installation APK, compatibilité `SAVE_KEY="rogov-web-v1"` + `SCHEMA_VERSION=1`, mêmes coûts en tours, RNG/équipement, pas de fuite de brouillard. Les tests automatiques ne remplacent pas une validation esthétique sur téléphone physique.

## Checkpoint de reprise pour une autre conversation

Reprendre la **refonte interface/graphismes de ROGOV** à partir de ce fichier, **UI-096**. L'utilisateur souhaite d'abord **voir et choisir des maquettes**, puis améliorer le jeu progressivement. **Ne pas fusionner de redesign non approuvé**. Commencer par Nhal et Veyr, conserver les décisions historiques UI-092A et Sprite C, puis préparer une unique PR de code après validation des écrans.

**Succès attendu :** reconnaître immédiatement le héros, lire le danger, trouver une action en moins de deux gestes, distinguer l'extraction de la Faille, se repérer dans le refuge et vouloir retourner dans Nhal. Le score studio de DA (actuellement environ 6/10, estimation) n'augmente que si le rendu et sa compréhension sont effectivement meilleurs, non si la planche est simplement plus belle.
