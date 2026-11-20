# GAME-101D — Rencontres et risque/récompense

## Décision
Deux sites optionnels supplémentaires, sans nouveau monstre ni modification de l'architecture. Ils sont créés uniquement sur les nouvelles descentes profondes (encounterPlanVersion = 1) et restent séparés des trois sites historiques. Les anciennes sauvegardes restent valides sans les deux nouveaux champs.

## Camp de fortune
Un camp de fortune apparaît dans une salle secondaire variable. Choix exclusif : récupérer un bandage (1 tour, +1 XP), ou panser les blessures (+3 PV, 1 tour, 2 END, +1 XP). Les soins nécessitent des blessures ; sac plein ou END insuffisante bloque gratuitement l'interaction.

## Balise de garde
Une balise apparaît dans les ruines occupées. Choix exclusif : démontage discret (sels de vigueur, 1 tour, 1 END, +1 XP) ou forçage (Fragment de cendre, 1 tour, 3 END, +2 XP, cinq tours d'alerte). Les Charognards utilisent déjà cette alerte pour étendre leur détection de 2 à 4 cases. Aucun ennemi supplémentaire.

## Intégration et sûreté
Deux nouveaux sprites originaux 24x24 ; symboles ASCII b (camp) et g (balise). La carte, le panneau tactile contextuel, la minimap et le rapport d'expédition affichent seulement les sites connus. Le croquis de GAME-101C refuse de révéler les nouveaux sites. La génération vérifie l'accès par les voies publiques, la séparation d'avec les coffres, portes, pièges, ennemis et les lieux historiques ; aucune extraction ne devient obligatoire.

Une interaction coûte exactement un tour et déclenche une seule phase ennemie. Chaque site ne donne qu'une récompense persistante. Aucun changement du schéma de sauvegarde, du système de combat, du RNG ou de la carte de base.

## Recette requise
Contrôler les graines multiples, les chemins de retour, les deux choix de chaque lieu, les coûts, l'alerte, les chargements, le brouillard, l'ASCII, le graphisme, la PWA hors ligne, Chrome Android 13 et la WebView APK. Les tests CI ne remplacent pas l'essai physique sur téléphone.
