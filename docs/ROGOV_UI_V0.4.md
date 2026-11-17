# ROGOV Web Alpha 0.4 — Direction artistique et premier combat

## Objectif

Faire reconnaître en un coup d'œil : joueur, deux familles ennemies, murs, sol, butin, piège et extraction, sur petit écran Android.

## Conventions visuelles

- Joueur : silhouette verticale et cape vert clair avec bordure ivoire.
- Charognard : silhouette animale basse en cuivre, poursuite courte.
- Gardien déchu : silhouette massive et armurée gris clair, combat de contact.
- Butin : coffre doré. Faille : losange rouge. Extraction : arche turquoise.
- Murs : pierre bleutée différenciée. Sol : très peu de motifs pour diminuer la surcharge visuelle.
- Chaque catégorie est identifiée aussi par une forme, un nom dans la légende et une description au toucher.
- Sprites SVG originaux, embarqués dans le code; aucune ressource extérieure.

## Règles tactiques v0.4

- En avançant vers une case occupée par un ennemi, le joueur attaque depuis sa case actuelle.
- Attaque du joueur : 2 points de dégâts; avec l'épée usée portée : 3.
- Charognard : 3 PV, 1 dégât, se rapproche quand le héros est à deux cases ou moins.
- Gardien : 5 PV, 2 dégâts, tient sa position et frappe au contact.
- Ennemi vaincu : retrait de la carte et gain de 2 ou 4 XP.
- Après un tour valide, les ennemis adjacents peuvent frapper; PV nuls => Rappel à Veyr et perte de l'inventaire porté.
- Extraction et mort par faille restent immédiates; les règles de coffre et résurrection sont inchangées.

## Compatibilité et validation

La clé de sauvegarde et le schemaVersion restent inchangés. Les descentes démarrées avec la v0.3 sans champ \`enemies\` sont reprises sans ennemis (aucun spawn rétroactif). Les prochaines descentes comportent les deux ennemis.

Tests automatiques : butin, extraction, Rappel, sauvegardes anciennes, progression XP, collision, ennemis, combat et graphismes.

Le dépôt est public et le jeu jouable sur GitHub Pages. La version Android APK reste distincte; aucun nouveau package n'est requis.
