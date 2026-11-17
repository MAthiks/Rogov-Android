# ROGOV — Nouvelle voie Android : PWA

## Pourquoi ?

Les APK ROGOV ont été bloqués sur un Samsung par Google Play Protect. Le projet propose désormais une **application web progressive (PWA)**. Le jeu se lance dans Chrome sans installer d'APK. L'ajout à l'écran d'accueil est facultatif.

## Jouer

Site public : https://mathiks.github.io/Rogov-Android/ — version Web Alpha v0.7f après déploiement GitHub Pages réussi.

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

## v0.7a — Combat tactique actif (DEV-072)

Le panneau de combat devient interactif : Attaquer (F), Esquiver (E), Parer (P), Bloquer (B) et Reculer (R) en mode clavier, ou boutons tactiles. Toucher un ennemi ou avancer dans sa case le cible **sans dépenser de tour**. Une attaque n'est possible qu'à CONTACT ; la parade requiert l'épée, l'esquive évite un coup de mêlée, le blocage absorbe 1 dégât d'une attaque (y compris l'onde de Faille) et reculer cherche une case libre qui augmente la distance. Les actions invalides ne coûtent rien.

Les règles de Rappel, extraction, coffre et sac sont inchangées ; les anciennes sauvegardes restent compatibles. **À vérifier en conditions réelles sur Samsung.** L'IA actuelle est conservée ; les nouvelles préparations et indications ennemies restent à travailler en DEV-073.

## Web Alpha v0.7b — Statistiques et équipement (DEV-073A)

En descente, ouvrir **« Fiche de l'Égaré »** pour consulter les six attributs, les potentiels d'Endurance et de critique/esquive/parade/blocage et l'arme prise du sac. Le panneau de cible affiche un bref profil statistique adverse. Les objets prototypes de bouclier et d'armure servent aux tests du modèle, **ne sont pas disponibles dans la partie actuelle**.

**Le combat continue d'utiliser les dégâts et défenses fixes de la v0.7a.** Les chances affichées sont uniquement une prévisualisation avant DEV-073B. Les anciennes sauvegardes sont complétées en mémoire sans toucher au coffre ou aux objets portés ; elles restent sur la clé rogov-web-v1. La PWA met en cache le nouveau module stats.js.

## Web Alpha v0.7c — DEV-073B : statistiques actives

Les attaques du héros et des ennemis peuvent maintenant manquer ou être critiques selon leur précision, leurs attributs, leur matériel et les résistances de la cible. Les préparations d'esquive, parade et blocage ont des chances de réussite et consomment **2 Endurance**, l'attaque consomme **1 Endurance**, attendre rend **3 Endurance** et se déplacer/soigner en rend **1**. Une barre d'Endurance apparaît sous la vie, tandis que le panneau de cible affiche les chances calculées pour cet affrontement.

Les jets utilisent une graine persistante dans la sauvegarde : quitter/revenir n'autorise pas un nouveau tirage sur la même action. Le Rappel, l'extraction et les anciennes sauvegardes restent compatibles. Les chiffres sont expérimentaux et demandent des essais Android, et l'IA ennemie ne choisit pas encore sa propre posture défensive.

## Web Alpha v0.7d — DEV-073C : intentions et contre-jeu

Le Gardien déchu **prépare un coup lourd pendant un tour**. Le joueur peut ensuite esquiver, parer, bloquer, attaquer ou rompre le contact. S'éloigner interrompt la préparation. Après sa frappe, le Gardien tient une garde haute, pouvant bloquer le premier coup réussi du joueur selon ses statistiques et son équipement. Les menaces imminentes sont désormais présentées dans une bande d'alerte, même quand aucune cible n'est sélectionnée. Charognard et Larve conservent leur IA actuelle, mais leurs intentions correspondent à la phase ennemie suivante.

**Vérification nécessaire sur Samsung** : éviter tout débordement, tester la compréhension des avertissements, une défense pendant la préparation, le repli et une partie complète avec extraction. La clé et le schéma de sauvegarde restent inchangés ; le Rappel conserve héros et coffre, mais détruit le sac.

## Web Alpha v0.7e — Nhal varie après la première descente

La première expédition conserve le parcours connu. Dès la deuxième, les murs, les dangers, l'Arche, le butin et les ennemis varient de façon reproductible. Les cartes sont enregistrées dans la descente ; une reprise conserve l'exact même secteur. Le moteur refuse les plans qui ne laissent pas deux voies de retour au butin/extraction et vérifie qu'on peut rejoindre l'Arche sans affronter obligatoirement une créature. Il n'existe pas d'effondrement soudain ou de porte à sens unique. Le Charognard rôde près du Fragment de cendre, créant un choix de risque facultatif. Lire [VAR077_PROCEDURAL_NHAL.md](docs/VAR077_PROCEDURAL_NHAL.md).

Les anciennes sauvegardes actives conservent leur ancienne géographie. ECO-078 doit encore donner une utilité aux ressources rapportées, et le fonctionnement sur Samsung doit être vérifié.

## Web Alpha v0.7f — ECO-078, forge de Veyr

Au refuge, sous le coffre sécurisé, la **Forge des cendres** propose deux transformations : **2 Fragments de cendre** pour une **Lame cendrée (+1)**, ou **1 Fragment** pour **2 Bandages**. Les ressources doivent avoir été ramenées par extraction ; on ne peut pas utiliser le sac d'une descente en cours. Une lame forgée reste dans le coffre jusqu'à ce qu'elle soit sélectionnée pour une nouvelle expédition. Elle apporte de meilleurs dégâts et des bonus de précision/parade/critique, mais sera perdue si le personnage subit un Rappel alors qu'il la transporte.

**L'économie, comme le procédural, reste à tester sur Samsung et avec de vrais joueurs.** Les sauvegardes `rogov-web-v1` ne changent pas de schéma. [Détails ECO-078](docs/ECO078_REFUGE_ECONOMY.md).
