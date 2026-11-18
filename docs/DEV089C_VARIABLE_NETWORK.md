# ROGOV — DEV-089C : Réseau procédural de Nhal

**Statut : prototype sur `dev/dev-089c-variable-network`, non fusionné dans `main`.**  
**Source :** [GDD Exploration de Nhal v0.9](GDD_EXPLORATION_NHAL_V0.9.md), sections 11.3, 11.4, 13 et 14.

## Objectif

Supprimer la prévisibilité du réseau systématique de 12 salles reliées par 17 couloirs. **Une nouvelle descente profonde possède maintenant entre 8 et 12 salles** et un véritable ensemble variable de liaisons (des liaisons transversales, des galeries plus longues, des boucles différentes), sans rendre la difficulté arbitraire.

Cette livraison se concentre sur les **réseaux connectés avec plusieurs options de retour**, pas encore sur des impasses récompensées par des événements uniques : ces dernières méritent un lot de design dédié pour ne pas envoyer le joueur dans une branche stérile. Les niches et alcôves DEV-089A restent disponibles.

## Modèle de réseau

- **8 emplacements fondamentaux** forment un circuit périmétrique. Il garantit deux voies de retour ordinaires entre le vestibule et l'Arche.
- **0 à 4 emplacements complémentaires** sont choisis selon la graine, avec des connexions qui allongent certains chemins et créent des boucles intérieures.
- Une **galerie transversale centrale** garantit une troisième option structurelle, afin que l'alarme en couloir et la dalle devant un coffre restent évitables **sans perdre les deux routes de retour**.
- Les salles sont ordonnées par identifiants compacts et repérées aussi par un `slot` spatial ; **l'ID d'une salle ne correspond plus à sa position fixe**. Le vestibule, l'Arche, le coffre profond, l'atelier, les ennemis et les événements sont attachés à des **rôles ou slots**, non à `rooms[8]` ou `rooms[5]`.
- Les dimensions, les centres (décalages de lignes/colonnes), l'emplacement des seuils et les détails restent déterministes. Les couloirs peuvent traverser un emplacement de chambre **non générée** pour créer des traversées longues ; jamais une chambre existante.
- Les passages ordinaires ont un seuil sur chaque mur ; **six véritables portes**, dont deux dans le vestibule, sont maintenues. Toute porte est facultative, ouvrable/fermable, réversible.
- Les **quatre formes réelles** de DEV-089A (L, pilier, effondrement, alcôve), le nouveau terrain DEV-089B et le brouillard restent actifs.

## Contrat de sécurité / héritage

- `topologyVersion:1` et `run.links` / `run.networkKind` sont enregistrés avec les **nouvelles descentes**. Un champ de version manquant dans un ancien donjon n'entraîne **aucune régénération rétroactive**.
- Le validateur traite séparément les anciens donjons (12 salles, six portes, sans `topologyVersion`) et les nouveaux (8 à 12 salles, liens vérifiés). Les sauvegardes historiques à 34 portes sont toujours reconnues.
- Départ, Arche, coffre pédagogique, coffres profonds, 4 ennemis, 2 failles, 2 pièges, un passage secret et les 3 salles spéciales restent accessibles dans chaque nouveau plan.
- **Au moins deux routes de retour indépendantes**, même en excluant simultanément les deux cases piégées, depuis le départ et chaque coffre profond ; au moins un itinéraire sans combat. Aucun secret n'est indispensable.
- Les positions de pièges DEV-086 gardent leur fonction : fil d'alarme dans un **vrai corridor**, dalle à côté d'un coffre, indices repérables et méthodes de désamorçage.
- Toutes les étapes de génération et toutes les variantes d'architecture sont indépendantes du RNG de combat.
- Rejet déterministe plafonné à 12 tentatives : un donjon non sûr n'est jamais publié, aucune sauvegarde ancienne n'est réécrite.
- Cache du service worker actualisé et `deep-topology.js` intégré dans les ressources PWA hors ligne.

## Tests et limites

**Automatisés :** les suites existantes DEV-080/085/086/087/088, la géométrie des salles DEV-089A, le tileset DEV-089B, et `tests/variable-network.test.mjs`. Cette dernière vérifie 240 graines, toutes les tailles 8–12, les liens, la visibilité initiale, les deux voies de retour malgré les pièges, la répétabilité des plans, le refus des métadonnées falsifiées et le chargement/extraction.

**Android :** le scénario Chromium à 360 px génère un véritable plan à 8 salles, le recharge, vérifie la carte 11×11, le brouillard, le rapport d'extraction et l'absence de débordement horizontal. Tests Chrome Android 13 émulateur + APK historique séparés ; **recette physique nécessaire avant fusion** sauf décision explicite de publier.

**Limites assumées :** le réseau de sécurité conserve une structure de circuit et la position générale de certains objectifs. La géométrie n'est pas un labyrinthe infini. Les **impasses à récompense contextuelle** et les grands niveaux à secteurs multiples restent un chantier ultérieur, pas une difficulté ajoutée au hasard.

## Recette Android sur branche isolée

Sur Termux :

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-089c-variable-network https://github.com/MAthiks/Rogov-Android.git rogov-qa-089c
cd rogov-qa-089c
python -m http.server 8791 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8791/** dans Chrome et démarrer une **nouvelle deuxième descente** ; enchaîner si possible deux ou trois descentes. Observer que le nombre de salles, les embranchements, les couloirs et les chemins de retour changent, puis vérifier les interactions (coffre, piège, atelier, porte, extraction) et le rechargement hors ligne. Le port 8791 isole les sauvegardes du site officiel.

**Conformité de production :** pas de fusion automatique vers `main` dans ce lot avant vérification CI et accord utilisateur.
