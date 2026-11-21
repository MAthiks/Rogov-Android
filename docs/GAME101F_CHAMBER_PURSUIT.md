# GAME-101F — Poursuite tactique de chambre

## Intention
L'IA du Charognard doit exploiter les salles existantes plutôt que s'arrêter face à un pilier. Le danger reste lisible et facultatif : au-delà d'un rayon local, le joueur peut battre en retraite.

## Contrat
- Une nouvelle descente profonde porte `pursuitPlanVersion=1`. Les anciennes sauvegardes, le premier tutoriel et les cartes sans marqueur continuent à utiliser les déplacements historiques.
- Un Charognard *stalking* à 2–3 cases dans la même pièce (4 sous alarme active) calcule un plus court chemin déterministe de sept pas maximum à travers des sols ordinaires. **Il n'avance que d'une case par tour**, sans RNG et sans attaque supplémentaire.
- Le plan reste strictement dans l'intérieur de la salle. Il évite les murs, les portes même ouvertes, les pièges (révélés ou cachés), les autres ennemis, les secrets et les sites ; il ne marche jamais sur le joueur.
- La préparation de charge, la charge, l'interruption et la récupération du Charognard gardent la priorité. Les Gardiens, Larves et anciens Charognards sont inchangés.
- L'intention sur Android et en ASCII est calculée à partir du même plan, mais affichée seulement si l'ennemi est réellement visible. Aucun chemin, mur inconnu ou position de monstre caché n'est révélé.
- `SCHEMA_VERSION=1` et `SAVE_KEY=rogov-web-v1` ne changent pas. La génération, les pièges, les deux routes de retour, le butin, les sauvegardes et les statistiques ne sont pas modifiés.

## Recette
Vérifier un pilier entre Charognard et Égaré, le détour au premier tour, le coût d'un seul tour, les pièges et compagnons bloquants, les portes et limites de salle, la charge non interrompue, la sérialisation des sauvegardes nouvelles/anciennes, les 121 tuiles et les modes PWA/Android hors ligne. Les tests automatisés contrôlent ces invariants, mais la lisibilité et la difficulté nécessitent toujours une recette sur téléphone physique et des tests humains.
