# GAME-095B1 — Étages successifs et choix à l'Arche

**Direction validée :** renforcer le dungeon crawler roguelike d'extraction de ROGOV (Veyr/Nhal) sans remplacer la partie existante ni introduire de verrouillage artificiel.

**Statut :** lot B1 en branche de production, à valider par CI et recette physique Android. La profondeur, la survie, l'équipement et l'extraction sont réels ; une économie et des ennemis propres aux étages supérieurs seront traités plus tard.

## Boucle jouable de trois étages

1. **Première descente historique (tutoriel) :** inchangée, une seule carte ; entrer sur l'Arche E extrait immédiatement.
2. **Nouvelle expédition profonde via l'interface Android :** étage 1 / 3 ; la géométrie et les coffres du premier étage restent identiques à GAME-095A3 pour le numéro de descente concerné.
3. **À l'Arche E d'un nouvel étage :** le déplacement consomme son tour normal, restaure 1 Endurance comme d'habitude, et affiche une décision explicite **Extraire à Veyr** ou **Continuer vers l'étage suivant**. L'ennemi n'attaque pas pendant le choix et aucun tour supplémentaire n'est facturé ; le joueur peut encore s'éloigner de l'Arche si souhaité.
4. **Poursuivre :** confirme que l'étage ne sera plus revisitable dans cette expédition. Génère une nouvelle carte procédurale validée, nouveaux ennemis, coffres, pièges et secrets. Conserve **PV, Endurance, Endurance maximale, RNG de combat, inventaire, équipement, XP et compteur de tours**. Aucun soin gratuit ; progression de +1 XP pour franchir le palier. Les états purement locaux de l'ancien étage sont abandonnés (découvertes, ennemis, choix de salle, alarmes, pièges, ciblage, coffres ouverts).
5. **À l'étage 3 / 3 :** plus de bouton « Descendre ». L'extraction explicite à Veyr termine l'expédition, transfère **toutes** les unités du sac, attribue les +2 XP d'extraction ; un Rappel à n'importe quel étage détruit toujours le sac.
6. **Record permanent facultatif :** `meta.bestDepth` mémorise le plus haut étage atteint, y compris après Rappel. Pas de nouveau schéma de sauvegarde obligatoire.

## Contrats techniques

- Constantes et calculs purs dans `docs/floors.js` : `MAX_FLOOR_DEPTH=3`, `deepFloorSeed(descents,depth)`, `floorChoiceAvailable`, `canDescendFurther`.
- L'étage 1 correspond à `generateDeepLayout(meta.descents)` ; étages 2–3 reçoivent des graines distinctes, déterministes et **indépendantes du RNG du combat**. Le run enregistre immédiatement la nouvelle carte et son butin, sans les recalculer au chargement.
- Seules les **nouvelles parties démarrées depuis l'interface** passent `{multiFloor:true}` à `beginRun`. Cette option conservatrice n'affecte ni le tutoriel ni les tests/callers historiques ni les anciennes descentes en cours. Leur `run.floorDepth` est absent et l'Arche reste une extraction automatique.
- Champ de sauvegarde facultatif `run.floorDepth` (1 à 3, seulement sur une carte profonde au format A3) ; contrôle dans `validateSave`. Pas de migration, pas de modification de `SAVE_KEY="rogov-web-v1"` ni de `SCHEMA_VERSION=1`.
- Le joueur ne peut choisir de changer d'étage qu'à l'Arche `E`. Aucune escalade forcée, aucune route secrète indispensable et deux voies de retour publiques par carte selon le validateur existant.
- Pour éviter une inflation artificielle de la difficulté, **aucun bonus caché de PV aux ennemis, piège imposé, verrouillage de retour ni réduction de butin** n'est ajouté dans B1. Le danger provient de la durée d'exposition, des décisions de soins et de l'enchaînement des combats. Ajustement des ennemis/ressources selon la profondeur : B2/C/D à évaluer via les vrais joueurs.
- L'Arche et le HUD sont tactiles et restent lisibles à 320/360/393 px ; Sprite C et ASCII inchangés. Les libellés n'exposent aucune autre salle ni le contenu secret d'un futur étage. `floors.js` est précaché dans la PWA hors ligne.

## Tests automatiques

- Première descente et ancienne sauvegarde profonde : **extraction automatique historique**.
- Nouvelle expédition : arrivée à l'Arche, choix volontaire, coût des tours, absence de RNG réinitialisé, protection de la sortie.
- Trois étages successifs : distincts, connectés, nouveaux ennemis/loot, PV et sac conservés, états locaux remis à zéro, impossible de descendre au-delà de 3.
- Extraction / Rappel, record de profondeur, compatibilité et reprise par JSON, invalidation des profondeurs malformées.
- Test de 32 graines × trois cartes : génération reproductible, chemins d'extraction publics sécurisés.
- Mobile : scénario tactile Android portrait, confirmation, sauvegarde/rechargement au 2e étage, lecture du HUD et extraction, largeur de 320 px, absence d'erreurs JS.
- Gate de fusion : Node, Chromium mobile, Chrome Android 13 émulé et APK signé/installé tous verts.

## Recette humaine non simulée

Conserver une ancienne sauvegarde, vérifier la première descente, la seconde avec 3 étages, fermer/reprendre au 2e, garder le matériel après extraction, comparer la difficulté ressentie aux ressources disponibles et confirmer qu'aucun joueur n'est contraint de poursuivre. Cette recette et le protocole **5 joueurs × 2 expéditions** restent ouverts jusqu'aux retours réels.

**Suite B2 :** bilan de lisibilité du choix et de l'attrition, puis réglage de la composition des ennemis/récompenses selon la profondeur avant GAME-095C.
