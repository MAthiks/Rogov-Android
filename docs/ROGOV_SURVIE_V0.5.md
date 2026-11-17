# ROGOV — Web Alpha 0.5 : survie tactique

## Principes

Le moteur conserve les mêmes identifiants d'objets et la même clé de sauvegarde.
La mort renvoie toujours le héros à Veyr, mais fait perdre le matériel porté.
Le coffre sécurisé, les niveaux et l'XP restent permanents.

## Nouveaux choix en descente

- **Bandage** : soigne 4 PV, consommé du sac de descente.
- **Tonique du crépuscule** : soigne 6 PV, consommé du sac.
- **Attendre** : passe un tour sur place.
- Les soins et l'attente consomment un tour; chaque ennemi vivant réagit selon ses règles habituelles.
- Interdiction de consommer un soin à 12 PV; échec sans coût de tour ni dépense de ressource.
- Impossible d'utiliser directement un objet resté au coffre.

## Interface

- Bande de santé avec états Stable / Blessé / Danger.
- Compteur d'hostiles encore présents dans la descente.
- Trois boutons pour les actions de survie (attendre, bandage, tonique), activés seulement si utilisables.
- Touches : Espace (attente), 1 (bandage), 2 (tonique).
- Le journal v0.3 affiche les soins et les attaques adverses.

## Maintenance

- Aucun changement de schéma de sauvegarde ni de moteur Android natif.
- Mises à jour de l'application web et de son cache PWA versionné.
- Tester : soins, consommation, tour, contre-attaque, mort, extraction, migration de sauvegarde et état de santé.

## Suite envisagée

Une future v0.6 pourra enrichir le refuge et les récompenses pour renforcer l'intérêt de l'extraction, sans multiplier les fonctions tant que l'équilibre du prototype n'a pas été testé sur téléphone.
