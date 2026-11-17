# ROGOV — DEV-073A : attributs partagés et équipement

**Version : Web Alpha v0.7b (prototype de modèle, sans changement des dégâts).**  
**Statut : code et tests — vérification CI requise avant annonce de publication.**  
**Source fonctionnelle : docs/STATS_EQUIPMENT_CLASSES_V0.7.md.**

## Données intégrées

- Attributs communs héros et ennemis : **FOR, AGI, CON, PER, VOL, INT**.
- Onze archétypes reconnus dans le registre de données, mais **aucune classe choisie / compétence déverrouillée** dans le gameplay actuel.
- Profils de base distincts du Charognard, Gardien déchu et Larve de faille.
- Catalogue d'équipement contenant l'Épée usée réelle, le matériel inné des monstres et deux **pièces prototypes non disponibles** destinées aux tests de bonus (bouclier et armure).
- Emplacements : **mainHand, offHand, body, relic**. Les objets restent physiquement dans le sac existant ; un équipement ne peut pas être référencé par le héros s'il n'est pas effectivement transporté.
- Calculs de stats dérivées : puissance, précision, probabilités plafonnées de critique/esquive/parade/blocage, absorption, armure, résistance occulte et Endurance maximale.
- **Important : ces valeurs sont actuellement des prévisualisations numériques.** La v0.7a conserve ses dégâts et défenses fixes jusqu'au lot DEV-073B.

## Compatibilité et migration

- Conservation de la clé de sauvegarde **rogov-web-v1** et de son **schéma 1**.
- Les nouvelles parties démarrent avec six attributs neutres et une classe **non choisie** (pas de douzième archétype fictif).
- L'ancienne sauvegarde sans attributs, classe, loadout ou profils d'ennemis reste **valide**.
- Lors du chargement, le normaliseur complète les nouveaux champs sans remplacer les anciens PV, XP, niveau, coffre, sac, butin ramassé, cibles, positions, tours ni ennemis.
- Les anciennes descentes sans liste ennemie deviennent une liste vide ; les anciennes descentes avec deux ennemis ne reçoivent pas une nouvelle Larve.
- Les valeurs invalides (attributs hors limites, classe inconnue, équipement impossible ou absent du sac) font rejeter la sauvegarde comme incompatible ; aucune suppression automatique.
- La mort continue de supprimer tout équipement porté ; l'extraction dépose le contenu du sac au coffre. Les caractéristiques et la future classe demeurent persistantes.

## Rendu mobile

Une petite **Fiche de l'Égaré** repliable présente les six attributs et les statistiques dérivées, marquées comme aperçus pour DEV-073B. Le panneau d'engagement affiche quelques informations statistiques de la créature ciblée. Cette lecture n'ajoute pas de tour ni de commandes.

## Suite

**DEV-073B** : un moteur de jets reproductibles (seed sérialisée ou RNG injecté), couplant arme/armure/bouclier et statistiques aux chances réelles d'esquiver, parer, bloquer et infliger des critiques. D'abord en tests de simulation héros contre Gardien, puis dans le jeu.

**DEV-073C** : améliorer les intentions ennemies et leurs annonces, puis équilibrer. Ne pas ajouter les onze classes et la magie avant la stabilisation de ces fondations.
