# ROGOV — Nouvelle voie Android : PWA

## Pourquoi ?

Les APK ROGOV ont été bloqués sur un Samsung par Google Play Protect. Le projet propose désormais une **application web progressive (PWA)**. Le jeu se lance dans Chrome sans installer d'APK. L'ajout à l'écran d'accueil est facultatif.

## Jouer

Site public : https://mathiks.github.io/Rogov-Android/ — version Web Alpha v0.6.1 publiée.

Sur le téléphone : ouvrir l'URL dans Chrome. Pour ajouter l'application à l'écran d'accueil : Chrome → menu ⋮ → « Ajouter à l'écran d'accueil » ou « Installer l'application ».

Le premier chargement nécessite Internet ; une fois le service worker installé, les ressources de base sont accessibles hors ligne. Les sauvegardes sont locales (localStorage) et séparées des données de l'APK.

## Boucle v0.1

- Refuge de Veyr avec coffre permanent.
- Descente ASCII dans Nhal, déplacements tactiles, clavier et glissement.
- Butin et sac limité à huit unités.
- Extraction : récupération de tout l'équipement transporté au refuge.
- Mort par faille : Rappel à Veyr, perte de tout le sac, héros/XP conservés.
- Tests automatisés Node.js.

Les fichiers de l'application web se trouvent dans /docs. Le moteur pur JavaScript se trouve dans docs/game.js, l'interface dans docs/app.js. Le système Android/Kotlin demeure dans /app.

## Hébergement

Le workflow « ROGOV Web — Tests and GitHub Pages » vérifie le moteur, génère les icônes PWA et déploie sur GitHub Pages. Si Pages n'est pas encore autorisé, le propriétaire peut l'activer dans Settings → Pages → Build and deployment → Source = GitHub Actions.

Le code est public ; la licence de réutilisation doit encore être définie. Les créations originales ne sont pas issues d'autres œuvres.

## Pack graphique original v0.2

Six sprites SVG embarqués dans `docs/tiles.js` : sol, mur, héros, butin, danger et sortie. Un bouton bascule entre rendu graphique et ASCII sans changer le moteur, le personnage ou les sauvegardes. Aucun asset sous licence tierce.

Pour envoyer un lien de jeu au testeur, activer GitHub Pages dans **Settings → Pages → Source : GitHub Actions**. L'URL sera `https://mathiks.github.io/Rogov-Android/` une fois le déploiement réussi. Les sauvegardes de chacun restent locales à son navigateur.

## ROGOV v0.4 — graphismes et combats

- Silhouettes améliorées : héros plus contrasté, sol simplifié, murs différenciés.
- Deux ennemis originaux : charognard (rapide, poursuite courte, 3 PV, 1 dégât) et gardien déchu (lourd, stationnaire, 5 PV, 2 dégâts).
- Marche vers un ennemi pour l'attaquer. Le joueur inflige 2 dégâts à mains nues ou 3 avec l'épée usée ; les monstres vivants adjacents contre-attaquent.
- En cliquant sur une case de la carte graphique, afficher une fiche d'identification sans consommer de tour.
- Légende graphique : joueur, charognard, garde, butin, faille et extraction.
- En cas de mort au combat : Rappel et perte de tout le sac, personnage et coffre conservés.
- Chargement des sauvegardes précédentes : les descentes déjà commencées conservent leur carte et leur inventaire, sans ajouter rétroactivement les nouveaux ennemis.
- Compatibilité avec les modes HTML/PWA, ASCII et pixel art.

## Web Alpha v0.5 — Survie tactique

- Bandage consommable en descente : +4 PV, sans dépasser 12 PV.
- Tonique du crépuscule consommable : +6 PV ; il peut être récupéré sur la carte.
- Une utilisation de soin coûte un tour et déclenche la phase ennemie.
- Attendre coûte également un tour et déclenche les ennemis proches.
- Bande de santé et indicateur de hostiles, avec libellés textuels.
- Contrôles tactiles pour l'attente et les soins ; raccourcis clavier Espace / 1 / 2.
- Sauvegarde locale toujours compatible avec v0.4 ; coffre et perte des objets au Rappel inchangés.


## v0.5.1 — Écran titre validé

Un écran d'accueil original et sombre présente ROGOV, l'Arche de Nhal et l'Égaré (sans croix). Les boutons Commencer/Continuer et Nouvelle partie sont fonctionnels. « Continuer » reprend l'état sauvegardé en conservant les règles actuelles et les paramètres d'affichage. « Nouvelle partie » demande confirmation avant d'effacer une progression existante. Un bouton « Retour à l'écran titre » est disponible depuis les options en jeu. La scène a été recadrée à partir de la maquette approuvée et optimisée pour une PWA.


## Web Alpha v0.6 — Lignées de Nhal

La v0.6 applique une bible artistique inspirée de l'horreur cosmique, avec des sprites originaux 24×24 :
- **Charognard** : silhouette basse, pattes asymétriques, cuivre maladif. Poursuite à courte distance.
- **Gardien déchu** : silhouette verticale en pierre ancienne, tête à fente lumineuse, couleur os/ardoise. Reste sur place et frappe au contact.
- **Larve de faille** : silhouette incomplète et membrane spectrale vert pâle, avec fissure lumineuse centrale. Se tient immobile ; émet une onde (-1 PV) en ligne droite à deux cases tous les trois tours si aucun mur ne bloque.

Les murs, la faille et l'arche d'extraction reprennent les mêmes matériaux, tout en restant immédiatement lisibles. La légende graphique et l'inspection tactile identifient les trois ennemis.

Aucune modification du format de sauvegarde : les descentes v0.5.1 déjà en cours gardent leur population d'ennemis d'origine, les nouvelles descentes commencent avec la Larve. Le personnage, l'XP et le coffre restent persistants ; la mort fait perdre le sac. Les sprites sont embarqués, sans police ni image externe. Le jeu fonctionne hors ligne après le premier chargement.

## v0.6.1 — Correctif responsive et cache Android

L'écran titre inclut désormais les règles CSS critiques directement dans le HTML afin de rester lisible si un navigateur conserve temporairement une ancienne feuille de style. Les ressources CSS/JS sont versionnées et téléchargées en priorité depuis le réseau avant d'être utilisées hors ligne, pour éviter le mélange d'une nouvelle page HTML avec un vieux CSS. Aucune modification des sauvegardes ni du gameplay. Correctif motivé par un retour de test sur Samsung (illustration trop large, boutons non stylés, titre tronqué).

## Combat hybride v0.7 — orientation validée, NON DÉPLOYÉE

La prochaine évolution supprimera **l'attaque automatique lorsqu'on marche sur un ennemi** et conservera la carte pendant les engagements. Un panneau tactique contextuel indiquera cible, PV, distance CONTACT/PROCHE/LOIN, intention ennemie et actions du joueur : attaquer, esquiver, parer/bloquer, reculer. Le soin et l'attente resteront disponibles.

La référence de conception est [docs/COMBAT_DESIGN_V0.7.md](docs/COMBAT_DESIGN_V0.7.md). Le plan d'exécution figure dans [docs/DEV_PROMPT_V0.7.md](docs/DEV_PROMPT_V0.7.md). **À ce stade, le site conserve le combat simplifié de la v0.6.1**. Le Rappel, l'extraction, le coffre et les sauvegardes restent les invariants prioritaires.

## v0.6.2 — Aperçu de combat hybride (DEV-071)

Les ennemis de Nhal peuvent être sélectionnés sur la carte graphique (toucher le sprite) ou dans la bande « Menaces identifiées », accessible aussi en ASCII. La sélection n'use ni tour ni équipement. Le panneau tactique montre les PV, la portée, l'intention du prochain tour, l'arme et la défense. Sur clavier, **C** passe à la cible suivante.

**Limite volontaire :** les commandes Attaquer, Esquiver, Parer/Bloquer et Reculer sont uniquement présentées visuellement ; elles ne sont pas encore actives. Le moteur actuel attaque toujours en marchant sur une case ennemie. Le prochain lot DEV-072 corrigera ce point avec de nouvelles règles. Aucun nouveau format de sauvegarde ou APK requis.
