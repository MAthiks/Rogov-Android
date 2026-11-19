# ROGOV — QA-092 · Audit de studio avant Alpha 0.8

**Référence :** 19 novembre 2026 · `MAthiks/Rogov-Android`, UI-092A + correctif visuel PJ fusionnés.  
**Statut :** **audit technique QA-092 réussi en CI ; Alpha 0.8 NON HOMOLOGUÉE**. Ne pas confondre la réussite de la CI et le plaisir réel d'une descente.  
**Références :** [QA-074](QA074_ALPHA_8_ASSESSMENT.md), [maquette UI v2](UI_V2_MAQUETTE_V1.md), [cockpit UI-092A](UI092A_ANDROID_COCKPIT.md), [protocole humain QA-092](QA092_PLAYTEST_PROTOCOL.md).

## Décision de production

**Priorité P0 : valider une vraie session Android sur appareil physique et éliminer les blocages de la boucle complète.** Pas de classes, sorts ou nouvelles familles d'ennemis avant cette recette. On conserve le moteur et la sauvegarde existants.

La dernière base avant cet audit a **réussi** la compilation APK et le workflow Web/Pages après fusion ([Web/Pages](https://github.com/MAthiks/Rogov-Android/actions/runs/44424381189), [APK](https://github.com/MAthiks/Rogov-Android/actions/runs/44424381113)). Cette réussite **ne remplace ni** la manipulation sur smartphone réel, **ni** les retours de joueurs.

## Périmètre automatisé ajouté par QA-092

- `tests/qa092-studio.test.mjs` : parcours effectif des 13 pas de la première descente, prise de relique exposée, extraction réelle, dépôt au coffre, forge de bandages, lancement d'une seconde descente. Test de perte après Rappel et conservation du coffre/XP ; 30 graines de donjons profonds et routes alternatives sans ennemi ni piège obligatoire ; rapport sans spoiler ; invariants UI/PWA.
- `tests/mobile-browser.test.mjs` : parcours tactile **réel via les boutons** depuis l'écran titre et la sélection du coffre jusqu'à la forge, puis deuxième descente et rechargement ; trois tailles de viewport **320×640, 360×780 et 393×704**, commandes fixes, absence de chevauchement, tiroirs, options, retour au titre.
- Un parcours browser sur Chromium mobile et un émulateur Chrome Android 13 sont des tests d'ingénierie ; ils ne démontrent **pas** l'ergonomie subjective ni l'esthétique sur un téléphone physique.
- La génération dispose déjà de tests topologiques sur 240 graines ; ce nouveau lot vise **la boucle économique et les gestes de l'interface**, sans prétendre mesurer la difficulté perçue.

## Constat de conception, issu de la lecture du code

| Priorité | Constat | Conséquence | Action proposée |
|---|---|---|---|
| **P0 — BUG découvert en CI QA-092** | Sur les viewports Chromium **320×640** puis **393×704**, le pavé de déplacement fixe de UI-092A recouvrait le bas de la carte 11×11. | Le PJ et les éléments de la carte pouvaient être masqués par une commande permanente. | Correctif CSS dans UI-092A : échelle réduite pour tous les écrans courts (jusqu'à 760 px de hauteur) **sans réduire les cibles tactiles** ; test géométrique dédié **réussi sur les trois viewports 320×640 / 360×780 / 393×704**. |
| **P0** | Pas encore de recette visuelle / tactile confirmée sur un téléphone physique, après UI-092A | Alpha 0.8 ne doit pas être annoncée comme validée | Effectuer le protocole humain, captures et test Android réel |
| **P1** | Les cases du coffre sélectionnent **un identifiant d'objet à la fois**. `beginRun` n'autorise pas les identifiants répétés et transfère un exemplaire par ID. | Quatre bandages au coffre n'autorisent actuellement l'emport que d'un bandage à la préparation. Les choix de soin peuvent être trop limités. | Faire observer la compréhension et décider des quantités au lot futur UI-092B/C, **sans modifier la règle pendant l'audit** |
| **P1** | Le premier niveau possède un itinéraire sûr connu, historique de QA-074 ; les descentes profondes sont désormais procédurales. | L'introduction peut être comprise comme trop facile, mais un tutoriel relativement sûr peut être intentionnel. | Tester séparément l'apprentissage en descente 1 et la tension en descente 2 ; ne pas généraliser la faiblesse du tutoriel à tout Nhal |
| **P1** | Le cockpit UI-092A regroupe combats, interactions et options en tiroirs au-dessus des commandes fixes. | Risque de confusion du joueur, de débordement sur petits téléphones ou d'actions cachées | Mesurer temps de découverte du bouton « À portée », visibilité des commandes, capacité à revenir à la carte |
| **P2** | Combat tactique, défense, équipement, endurance, économie et extraction existent, mais aucun jugement humain récent sur leur lisibilité n'est archivé | Équilibrage esthétique et décisionnel non démontré | Une fois P0 couvert, recueillir 5 testeurs × 2 descentes avant d'ajuster les valeurs |
| **P3** | UI-092B/C/D et diversification de Nhal restent des projets distincts | Les développer maintenant peut masquer les défauts de la boucle | Programmer après classement des retours QA-092 |

## Résultats mesurés en CI QA-092 — 19 novembre 2026

- **248/248 tests moteur réussis**, dont les 5 nouveaux contrôles d'audit.
- **34/34 tests Chromium tactiles réussis**, dont le parcours complet refuge → relique → extraction → 2 bandages forgés → nouvelle descente → sauvegarde restaurée.
- **Chrome Android 13 sur émulateur : 4/4 tests réussis**, incluant portes, brouillard, sauvegarde et mode hors ligne.
- **APK : compilation et installation validées** dans le workflow de la branche.
- **30 plans profonds échantillonnés : 30 plans distincts**, avec 8 à 12 salles ; routes calculées sans ennemi ni piège obligatoire de **48 à 57 déplacements** selon la graine. Cette mesure porte sur les géométries théoriques, **pas** sur le temps de jeu, les difficultés humaines, l'IA rencontrée ou le plaisir.
- **Anomalie reproductible découverte et corrigée** : chevauchement de la carte par le dock tactile sur des écrans Android bas ; le test de collision est maintenant vert en 320×640, 360×780 et 393×704. Les cibles de mouvement gardent leur taille tactile.
- Les succès Chrome et APK correspondent à un environnement automatisé, **pas à une recette sur le smartphone personnel d'un joueur**.

**Conclusion technique : PASS. Conclusion produit : GO pour les tests humains, NO-GO pour déclarer Alpha 0.8 homologuée.**

## Critères Alpha 0.8 — décision GO / NO-GO

- **Fiabilité (P0)** : zéro bug empêchant l'achèvement d'une descente, un Rappel ou la reprise d'une partie sur le téléphone de recette ; sauvegarde conservée après fermeture/actualisation, et PWA qui fonctionne hors connexion.
- **Compréhension (P0/P1)** : chaque testeur sait expliquer la différence entre coffre sécurisé, objets transportés et perte au Rappel, sans indication du testeur-observateur.
- **Ergonomie (P1)** : aucune action indispensable durablement inaccessible sur la taille d'écran testée ; toutes les commandes touchables et écran de jeu immédiatement identifiable ; cible, soins, interactions et retour de menu vérifiés.
- **Intérêt (P1)** : **5 personnes × 2 descentes**, avec mesures qualitatives, incidents et intention de rejouer. Cible indicative : **au moins 4/5 désirent lancer une nouvelle descente** à la fin du test. Il faut publier la valeur réellement observée, y compris un échec.
- **Boucle (P1)** : au moins une extraction et un Rappel observés sur l'échantillon complet ; comprendre que l'échec reste possible sans verrouillage arbitraire. Ne pas imposer le combat comme passage obligé si l'extraction furtive est un choix valide.

La réussite des tests automatisés et du workflow GitHub n'efface aucun « non testé » de cette grille.

## Méthode de recette sur Android physique

1. Ouvrir [ROGOV Web](https://mathiks.github.io/Rogov-Android/) dans Chrome Android, noter modèle, Android, Chrome, taille logique de l'écran et si l'application est installée en PWA.
2. Depuis le titre : nouvelle partie, sélectionner ou non une arme, préparer une descente ; observer la compréhension des objets mis en danger.
3. Entrer dans Nhal, se déplacer dans quatre directions, attendre, toucher une tuile, faire apparaître « À portée », cibler un ennemi et vérifier l'accès aux cinq commandes tactiques sans action involontaire.
4. Ouvrir le sac et le rapport ; vérifier les indications de danger, les informations non révélées, l'absence d'actions gratuites abusives ou d'options coupées par le dock inférieur.
5. Terminer une descente ou déclencher un Rappel, vérifier l'état du coffre ; forger des bandages si une relique a été extraite ; relancer une descente profonde.
6. Fermer puis rouvrir l'application, vérifier la sauvegarde en cours. Tester une recharge en mode hors ligne une fois le contenu mis en cache ; noter les problèmes de connexion comme tels.
7. Faire la seconde descente sans intervention de l'observateur, puis remplir le questionnaire [QA-092](QA092_PLAYTEST_PROTOCOL.md).

## Registre de résultats et décision

| Contrôle | Résultat actuel | Niveau de preuve |
|---|---|---|
| Web + déploiement Pages sur la version de référence | **PASS** — workflow terminé avec succès | CI GitHub précédente |
| APK Android sur la version de référence | **PASS** — workflow terminé avec succès | CI GitHub précédente |
| Tests Node de parcours et 30 graines ajoutés par QA-092 | **PASS : 248 / 248 tests Node**, dont cinq tests QA-092 | CI PR #23, premier passage |
| Tests Chromium tactiles ajoutés par QA-092 | **PASS : 34 / 34 scénarios Chromium tactile**, dont 2 QA-092 et la couverture 320/360/393 px | CI PR #23, premier passage |
| Chrome Android 13 de la branche QA-092 | **PASS : 4 / 4 scénarios Chrome Android 13**, après une première relance liée à l'écran de bienvenue Chrome | CI PR #23, infra Android |
| Smartphone physique et PWA hors ligne | **NON TESTÉ sur appareil physique** | Recette humaine |
| 5 testeurs × 2 descentes / 4 sur 5 prêts à rejouer | **AUCUN résultat recueilli** | Playtests |
| Homologation Alpha 0.8 | **NO-GO provisoire** | Appareil physique et retours 5 testeurs manquants |

## Recommandation après cet audit

1. Corriger en priorité toute régression P0 révélée par la CI ou la recette réelle.
2. Observer les deux descentes de joueurs avant de décider d'un nouveau système.
3. Si les éléments sont compréhensibles mais la préparation est laborieuse : lancer **UI-092B + UI-092C** comme réponse ciblée.
4. Si l'interface est claire mais les choix ne sont pas intéressants : prioriser coûts d'équipement, montée du risque, récompenses et comportement ennemi.
5. Reprendre la diversification architecturale et les nouvelles classes **après** validation du noyau.

**Aucune note sur 10 n'est attribuée à la place des joueurs.** Ce document constitue une base de décision, non une certification.
