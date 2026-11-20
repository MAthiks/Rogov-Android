# GAME-101E — Frappe de brèche et combat de position

## Contrat

La frappe de brèche est une **alternative volontaire** à l'attaque normale : 3 END, un tour, une arme équipée, une cible ennemie visible au CONTACT. Deux bonus de +2 dégâts : Charognard en récupération après une charge ou Gardien en préparation d'un coup lourd. Tuer le Gardien lors de ce tour risqué accorde +1 XP **une seule fois** ; s'il survit, sa riposte reste possible. Si aucune de ces fenêtres ne s'applique, un ennemi acculé devant un mur ou une porte fermée *visible* permet +1 dégât. Le bonus n'est jamais cumulatif.

Les jets de toucher et de critique, l'armure et la garde du Gardien passent par les fonctions existantes. Une attaque manquée coûte le tour et l'endurance. Le mécanisme n'expose jamais le brouillard, ne génère aucun nouvel ennemi et ne modifie pas la carte.

`combatOpeningVersion=1` n'existe que dans les nouveaux étages profonds et se sauvegarde dans `rogov-web-v1`; son absence sur une ancienne partie conserve strictement le contrat historique. Le panneau tactile propose un bouton explicitement désactivé hors ouverture ; la touche **V** fait la même action. Le cache PWA contient le module.

## Recette Android

Tester une charge puis la récupération d'un Charognard, un Gardien en train d'armer son coup, un positionnement contre un mur découvert, la mauvaise distance, la cible non visible, une ancienne sauvegarde sans marqueur, une arme non équipée, l'END insuffisante et le rechargement hors ligne. Les tests automatisés couvrent ce contrat ; une recette sur téléphone physique reste nécessaire.
