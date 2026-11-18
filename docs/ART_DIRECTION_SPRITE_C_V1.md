# ROGOV — Direction artistique validée : Sprite C, version PJ encapuchonné

**Statut : VALIDÉ POUR PRODUCTION — 18 novembre 2026.**  
**Objet :** refonte de l'apparence du personnage joueur, des PNJ, des trois ennemis et des assets de Nhal.  
**Référence visuelle :** planche « **Sprite Proposal C** » approuvée dans la conversation, **modifiée uniquement pour donner une capuche relevée au PJ dans ses quatre orientations**. La dernière planche validée est la référence artistique ; cette page consigne son contrat d'implémentation, **pas un pack de sprites déjà intégré au moteur**.

## 1. Identité artistique

- **Style :** pixel art dark fantasy, vue de dessus en **trois-quarts**, silhouettes nettes et formes légèrement texturées, évocation des ruines de Nhal. Ne pas employer une perspective isométrique qui changerait les déplacements à quatre directions.
- **Matières :** pierre fendue, métal usé, tissus épais, mousse discrète ; contrastes sous contrôle pour ne pas noyer les éléments interactifs.
- **Éclairage :** ambiances froides, accent ponctuel vert spectral ou ambre, jamais une illumination générale capable de masquer les informations tactiques.
- **Lisibilité :** silhouettes reconnaissables à la taille réelle de la carte Android, sans devoir zoomer. Couleur, taille, silhouette et marqueur d'état se complètent ; jamais une information importante par la couleur seule.
- **Compatibilité :** moteur SVG 24×24, brouillard de guerre, carte ASCII, collisions et identification tactile conservés.

## 2. Personnage joueur : L'Égaré — décision définitive

**Le PJ porte sa capuche relevée en permanence, sur ses quatre sprites directionnels** : face / bas, dos / haut, gauche et droite.

Silhouette retenue :
- Grand capuchon sombre **gris prune / brun désaturé**, ouverture du visage très contrastée, mèches/traits pâles discrets si visibles ;
- Cape de voyage effilochée, col ou écharpe épais, lanières, petites sacoches et bottes ;
- Face et détails clés **ivoire clair**, pour garder le PJ repérable contre les sols froids et les murs ;
- Point d'éclat parcimonieux ; **aucune croix ou grand signe lumineux** qui le confonde avec une interaction ;
- **Quatre directions cohérentes**, capuche clairement visible de dos, pas de changement de couleur de tenue selon l'orientation.

**Production :** créer les quatre vues à proportions identiques et tester au minimum idle ; animation de marche et actions peuvent suivre. **Ne pas utiliser directement les petites illustrations de la planche comme atlas prêt à l'emploi** : elles doivent être redessinées en véritables sprites unitaires, sans cadres ni légendes.

## 3. Personnages non joueurs — concepts visuels

| Concept validé | Silhouette / lecture |
|---|---|
| **Gardien du refuge** (Warden) | Silhouette fine, robe/cape à capuche et lanterne tenue à la main ; vertical, calme, éclat ambré |
| **Forgeron de reliques** (Relic Smith) | Silhouette trapue, épaules carrées, barbe et tablier d'artisan ; outil ou pièces métalliques |
| **Érudite de l'Écho** (Echo Scholar) | Silhouette fine sous étoffe sombre, livre/artefact marqué de vert, geste de lecture distinct |

Ce sont des **concepts artistiques**, pas de nouveaux PNJ actifs ni de nouvelles mécaniques. Le refuge de Veyr ne reçoit pas automatiquement de nouveaux dialogues ou marchands.

## 4. Ennemis : signatures d'un seul regard

| Entité existante | Nouvelle lecture voulue |
|---|---|
| **Charognard** | Créature basse et allongée, silhouette d'oiseau charognard déformé, bec osseux et griffes, asymétrie marquée ; tête claire ponctuelle |
| **Gardien déchu** | Masse humanoïde très large et lourde, armure/pierre fracturée, arme massive, fentes lumineuses limitées ; jamais comparable au PJ |
| **Larve de faille** | Corps larvaire court et segmenté, orientation horizontale, excroissances et point d'émission spectral ; taille et forme distinctes du Charognard |

Les trois ennemis doivent conserver leurs **comportements, PV, intentions et distances actuels**. Les couleurs de la planche sont des propositions de rendu ; les indices fonctionnels existants priment en cas de confusion.

## 5. Assets et états de jeu

- **Sol/mur :** pierre froide à lisibilité élevée, textures discrètes, variantes compatibles avec l'autotiling DEV-089B. Les sols restent visuellement plus calmes que les entités.
- **Porte :** encadrement de pierre ; **ouverte = ouverture noire évidente**, **fermée = vantail plein et opaque**.
- **Coffre :** métal/bois, **fermé = couvercle scellé**, **ouvert = couvercle relevé**, sans dépendre uniquement d'une lueur.
- **Pièges :** trois états distincts : **indice discret** (soupçon), **révélé** (danger concret, pointes ou mécanisme), **désamorcé** (mécanisme neutralisé) ; le soupçon ne doit pas se confondre avec un danger confirmé.
- **Arche d'extraction :** grande silhouette d'arche et intérieur turquoise/vert froid, unique lecture de **sortie**. Ne jamais lui donner la même forme qu'une faille mortelle.
- **Passage secret :** ouverture dans un mur fracturé, seulement visible **après** découverte ; aucune information ne doit fuiter via le sprite, les classes CSS ou la légende.
- **Sites de Nhal :** atelier (outils/forge et auvent), chambre de l'Écho (cercle rituel), cache oubliée (ruines et reliquaire). Les trois silhouettes doivent être reconnaissables à une taille de carte réduite.
- **Objets :** fragment de cendre (éclat minéral), bandage (rouleau clair), tonique (fiole verte), épée usée (lame abîmée) ; ne pas confondre le fragment avec l'Arche ni la fiole avec un piège.

## 6. Contrat de production technique

La planche validée **n'est pas un atlas informatique prêt à découper** : des cadres, ombres, textes et arrière-plans décoratifs y figurent. Recréer des sprites originaux séparés en SVG ou en PNG transparent, selon le pipeline du moteur. Garder des proportions constantes, un ancrage centré dans les cellules, une silhouette lisible sous le brouillard et un rendu net à l'échelle mobile.

**Ordre des chantiers recommandé :**
1. **ART-091A — PJ** : quatre orientations du personnage encapuchonné, priorité à la silhouette sur téléphone.
2. **ART-091B — Ennemis existants** : Charognard, Gardien déchu et Larve de faille ; vérification des intentions tactiques et du brouillard.
3. **ART-091C — Interactifs et lieux** : portes, coffres, pièges, Arche, passage secret et trois sites ; tests des états d'ouverture/découverte.
4. **ART-091D — PNJ/objets** : concepts de Veyr, icônes d'inventaire et cohérence générale ; aucune nouvelle fonction de jeu implicite.

Chaque lot doit avoir **diff visuel isolé, tests Node/Chromium et Chrome Android 13**, contrôle de taille du viewport en portrait, contrôle offline PWA, et vérification sur téléphone physique avant de déclarer l'art final. Ne pas toucher au RNG, à la génération des plans ou aux sauvegardes.

## 7. Décision et ce qui reste à réaliser

**VALIDÉ :** la direction **Sprite C**, l'apparence **capuche relevée** du PJ, l'esthétique sombre, les silhouettes des PNJ/ennemis et la famille d'assets de la planche.

**NON LIVRÉ PAR CETTE APPROBATION :** aucun remplacement effectif des sprites utilisés dans `docs/tiles.js`, aucune animation, aucune nouvelle classe, aucun PNJ ajouté au gameplay et aucune modification de l'APK ou du site public. La planche approuvée est conservée dans la conversation ; **le fichier image n'est pas encore archivé comme ressource de production dans GitHub**.

Références complémentaires : [Bible visuelle v0.6](VISUAL_BIBLE_V0.6.md), [GDD exploration v0.9](GDD_EXPLORATION_NHAL_V0.9.md) et [tiles DEV-089B](DEV089B_TILESET.md).
