# ROGOV — UI-096A · Maquette Veyr, première revue

**Date :** 19 novembre 2026.  
**Statut : CONCEPTION / propositions — aucun changement du jeu, aucune fonctionnalité approuvée par une image.**  
**Base technique lue :** `docs/index.html` (`#refuge`, `#stash-items`, `#prep-summary`, `#prep-loadout`, `#veyr-forge`, `#echo-dossier-refuge`, `#start-btn`) ; [UI-096 global](UI096_V3_VISUAL_MOCKUPS.md), [Nhal itération 2](UI096A_NHAL_V2_REVIEW.md), [Sprite C](ART_DIRECTION_SPRITE_C_V1.md).

## Objectif

Créer un **refuge calme, chaleureux et immédiatement utilisable**, en contraste avec le froid et le risque de Nhal. Les joueurs doivent pouvoir répondre en quelques secondes : **qu'ai-je sauvegardé, que puis-je préparer, puis-je repartir ?**

La planche graphique générale de maquettes représente parfois des fonctions **non implémentées** (« acheter », « vendre », « réparations », classes, talents, chiffres de niveau ou ressources inventées). Ce sont des **illustrations hors périmètre** : elles NE DOIVENT PAS entrer dans la proposition jouable ni être décrites comme déjà présentes.

## Hiérarchie — portrait 360×780

1. **En-tête Veyr**, identité sonore et lumière ambre, titre court ; préserver le mode refuge et les stats réelles `#hero-name`, `#hero-level`, `#hero-xp`, `#run-stats`.
2. **Bande d'ambiance basse** : illustration statique originale de la cour et de la forge, **sans PNJ cliquable**, occupant au maximum environ 18 % de la hauteur utile. Le joueur ne doit pas faire défiler plusieurs écrans pour atteindre son coffre.
3. **Mission active**, une phrase issue de `#mission-refuge-text`, lien vers les explications Veyr/Nhal/Rappel (`#lore-primer`).
4. **Coffre sécurisé et préparation** mis en avant : vraie liste d'objets `#stash-items`, synthèse `#prep-summary` sur **8 places maximum**, équipement `#prep-loadout` (arme, main secondaire, armure) ; aucun transfert implicite d'objets.
5. **Forge des cendres** : recettes *réelles* exclusivement : **2 Fragments → Lame cendrée**, **1 Fragment → 2 bandages** ; afficher le vrai solde `#forge-fragments`, utiliser les boutons historiques `#forge-blade` et `#forge-bandages`.
6. **Dossier des Échos** : accès `#echo-dossier-refuge`, compte `#echo-refuge-count`, zéro divulgation d'indices non acquis.
7. **Appel principal « Commencer une descente »**, relié au `#start-btn` existant après que la préparation est claire ; ne pas créer un bouton visuel qui démarre sans conserver le mécanisme de sélection du matériel. L'appel peut être ancré, mais ne doit jamais masquer la forge ou les options.

### Navigation proposée

La version portrait ne doit pas empiler toutes les descriptions du refuge sur une page unique :
- **Préparer** : coffre, choix des objets et des slots, récapitulatif 0–8/8.
- **Forger** : solde Fragments, deux recettes et conséquences.
- **Échos** : liste réelle des découvertes ; si 0/3, un texte d'invitation sans spoilers.
- **Infos** : explication du Rappel, progression et concepts d'habitants uniquement si marqués comme *concepts visuels*.

Ces sections peuvent être des **panneaux ou accordéons** : aucune nouvelle logique de jeu requise ; réutiliser les éléments DOM existants plutôt que les dupliquer. Le bouton d'expédition reste accessible et agit uniquement via son handler historique.

## Traits visuels / contrats

- Veyr **ambre `#CBA36A`** : feu, forge, éclairage et sélection. Les outils et boutons ont des angles solides, peu de décoration inutile.
- Nhal conserve les couleurs **turquoise / pierre froide** : contraste émotionnel entre les deux écrans.
- Les objets du coffre sont **sécurisés**, ceux de Nhal sont **perdus au Rappel** : toujours l'écrire, ne pas se limiter à une couleur.
- Icônes d'objet du vrai catalogue ; proportions et contours homogènes avec Sprite C.
- Trois concepts de PNJ ART-091D : décoration seulement, **aucun « Parler », « Acheter », « Vendre » ou commerce fictif**.
- Aucun système fictif de repos, talents, magie, santé mentale, réparation d'équipement ou marchand PNJ ajouté par cette maquette.
- Le jeu conserve `SAVE_KEY=rogov-web-v1`, `SCHEMA_VERSION=1`, PWA hors ligne et économie de la forge.

## Recette prévue avant intégration

- Parcours de préparation et démarrage du tutoriel, choix des quantités et slots de vrai équipement, forge et retour au coffre.
- 320×640 / 360×780 / 393×704, sans défilement accidentel ni bouton couvert.
- Reprise de sauvegarde à Veyr / état de Rappel, affichage du solde réel, dossier des Échos sans indice non découvert.
- Node, Chromium tactile portrait, Chrome Android 13, build et installation APK ; tests sur téléphone physique distincts.

**Checkpoint :** UI-096A contient maintenant une proposition Nhal itération 2 et une proposition Veyr ancrée dans les fonctions existantes. Conception d'abord, validation visuelle avant toute PR de code.
