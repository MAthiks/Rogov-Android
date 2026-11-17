# ROGOV — GDD : Exploration profonde de Nhal
## Salles procédurales, couloirs, cartographie, passages secrets et pièges

**Référence : DOC-079 — GDD exploration v0.8 (18 novembre 2026)**  
**Statut : conception / proposition d'implémentation, NON jouable en v0.7f.**  
**Plateforme prioritaire : PWA hors ligne, Android portrait, compatible clavier et mode ASCII.**

### 0. Fondations et provenance

Cette extension développe la phase d'exploration déjà envisagée dans le projet **ROGUE / ROGOV** : **Observer** l'architecture, les portes, les ennemis, les objets et les dangers, **se déplacer** pour dévoiler un espace, puis **interagir** avec une porte, un coffre, un mécanisme, une inscription ou un passage particulier. Pièges et passages particuliers faisaient partie des intentions générales, **pas d'un contrat chiffré déjà implémenté**.

**Existant vérifié dans le dépôt :**
- Le prototype **VAR-077** fait varier murs, failles, arche, ennemis et butin après la première descente. Sa petite grille (15×9) ne comprend pas encore de véritables réseaux de salles/portes, de brouillard de guerre ou de passages secrets.
- Les failles visibles \`^\` sont un **danger existant** qui déclenche le Rappel, à distinguer des **pièges nouveaux** proposés ci-dessous.
- Le combat reste **sur la carte** (CONTACT / PROCHE / LOIN), avec intentions ennemies, Endurance, Rappel/extraction, et la forge de Veyr.
- Les sauvegardes \`rogov-web-v1\` et les descentes déjà commencées ne doivent pas être altérées ni régénérées.

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

États envisagés : \`hidden\` (indice disponible), \`suspected\`, \`revealed\`, \`disabled\`, \`triggered\`. Le générateur crée l'emplacement, le type et l'indice **avant l'entrée** ; l'état évolue selon les actions du joueur et reste sauvegardé.

- **Observer** : révèle les indices visibles sans coûter de tour.
- **Fouiller attentivement** : recherche active, influencée par **PER** et parfois **INT**.
- **Désamorcer** : action spécifique influencée par **AGI / INT**, compétence/outillage, et Endurance si approprié. Réutiliser le résolveur de jets existant et la graine sauvegardée, plutôt qu'un RNG indépendant exploitable par rechargement.
- **Échec ordinaire** : laisse le piège actif, prend du temps, peut produire un bruit ou épuiser un outil. **Déclenchement dangereux** seulement si ce risque est annoncé avant confirmation.
- **Réussite** : neutralise durablement, avec récompense éventuelle limitée (matériau, XP de connaissance), sans farming.
- Un piège \`triggered\` ne se réarme pas silencieusement au prochain déplacement.

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

- \`run.map\` : topologie/tiles ; \`run.rooms\` : géométrie, type et identité des salles.
- \`run.doors\` : case, ouvert/fermé, verrou standard/mécanisme facultatif.
- \`run.secrets\` : passage, indice, découverte, porte révélée, récompense éventuelle.
- \`run.traps\` : type, case/zone, indice, statut, effet, graine/jet pour interaction.
- \`run.exploration\` : cases déjà découvertes, éventuels indices mémorisés ; visibilité actuelle **recalculable** selon héros et LOS.
- \`run.layoutId\`, \`run.rngState\`, \`run.loot\` et \`run.enemies\` : compatibilité avec le moteur existant.

**Migration** : si \`rooms/doors/secrets/traps/exploration\` sont absents, charger l'ancienne carte sans ces systèmes. Ne jamais générer rétroactivement un piège ou une porte cachée dans une descente v0.7f commencée. Préserver le coffre, le héros, les objets, l'XP et l'historique. Conserver une seule source de vérité pour l'équipement et les collisions.

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

## 9. Priorités de production (WIP = 1)

| Code | Lot | Résultat attendu |
|---|---|---|
| **DOC-079** | Ce GDD et critères de sécurité | **Conception seulement** |
| **DEV-080** | Salles, portes ordinaires et couloirs connectés + cadrage caméra mobile | Première véritable carte à explorer, retour testé |
| **DEV-081** | Brouillard de guerre, vue/LOS, mémoire des cases, minimap, mode ASCII | Découverte progressive sans fuite d'information |
| **DEV-082** | Un secret optionnel (cache et/ou raccourci), indices, révélation et sauvegarde | Découverte récompensée sans casser l'extraction |
| **DEV-083** | Deux pièges contrastés (dalle + alarme), indices, contournement et désamorçage | Tension sans dégâts gratuits |
| **QA-084** | Tests multi-graines, migration, boucles de fuite, ergonomie Samsung, testeurs | Validation du plaisir et de la difficulté juste |

**Garde-fou production :** QA-074 (recette Android de la boucle actuelle) reste nécessaire ; ne pas lancer tous les lots d'exploration en parallèle ni annoncer la v0.8 comme jouable avant un vertical slice testé et publié.

---

## 10. Décision finale de design

> **Nhal doit cacher des possibilités, jamais dissimuler une obligation.**  
> Le joueur peut renoncer à une salle, éviter un piège, ignorer une porte secrète ou rentrer par une autre voie. Un bon aventurier gagne par observation et préparation, non parce qu'il connaît à l'avance les pièges du générateur.

**Statut à la rédaction :** v0.7f reste la version jouable ; aucune salle à grande échelle, porte secrète, piège désamorçable ou brouillard de guerre n'a été ajouté au moteur par ce document.
