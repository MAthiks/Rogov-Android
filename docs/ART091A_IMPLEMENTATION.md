# ROGOV — ART-091A : L'Égaré encapuchonné (Sprite C)

**Référence validée :** [Direction artistique Sprite C v1](ART_DIRECTION_SPRITE_C_V1.md).
**Statut technique :** sprites et raccordement au moteur Web réalisés ; publication sous réserve de CI et de vérification Android.
**Portée :** quatre sprites idle originaux pour le PJ uniquement. Ne concerne pas ART-091B/C/D.

## Livrables

- hero-art.js fournit quatre silhouettes **SVG 24 × 24** autonomes, transparentes et pixelisées : **bas**, **haut**, **gauche**, **droite**.
- Capuche **relevée sur les quatre vues** ; palette gris prune/brun désaturé, cape usée, écharpe, lanière, sacoche et bottes. Face/masque ivoire en bas/profil, **dos sans visage apparent**.
- Même point d'ancrage, mêmes proportions, réutilisation du profil gauche en symétrie contrôlée pour la droite. Aucune croix d'interaction, texte, décor de planche ou requête réseau.
- tiles.js remplace l'ancien héros par Sprite C ; conserve la clé TILE_SPRITES.hero (vue bas) pour les légendes et anciens tests, et ajoute hero_up, hero_left, hero_right.
- La classe tile-hero et son contour contrasté demeurent **sur toutes les orientations**, sans changer taille des tuiles ni collision.
- app.js suit seulement les **déplacements effectivement réalisés**, y compris les replis ; les tentatives bloquées, clics et actions sans déplacement ne tournent pas le PJ. L'orientation est locale à l'interface : **elle revient à bas après rechargement**, sans enrichir les sauvegardes.
- sw.js précache le nouveau module et renouvelle la version du cache PWA pour le jeu hors ligne.

## Invariants de gameplay

- Aucun changement à game.js, au RNG, à la génération procédurale, à la grille logique, au brouillard, aux PV, aux tours, à l'équipement ou aux règles de combat.
- Clé SAVE_KEY = "rogov-web-v1" et SCHEMA_VERSION = 1 maintenues. Aucun champ run.facing ajouté ; les sauvegardes v0.7f restent lisibles.
- **ASCII intact** : bascule possible à tout moment, sans tour supplémentaire et sans reset visuel tant que la page demeure ouverte.
- Aucune image d'entité ou propriété de l'ennemi ajoutée aux cases encore inconnues ; la visibilité garde son traitement existant.

## Vérifications automatisées ajoutées

1. tests/hero-art.test.mjs : quatre SVG distincts avec capuche, format 24px, palettes, assets autonomes, orientation pure, compatibilité TILE_SPRITES, schéma de sauvegarde et cache hors ligne.
2. tests/mobile-browser.test.mjs : Chromium tactile en **360 × 780, DPR 3**, pas réel puis demi-tour, image directionnelle, lisibilité sans débordement, bascule ASCII, sauvegarde rechargée et absence d'erreur navigateur.
3. Suites existantes (npm run check:web, npm run test:web, CI Playwright, Chrome Android 13) à conserver sans adaptation du moteur.

## Recette sur téléphone réel (non automatisable dans GitHub Actions)

- Ouvrir la PWA sur Android Chrome (écran portrait, idéalement largeur CSS 360 px), vérifier la capuche en vue bas.
- Vérifier chaque orientation dans une salle ouverte ; distinguer profil gauche/droite et dos avec capuche à zoom normal.
- Vérifier que le PJ se détache d'un sol sombre, d'un mur, du brouillard et des marqueurs de coffres/ennemis sans les recouvrir.
- Frapper un mur, attendre, cibler et agir : la capuche doit garder sa dernière orientation jusqu'au prochain déplacement réel.
- Basculer en ASCII puis revenir, quitter/reprendre une sauvegarde et réessayer hors ligne après installation PWA.

**La recette physique et le jugement esthétique final restent à confirmer par le joueur.**

## Prochains lots conservés — sans changement de périmètre

- **ART-091B — Ennemis** : refaire Charognard (bas, asymétrique), Gardien déchu (large, lourd), Larve de faille (segmentée) ; conserver visées, alertes, comportements et brouillard.
- **ART-091C — Interactifs et lieux** : portes/coffres/pièges à états lisibles, Arche, secrets révélés et trois sites de Nhal.
- **ART-091D — PNJ/objets** : silhouettes conceptuelles des habitants de Veyr, objets/sac et cohérence de l'inventaire ; aucune nouvelle mécanique implicite.

**WIP = 1 :** ne pas entreprendre ART-091B avant validation d'ART-091A.
