# ROGOV — GDD : Exploration profonde de Nhal
## Salles procédurales, réseaux, tiles, direction artistique et exploration

**Référence : DOC-079 / DOC-090 — GDD exploration v0.9 (18 novembre 2026)**  
**Statut actualisé le 18 novembre 2026 : DEV-080 à DEV-089C intégrés dans `main` ; DEV-089D reste à développer.**  
**Plateforme prioritaire : PWA hors ligne, Android portrait, compatible clavier et mode ASCII.**

### 0. Fondations et provenance

**Mise à jour v0.9.** Le texte des sections 1 à 8 conserve le cahier des charges original de la v0.8 et certaines formulations d'avant livraison. Les systèmes de salles, portes, brouillard, secrets, pièges, lieux spéciaux et rapport d'expédition ont depuis été intégrés (DEV-080 à DEV-088). Les sections 11 à 15 formalisent les nouveaux objectifs DEV-089 et font foi lorsqu'une proposition ancienne diffère de l'état actuel.

Cette extension développe la phase d'exploration déjà envisagée dans le projet **ROGUE / ROGOV** : **Observer** l'architecture, les portes, les ennemis, les objets et les dangers, **se déplacer** pour dévoiler un espace, puis **interagir** avec une porte, un coffre, un mécanisme, une inscription ou un passage particulier. Pièges et passages particuliers faisaient partie des intentions générales, **pas d'un contrat chiffré déjà implémenté**.

**Contexte historique vérifié lors de la rédaction initiale v0.8 (avant DEV-080) :**
- Le prototype **VAR-077** fait varier murs, failles, arche, ennemis et butin après la première descente. Sa petite grille (15×9) ne comprend pas encore de véritables réseaux de salles/portes, de brouillard de guerre ou de passages secrets.
- Les failles visibles `^` sont un **danger existant** qui déclenche le Rappel, à distinguer des **pièges nouveaux** proposés ci-dessous.
- Le combat reste **sur la carte** (CONTACT / PROCHE / LOIN), avec intentions ennemies, Endurance, Rappel/extraction, et la forge de Veyr.
- Les sauvegardes `rogov-web-v1` et les descentes déjà commencées ne doivent pas être altérées ni régénérées.

**Principe directeur :** l'exploration doit produire « Je connais une issue, mais ai-je assez d'information et de ressources pour explorer encore ? » plutôt que « Le générateur a décidé que je mourrais ». Une difficulté fondée sur le renseignement, l'éloignement, les rencontres et les ressources ; jamais sur une sortie cachée imposée ou une fermeture surprise.

---

## 1. Objectifs de jeu (et exclusions)

1. **Découvrir** : voir progressivement une carte inconnue, retenir des repères et trouver des embranchements.
2. **Choisir le risque** : aller vers une salle annexe, tenter une cache ou préserver son sac.
3. **Préparer le retour** : identifier à l'avance le chemin vers l'Arche ; un secret peut améliorer ce chemin, pas le rendre possible à lui seul.
4. **Observer avant d'agir** : indices environnementaux, pièges annoncés, méthodes de contournement et de désamorçage.
5. **Renforcer Nhal** : ruines, architecture impossible, traces humaines et anomalies discrètes ; magie rare, coûteuse, atmosphère originale.

**Hors périmètre de la première livraison** : niveaux verticaux complexes, destruction dynamique des seules voies de retour, portes à clés obligatoires, génération infinie de donjons, onze kits de classes, détection magique gratuite, pièges à mort instantanée non signalés.

## 2. Géométrie procédurale : des salles et des connexions

### 2.1. Gabarit visé (chiffres à tester)

- Une **carte logique** cible d'environ **40×30 cases** contre 15×9 aujourd'hui. Cela reste un objectif de prototype, non une limite définitive.
- **8 à 12 salles** de formes/tailles variées, reliées par des couloirs d'une ou deux cases et par des portes lisibles.
- Une salle de **départ sûre**, une zone d'**extraction identifiée** ou découvrable par une route non secrète, plusieurs salles annexes, une ou deux boucles de circulation.
- Les salles sont d'abord distribuées sans superposition ; ensuite seulement le générateur connecte les portes et couloirs. Préserver un espace de séparation visible et une traversabilité tile-by-tile.
- Les embranchements peuvent former des **impasses d'exploration** (ressource, information, secret), mais aucune impasse obligatoire ne doit contenir le seul chemin de sortie.
- Garder le **même seed de descente** et une génération déterministe ; carte enregistrée dès l'entrée, jamais modifiée silencieusement après chargement.

### 2.2. Graphe de circulation

La carte comporte un **graphe de salles** : nœuds = salles, arêtes = portes/couloirs. Générer un graphe connecté minimal, puis ajouter des **liaisons alternatives** pour créer des boucles. Les corridors peuvent être sinueux, mais jamais impossibles à lire.

**Validation avant acceptation du plan :**
- Point de départ et Arche reliés sans passage secret, sans porte verrouillée obligatoire, sans traverser une faille mortelle.
- **Au moins deux trajets de retour indépendants** entre les zones principales de butin et l'extraction, selon l'invariant déjà imposé par VAR-077. Les portes secrètes ne comptent **jamais** dans ce minimum.
- Tout passage principal empruntable au départ reste empruntable au retour ; une porte, un mécanisme ou un piège ne peut pas supprimer le dernier chemin.
- Placement des ennemis après validation des connexions ; aucune apparition sur le point d'entrée ou sur l'unique goulot d'étranglement.
- Rejeter/recalculer une carte si le graphe, le placement de pièges ou la visibilité du retour violent ces règles. Prévoir une **configuration sûre de secours** si la génération atteint la limite d'essais.

### 2.3. Rôles de salle (propositions de bibliothèque)

| Type | Fonction | Risque / avantage |
|---|---|---|
| Vestibule | Entrée, lecture du secteur | Protection initiale, premières directions |
| Traversée | Jonction de plusieurs couloirs | Choix et risque de rencontre |
| Ruines occupées | Combat évitable ou contournable | Butin légèrement supérieur |
| Atelier abandonné | Traces, matériaux, soin | Valeur pour le refuge |
| Cache scellée | Récompense optionnelle | Indice de mécanisme / piège local |
| Chambre de l'écho | Événement cosmique, lore | Information, effet mental éventuel |
| Passage de service | Détour et connexion | Raccourci non secret |
| Arche d'extraction | Fin de run volontaire | Retour à Veyr, sac sécurisé |

**Répartition non garantie** : varier les rôles et la valeur des salles sans imposer une distribution fixe qui serait mémorisable en trois runs.

## 3. Brouillard de guerre et caméra d'exploration

### 3.1. Trois états distincts

- **Inexploré** : obscurité totale, aucune entité/tile divulgué.
- **Découvert mais hors vue** : architecture mémorisée et atténuée, **aucun ennemi mobile montré comme présent** ; les informations anciennes peuvent devenir obsolètes.
- **Visible** : cases actuellement éclairées/observables, ennemis et événements actifs affichés normalement.

**La ligne de vue (LOS)** est bloquée par les murs et les portes opaques. Ne pas révéler l'intérieur d'une salle à travers une porte fermée. Inspecter une case inexplorée ne doit pas contourner le brouillard (ni en mode ASCII, ni par accessibilité, ni dans le panneau cible).

### 3.2. Mobile et ASCII

- Caméra centrée sur le héros, montrant une **fenêtre de la grande carte** adaptée au portrait Android (prototype à comparer en **11×11** ou **13×9** cases visibles, sans réduire les commandes).
- Défilement fluide ou re-centrage discret, sans déplacer le personnage par un glissement de caméra involontaire.
- Mini-carte/plan repliable : zones découvertes et route connue vers l'Arche, sans exposer le contenu secret non trouvé.
- Le mode **ASCII représente exactement les mêmes connaissances** que le mode graphique : jamais une carte complète donnant gratuitement la solution.
- Indicateurs textuels, et pas seulement couleurs, pour danger, porte fermée, passage suspect et découverte.

### 3.3. Informations persistantes

**Dans la descente** : cases découvertes, visibilité recalculée, indices repérés, pièges connus/désamorcés, passages révélés et porte ouverte/fermée. Tout est sérialisé avec la carte et la graine. **Après Rappel**, les connaissances générales sur les catégories de pièges ou les phénomènes peuvent persister à terme, mais **pas la position exploitable d'un secret dans une nouvelle carte générée**.

## 4. Boucle d'exploration et actions

| Action | Effet | Coût cible / règle |
|---|---|---|
| **Observer** (lecture libre) | Inspecte une case **déjà visible**, décrit traces, architecture et objets | Aucun tour : lecture d'information, comme l'inspection existante |
| **Fouiller attentivement** | Cherche des indices dans une zone limitée, peut déceler un secret/piège suspect | **1 tour proposé** ; l'IA réagit ; résultat déterministe pour un état et une graine |
| **Ouvrir / Fermer** | Manipule une porte ordinaire ou un mécanisme connu | Coût à définir ; jamais une porte obligatoire verrouillée sans contre-jeu |
| **Examiner une anomalie** | Affine un indice local / révèle une interaction | Coût selon action, explicitement annoncé |
| **Désamorcer** | Tente de neutraliser un piège identifié avec compétence/outils | **1 tour proposé**, jet influencé par caractéristiques et équipement |
| **Traverser le passage** | Accède à une route révélée | Mouvement normal, pas de téléportation magique implicite |

**Important :** une sélection de case ne peut pas consommer un tour ou déclencher un piège ; le joueur confirme une interaction coûteuse. La fouille intensive ne doit pas être spammable pour obtenir un résultat différent en rechargeant la sauvegarde.

## 5. Passages secrets : curiosité, raccourcis et conséquences

### 5.1. Contrat

Un passage secret est une **connexion optionnelle** non évidente à l'origine. Il n'est **jamais nécessaire** pour accéder à l'Arche, à la progression minimale ou à une sortie sûre.

**Indice perceptible avant découverte** : mur fissuré, courant d'air, grésillement atypique, traces de passage, symbole répétitif, écho creux, poussière déplacée. Dans une première version, tout passage secret doit au moins avoir **un indice local accessible sur une case visible** ; éviter la règle « taper tous les murs ».

### 5.2. Trois familles à implémenter progressivement

1. **Cache secrète** : petite salle avec consommable, Fragment de cendre ou récit environnemental.
2. **Raccourci de retour** : ouvre un lien entre deux couloirs, économisant plusieurs tours et éventuellement une rencontre. Ne compte pas dans les deux itinéraires garantis par le générateur.
3. **Salle de lore** : inscription, phénomène ou découverte pouvant enrichir les connaissances persistantes sans récompense économique obligatoire.

### 5.3. Détection et révélation

- **Observation passive** : indice signalé quand le héros est assez proche et peut le voir ; **PER** peut en améliorer la précision, sans rendre la découverte totalement impossible à faible score.
- **Fouille active** : action ciblée pouvant révéler la porte ou son mécanisme, avec coût de tour et résultat reproductible.
- **Interagir** : si découvert, passage utilisable sans ambiguïté ; l'ouverture est visible sur la carte et dans le journal.
- **Synergies futures de classes** : Éclaireur (repérage), Filou (mécanismes), Érudit (inscriptions), Récupérateur (caches), Artisan (réparation), mais aucune de ces classes n'est exigée pour terminer une descente.

Une révélation devient une **information de la descente sauvegardée**. Le passage peut être utilisé dans les deux sens, sauf exception future explicitement annoncée et validée.

## 6. Pièges : annoncer, comprendre, contourner

### 6.1. Invariants anti-frustration

- **Aucun piège inévitable** sur une route de sortie garantie. Il existe un contournement praticable et raisonnablement détectable.
- **Aucun piège caché à mort instantanée** sans indice et sans possibilité de réaction ; le premier piège rencontré sert d'apprentissage, pas de sanction.
- **Les indices précèdent le danger** : marques de dalle, ossements, sol noirci, câbles, poussière déplacée, symboles, vibration ou sons anormaux.
- **Pas de verrouillage aléatoire de l'Arche, de fermeture du dernier couloir, ni de génération de pièges sous le héros.**
- Un joueur blessé peut mourir s'il **choisit consciemment de braver** un danger reconnu ; éviter les dommages arbitraires impossibles à anticiper.
- Chaque piège a une condition de déclenchement documentée, une chance/solution de désamorçage, un état persistant et un message de journal clair.
- **L'IA ennemie ne peut pas pousser systématiquement le héros dans un piège invisible** sans avertissement : conception et tests spécifiques requis avant une telle interaction.

### 6.2. Bibliothèque initiale (propositions)

| Famille | Indice | Déclenchement | Effet | Contre-jeu |
|---|---|---|---|---|
| **Dalle instable** | Fissures, pierre déplacée | Entrée volontaire sur la case | Dégâts physiques limités / fatigue | Changer de chemin, examiner puis neutraliser |
| **Rune de pression** | Gravure, poussière anormale | Passage / interaction | Onde occulte, Endurance ou Stabilité réduite | Lire le symbole, contourner, désamorcer avec outil |
| **Fil d'alarme** | Fil tendu, traces de frottement | Traversée sans précaution | Bruit / alerte d'un ennemi proche | Couper/détourner, accepter le risque |
| **Mécanisme de cache** | Serrure usée, impacts | Ouverture imprudente | Petite blessure ou corruption de ressource | Inspecter, désamorcer ou renoncer |

Les effets chiffrés restent **à calibrer** ; un piège ordinaire ne doit jamais tuer un héros à pleine vie en une seule résolution non anticipée. Le piège d'alarme est précieux : il augmente la tension **sans ajouter des dégâts gratuits**.

### 6.3. États et résolution

États envisagés : `hidden` (indice disponible), `suspected`, `revealed`, `disabled`, `triggered`. Le générateur crée l'emplacement, le type et l'indice **avant l'entrée** ; l'état évolue selon les actions du joueur et reste sauvegardé.

- **Observer** : révèle les indices visibles sans coûter de tour.
- **Fouiller attentivement** : recherche active, influencée par **PER** et parfois **INT**.
- **Désamorcer** : action spécifique influencée par **AGI / INT**, compétence/outillage, et Endurance si approprié. Réutiliser le résolveur de jets existant et la graine sauvegardée, plutôt qu'un RNG indépendant exploitable par rechargement.
- **Échec ordinaire** : laisse le piège actif, prend du temps, peut produire un bruit ou épuiser un outil. **Déclenchement dangereux** seulement si ce risque est annoncé avant confirmation.
- **Réussite** : neutralise durablement, avec récompense éventuelle limitée (matériau, XP de connaissance), sans farming.
- Un piège `triggered` ne se réarme pas silencieusement au prochain déplacement.

### 6.4. Relation avec les caractéristiques et la magie

Les six attributs existants gardent leurs rôles : **PER** pour les indices, **AGI/INT** pour le mécanisme, **CON** contre les blessures, **VOL** contre la pression mentale. Les outils peuvent augmenter les chances. Les sorts/compétences viendront **après** validation du moteur de base : un pouvoir de révélation a un coût en Stabilité/ressource/risque et ne remplace pas systématiquement l'observation.

## 7. Générateur et sauvegardes : contrat technique cible

### 7.1. Pipeline proposé

1. Déterminer la graine de descente et choisir une famille architecturale.
2. Poser salles, portes et couloirs ; connecter le graphe puis ajouter quelques boucles.
3. Placer départ, Arche et routes publiques ; valider le retour **sans secret ni piège obligatoire**.
4. Répartir types de salles, butin et adversaires sans fermer les chemins de fuite.
5. Placer **passages secrets optionnels** (connexions / caches) : n'entrent pas dans les garanties de traversabilité.
6. Placer **pièges avec indices** dans des zones facultatives ou contournables ; recalculer le graphe en considérant les cases piégées comme impraticables.
7. Initialiser brouillard de guerre et visibilité locale ; enregistrer **la carte finale entière et ses états** avant le premier tour.
8. Tester automatiquement. Rejeter les graines invalides ou utiliser un plan de secours sûr.

### 7.2. Données suggérées (non implémentées)

- `run.map` : topologie/tiles ; `run.rooms` : géométrie, type et identité des salles.
- `run.doors` : case, ouvert/fermé, verrou standard/mécanisme facultatif.
- `run.secrets` : passage, indice, découverte, porte révélée, récompense éventuelle.
- `run.traps` : type, case/zone, indice, statut, effet, graine/jet pour interaction.
- `run.exploration` : cases déjà découvertes, éventuels indices mémorisés ; visibilité actuelle **recalculable** selon héros et LOS.
- `run.layoutId`, `run.rngState`, `run.loot` et `run.enemies` : compatibilité avec le moteur existant.

**Migration** : si `rooms/doors/secrets/traps/exploration` sont absents, charger l'ancienne carte sans ces systèmes. Ne jamais générer rétroactivement un piège ou une porte cachée dans une descente v0.7f commencée. Préserver le coffre, le héros, les objets, l'XP et l'historique. Conserver une seule source de vérité pour l'équipement et les collisions.

## 8. Critères d'acceptation et tests

### 8.1. Tests automatisés de plan

- Au moins **200 graines** générées, dont les premières/milieu/valeurs élevées, sans crash ni plan inaccessible ; ajouter une campagne plus large en CI une fois les performances connues.
- Salle de départ atteignable, Arche présente, chemin d'extraction non secret, **deux retours garantis** depuis les objectifs à butin, même en bloquant les cases piégées.
- Un piège ne peut pas occuper la seule sortie, être créé sous le héros, ou devenir mortel sans indice.
- Un passage secret ne doit jamais être la condition unique de sortie ; sa découverte ne détruit pas les routes normales.
- Aucune fuite du brouillard par vue graphique, ASCII, inspection, ciblage, journal et données d'accessibilité.
- Une même graine et une même sauvegarde donnent **exactement les mêmes murs, indices, états et jets**.
- Rappel : sac perdu, héros/XP/coffre préservés ; extraction : sac sécurisé ; aucune duplication de butin ou rechargement exploitant les pièges.

### 8.2. Test de terrain Android

- Parcourir l'entrée, découvrir deux salles, revenir sur une zone mémorisée : les ennemis qui se sont déplacés ne doivent pas rester affichés comme des positions actuelles.
- Détecter un indice sans action coûteuse, confirmer une fouille active, puis décider de contourner ou désamorcer.
- Découvrir une cache secrète, l'ouvrir, repartir **par une route normale**.
- Vérifier une navigation tactile en portrait sans défilement horizontal forcé, carte/ASCII cohérents, journal lisible et caméra centrée.
- Fermer/recharger au milieu d'un piège détecté ou d'un passage ouvert : même état après reprise ; essayer le mode hors ligne.

### 8.3. Test joueur / objectif Alpha 8/10

Avec **cinq testeurs, deux descentes chacun** : noter s'ils savent où se trouve une issue connue, s'ils comprennent un indice de piège, s'ils découvrent au moins une curiosité facultative sans aide, si les détours paraissent utiles, et si **4/5 souhaitent faire une troisième descente**. Les nouvelles fonctionnalités ne valent pas à elles seules une note supérieure.

## 9. Priorités de production (WIP = 1, statut actualisé v0.9)

| Code | Lot | Résultat attendu |
|---|---|---|
| **DOC-079** | Cahier des charges v0.8 et contraintes de sécurité | **Rédigé ; historique conservé** |
| **DEV-080** | Salles, portes ordinaires et couloirs connectés + cadrage caméra mobile | **Livré** |
| **DEV-081** | Brouillard de guerre, vue/LOS, mémoire des cases, minimap, mode ASCII | **Livré** |
| **DEV-082** | Secrets optionnels, indices, révélation et sauvegarde | **Livré** |
| **DEV-083 / DEV-086** | Pièges (dalle + alarme) et placement stratégique | **Livré** |
| **QA-084** | Tests multi-graines, migration, boucles de fuite, ergonomie mobile | **Tests automatisés livrés ; retours testeurs à poursuivre** |
| **DEV-085** | Placement architectural des portes, seuils uniques | **Livré** |
| **DEV-087** | Trois lieux spéciaux à choix exclusif | **Livré** |
| **DEV-088** | Rapport d'expédition, risque et route connue | **Livré** |
| **DEV-089A** | Diversification des salles et obstacles intérieurs | **Livré, PR #10** |
| **DEV-089B** | Refonte artistique des tiles et sprites essentiels | **Livré, PR #11** |
| **DEV-089C** | Graphe de circulation variable et routes secondaires | **Livré, PR #12** |
| **DEV-089D** | Familles architecturales et variantes de matériaux | **À développer après C** |

**Garde-fou production v0.9 :** DEV-080 à DEV-088 sont fusionnés et déployés ; conserver un seul lot DEV-089 actif à la fois, les tests de compatibilité et une recette Android physique avant toute fusion de nouvel art ou de nouvelle géométrie.

---

## 10. Décision finale de design

> **Nhal doit cacher des possibilités, jamais dissimuler une obligation.**  
> Le joueur peut renoncer à une salle, éviter un piège, ignorer une porte secrète ou rentrer par une autre voie. Un bon aventurier gagne par observation et préparation, non parce qu'il connaît à l'avance les pièges du générateur.

**Statut révisé au 18 novembre 2026 :** DEV-080 à DEV-089C sont présents dans le moteur Web sur `main`, après fusion des [PR #10](https://github.com/MAthiks/Rogov-Android/pull/10), [PR #11](https://github.com/MAthiks/Rogov-Android/pull/11) et [PR #12](https://github.com/MAthiks/Rogov-Android/pull/12). DEV-089C introduit des réseaux de **8 à 12 salles** avec boucles et trajets alternatifs ; les impasses facultatives enrichies ne sont **pas encore livrées**. DEV-089D reste une spécification non implémentée. Vérifications CI réussies ; publication publique à confirmer via GitHub Pages.


---

## 11. DEV-089 — Objectif : diversité architecturale et identité de Nhal

**Décision de design :** conserver la topologie et les dangers intelligibles tout en évitant qu'un secteur ressemble à la même grille habillée autrement. La variété doit influencer les **choix d'itinéraires, l'observation et la mise en scène**, jamais imposer une difficulté factice.

### 11.1. Point de départ du moteur (18 novembre 2026)

- Carte profonde actuellement générée sur **44 × 32 cases** ; **12 salles** sur une trame fixe **4 × 3**, chambres d'environ **7–9 cases** de largeur/hauteur et **6 portes** architecturalement encadrées, dont deux accès lisibles au vestibule.
- Les parois, sols, portes et entités utilisent déjà des **sprites SVG originaux de 24 × 24 px** dans `docs/tiles.js`, avec un rendu ASCII équivalent et un brouillard de guerre.
- Les salles spéciales, les coffres, les ennemis et les pièges possèdent des contraintes de placement qui dépendent de cette architecture. **DEV-089 doit les adapter et les retester**, pas les déplacer aveuglément.
- La première descente reste un tutoriel ; seules les **nouvelles descentes profondes** reçoivent les futurs plans. Une partie sauvegardée est toujours restaurée telle quelle.

### 11.2. Bibliothèque des nouvelles salles (DEV-089A)

| Forme / aménagement | Rôle d'exploration | Contrat de jouabilité |
|---|---|---|
| **Salle rectangulaire usée** | Repère clair, respiration et combat lisible | Forme de référence, toujours possible |
| **Salle en L** | Cache une aile depuis le seuil, stimule la reconnaissance | Les deux ailes sont reliées et les lignes de vue sont calculées case par case |
| **Salle à piliers** | Favorise les esquives de trajectoire et le placement | Piliers solides visibles ; aucune sortie masquée comme seul passage |
| **Salle effondrée** | Débris, détours et lignes de vue fragmentées | Les gravats réellement bloquants ont une silhouette distincte ; alternatives sûres |
| **Grande galerie** | Allonge la perspective, multiplie les alcôves et les niches | Pas de tunnel obligatoire ponctué de pièges inévitables |
| **Petite chambre annexe** | Récompense facultative, indice ou lore | Ne contient pas la seule extraction ni un objectif obligatoire |

**Méthode :** livrer les nouvelles formes sur une carte encore connectée au graphe actuel, avant de modifier en profondeur les liaisons. Chaque pièce porte une géométrie explicite : emprise, masque des cases réellement praticables, périmètre, seuils autorisés, identité et rôle. Les collisions, les portes, la portée ennemie, l'éclairage et la visibilité sont déduits de cette géométrie, pas d'un décor peint.

### 11.3. Réseau procédural et embranchements (DEV-089C)

Quatre familles de **topologie**, distinctes des styles visuels :

1. **Réseau de ruines** : nombreux croisements et boucles, retour par plusieurs corridors.
2. **Galeries abandonnées** : corridors allongés, bifurcations et alcôves facultatives.
3. **Forteresse enfouie** : grands volumes, salles de garde, portes cadrées et accès secondaires.
4. **Complexe fracturé** : salles asymétriques, déviations et petits contournements visibles.

La prochaine génération doit varier **le nombre et l'agencement des salles** (cible expérimentale : **8–12 salles**), leurs positions relatives, les longueurs de couloir, les boucles, la position de l'Arche et la profondeur des objectifs. Une trame 4 × 3 permanente ne suffit plus. Les impasses constituent des **choix de butin ou de récit**, pas des obligations.

Exemple de carrefour : voie longue à faible exposition, raccourci signalé contenant un risque, impasse de fouille facultative. Ces options ne garantissent pas une récompense identique mais leur existence doit rester compréhensible. **Pas de faux labyrinthe**, pas de chute de difficulté ou d'ennemis déclenchée artificiellement par un compteur de tours.

### 11.4. Invariants de génération

- Départ, Arche, coffres et trois sites DEV-087 restent placés sur des cases réellement praticables et accessibles.
- **Deux itinéraires de retour indépendants** restent disponibles à partir des objectifs principaux, sans secret, combat imposé ni piège à déclenchement inévitable. Les obstacles intérieurs et portes nouvellement créés sont inclus dans ce calcul.
- Les pièges DEV-086 restent contextualisés (**fil dans un couloir réel ; dalle proche d'un coffre**), avec indice et contournement ; leurs positions ne bloquent jamais les deux voies.
- Le générateur valide la topologie et les volumes **avant** les ennemis, coffres, secrets, pièges et événements. En cas de rejet : nouvelle tentative déterministe plafonnée ou plan sûr de repli.
- Graine de descente déterministe, état sauvegardé complet, chargement d'anciennes parties sans régénérer le donjon, et aucun renseignement caché révélé dans la carte, le journal, l'ASCII ou les données d'accessibilité.

## 12. DEV-089B — Direction artistique et refonte des tiles

### 12.1. Intention et style retenus

**Direction : « Ruines souterraines de pierre froide — dark fantasy sobre, low magic et horreur cosmique archéologique ».**

Choix technique : **pixel art stylisé, lisible et légèrement texturé (« pixel art A+ »)**. La priorité est une silhouette claire sur Android, pas le photoréalisme, une texture peinte trop chargée ou un changement d'échelle. Réutiliser les sprites SVG originaux existants de **24 × 24 px**, avec grille et rendu pixel net ; un éventuel atlas bitmap sera évalué séparément après les tests de lisibilité et de performances.

Règles de matière et composition :

- **Sols :** contraste bas, dalles irrégulières, joints peu marqués, craquelures fines et poussière.
- **Murs :** masse plus dense et contraste de bordure plus fort que les sols ; angle, couronnement et seuil identifiables.
- **Portes :** encadrement stable et ouverture/fermeture immédiatement reconnaissables, même sans couleur.
- **Arche :** silhouette singulière et turquoise retenu ; repère de sécurité distinct du décor.
- **Failles :** fracture rouge et géométrie cassée ; aucun motif décoratif ne doit ressembler à une faille mortelle.
- **Salles spéciales et coffres :** signe identifiable mais discret, avec état « déjà exploité » distinct.
- **Personnages / monstres :** silhouettes lisibles au premier regard, bordures et points lumineux limités, cohérents avec la [bible visuelle des créatures v0.6](VISUAL_BIBLE_V0.6.md).

**Contrat visuel :** aucune décoration ne ressemble à une porte ouvrable, un coffre ramassable, un piège activé ou un obstacle solide si elle n'en possède pas la fonction. Les erreurs d'interprétation ne sont pas une forme souhaitable de difficulté.

### 12.2. Palette système — continuité avec la bible v0.6

| Fonction | Couleur / référence | Usage |
|---|---|---|
| Profondeur, ombres | Bleu-noir **#121F26** | Arrière-plan / zones sombres |
| Sol ordinaire | Ardoise **#202D33** | Faible contraste, lecture des unités |
| Pierre et murs | Gris bleuté **#4B5C63** | Contours structurels |
| Joueur et sécurité | Ivoire verdâtre **#EBF0D0** | Silhouette du héros |
| Extraction | Turquoise **#AEE5D3** | Arche, et seulement fonctions sécurisantes |
| Altération surnaturelle | Spectral froid **#9DD7C4** | Anomalies et rareté magique |
| Danger mortel | Rouge éteint **#E38D89** | Faille, signal d'alerte non ambigu |
| Matière organique ennemie | Cuivre **#E0A078** | Charognard / différenciation de menace |
| Gardien | Pierre osseuse **#CCD0BB** | Masse hostile de pierre |
| Décor additionnel proposé | Brun pierre **#66564A** | Poussière, terre, jamais l'unique signal de danger |
| Décor additionnel proposé | Vert mousse **#40574B** | Humidité, vieillissement, pas de signification de sécurité |

Les **neuf premières couleurs** sont déjà documentées dans la bible v0.6 ; les deux dernières sont des **propositions**, non des couleurs déjà intégrées. La couleur ne suffit jamais à expliquer un objet, un danger ou une action.

### 12.3. Premier pack prioritaire (tileset fonctionnel)

| Groupe | Tiles / états indispensables |
|---|---|
| Sols | sol pierre froide, dalle fendue, joints usés, sol poussiéreux, sol humide, sol noirci |
| Murs | mur plein, arêtes horizontale/verticale, angles internes/externes, terminaison, mur fissuré |
| Seuils | porte ouverte, porte fermée, encadrement, passage secret découvert |
| Interactions | coffre fermé/ouvert, site atelier, Chambre de l'Écho, cache oubliée, site exploité |
| Danger | faille, indice de piège, piège identifié, piège désamorcé |
| Repères | Arche d'extraction, entrée, héros |
| Hostiles | Charognard, Gardien déchu, Larve de faille |

**Livraison en deux paliers.** Palier 1 : sol, mur et jonctions, portes, coffre, Arche, faille, héros, trois ennemis et marqueurs interactifs existants. Palier 2 : variations cosmétiques de matière, angles avancés et habillages des secteurs. Un pack « joli » mais dépourvu des états de porte ou de piège n'est pas acceptable.

### 12.4. Architecture de rendu et performance

- Garder **la carte logique indépendante des textures** : une dalle fissurée *cosmétique* reste traversable, un pilier *bloquant* possède une vraie collision; la variante visuelle ne modifie pas arbitrairement les règles.
- Pour les murs et leurs angles, calculer un **autotiling par voisinage** sur les cases connues ; le type de jonction dépend des voisins, pas d'un tirage visuel non reproductible.
- Variantes cosmétiques stables par **seed + coordonnées + secteur**, indépendantes du RNG de combat. Ne pas créer une nouvelle texture au hasard lors d'un rechargement.
- Séparer le **fond de terrain**, les **détails non bloquants** et les **entités/interactions**. Une seule silhouette interactive prioritaire par case, ou une composition explicitement validée.
- Préserver le mode **ASCII** comme rendu de référence fonctionnelle, avec les mêmes informations découvertes, sans spoiler via les noms des sprites, attributs du DOM ou aria-labels.
- SVG originaux ou ressources dont les droits sont maîtrisés, petit ensemble mutualisé, **PWA hors ligne** et cache versionné. Éviter les images externes chargées à la volée.
- **Lisibilité portrait** : tester la taille réelle sur Android, la distinction des silhouettes au toucher/zoom normal, les contrastes, les anomalies de scrolling et la réactivité. Aucun décor ne doit recouvrir les commandes ou la prévisualisation tactique.

### 12.5. Familles de secteurs à décliner (DEV-089D)

Une fois les tiles essentiels validés, décliner leurs **matériaux et ornements** par secteur, sans multiplier les conventions de gameplay :

| Secteur | Variations visuelles | Signature |
|---|---|---|
| **Ruines de pierre** | Moellons anciens, dalles fêlées, poussière | Base de Nhal, froid et abandon |
| **Galeries de service** | Maçonnerie étroite, ferrures, niches | Traces d'occupation humaine |
| **Fortifications enfouies** | Contreforts, seuils massifs, pierres taillées | Ordre ancien, défenses |
| **Zones fracturées** | Fissures, géométrie irrégulière, éclats spectraux discrets | Étrangeté rare, sans surcharge magique |

Les familles ne transforment pas automatiquement un sol esthétique en piège ni une texture humide en ralentissement. Tout nouvel effet de gameplay exige un contrat et un avertissement explicites.

## 13. Production : séquence DEV-089 et dépendances

| Ordre | Chantier | Livrable vérifiable |
|---|---|---|
| **1 — DEV-089A** | Formes de salles | Salles en L, piliers, effondrements/alcôves dans un graphe encore contrôlé |
| **2 — DEV-089B** | Direction artistique et tiles principaux | Palette, SVG 24 px, autotiling murs/sols, états interactifs, tests de visibilité |
| **3 — DEV-089C** | Réseau vraiment variable | Graphe non figé, boucles, impasses facultatives, options de retour et profondeurs diverses |
| **4 — DEV-089D** | Styles de secteurs | Quatre familles architecturales dérivées des mêmes règles lisibles |

**WIP = 1** : DEV-089A, DEV-089B et DEV-089C sont fusionnés à la demande de l'utilisateur après validation automatisée et confirmation du test Android pour DEV-089A/B ; DEV-089C n'a pas encore été confirmé sur téléphone physique. Pour DEV-089D, garder un seul chantier actif à la fois, une PR isolée et une recette Android recommandée avant fusion. Le travail visuel n'est **pas** un prérequis de l'architecture, et réciproquement : les deux contrats doivent rester testables séparément.

## 14. Critères de validation DEV-089

### 14.1. Génération et comportement

- Générer **au moins 200 graines par famille de géométrie**, rejeter toute carte invalide et vérifier l'absence de crash, collision impossible, sortie inaccessible, site spécial illisible ou piège obligatoire.
- Vérifier les **deux voies de retour**, la possibilité d'éviter ennemis/pièges sur les itinéraires garantis, la reachabilité des coffres et les choix des trois sites.
- Un même seed reproduit la même géométrie et les mêmes variantes visuelles. La sauvegarde/reprise conserve les mêmes états ; aucune migration forcée d'un donjon entamé.
- Les portes restent **sur un véritable mur avec encadrement** ; aucun seuil artificiellement placé au milieu d'une salle.

### 14.2. Visuel, accessibilité et mobile

- Comparer côte à côte **mode SVG et ASCII**, à connaissance identique. Les zones hors vue ne contiennent ni contenu secret dans le DOM, ni titre ou attribut d'accessibilité qui dévoile une entité.
- À 24 × 24 px et sur un téléphone Android en portrait, faire distinguer sans aide : mur/sol, porte ouverte/fermée, coffre ramassé/non ramassé, Arche/faille, piège suspect/piège actif, héros/ennemi et les trois événements DEV-087.
- Tester les quatre familles sur **écran étroit**, sans débordement horizontal, scintillement, baisse de fluidité perceptible ni augmentation inutile du poids PWA.
- Tester l'ouverture hors ligne après chargement, le rafraîchissement du service worker, la persistance des réglages, du journal et de l'état de combat.
- Recette joueur : une carte doit être mémorable par **ses itinéraires et choix**, non seulement par ses textures ; l'amélioration est à apprécier lors de plusieurs descentes.

## 15. Décision de design révisée

> **Nhal doit cacher des possibilités, jamais dissimuler une obligation.**
>
> Ses pierres racontent l'ancienneté et l'étrangeté du lieu ; ses couloirs offrent des décisions réelles. La beauté du décor ne doit jamais faire perdre la lecture d'un danger, d'une porte, d'une issue ni de ce qu'on peut sauver en rentrant à Veyr.

**Historique :** [GDD exploration v0.8](GDD_EXPLORATION_NHAL_V0.8.md) conservé inchangé. **Document de référence courant : v0.9.**
