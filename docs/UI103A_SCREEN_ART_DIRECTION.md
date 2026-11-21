# ROGOV — UI-103A : direction artistique unifiée des quatre écrans

**Référence créative :** planche utilisateur « ROGOV — UI-096 — Maquettes v3 », présentée le 21 novembre 2026. **Cible :** rendu dark fantasy / low magic *proche en langage visuel*, non copie pixel à pixel de l'illustration. L'illustration combine quatre écrans distincts dans une seule planche marketing ; sur Android ils restent des vues portrait indépendantes.

**Statut :** première passe CSS appliquée sur `feature/ui-103a-screen-art-direction`, dérivée du chantier UI-102 encore non fusionné. Aucune modification des sauvegardes, mécaniques, sprites, brouillard, carte ou contrôles d'action. Le visuel final et l'ergonomie physique restent à valider.

## Grammaire commune

- Fond **bleu-noir** `#080E15` / `#0D1721` ; pierre `#36414B` ; fer `#1B2832`.
- Bronze patiné `#BD965F` et lumière ambre `#E2BD83` : cadres, séparateurs, sélection et interfaces sûres ; ivoire `#F1E7D4` pour les textes essentiels.
- Menaces en rouge poussière `#D9857A`, Arche en turquoise `#6DD0C0` : ne jamais utiliser la couleur seule pour signaler un état.
- Titres historiques à empattements (Georgia) ; valeurs, quantités et jauges en chiffres tabulaires ; libellés sans effets qui nuisent à la lecture.
- Une seule grande zone d'intérêt par vue ; petits filets de métal et doubles biseaux, jamais d'encadrement qui recouvre une case du donjon.
- Visuels de Nhal : pierre froide, cyan parcimonieux, obscurité ; Veyr : lanternes, chaudron/forge, bois et cuivre. L'inventaire et la fiche restent des panneaux en métal et cuir usés.

## Écran 1 — Nhal / descente

- **Priorité 1 :** la carte graphique réellement visible (11 × 11) et le Sprite C sans cadre vert.
- HUD compact : PV, endurance, tours, sac, profondeur, menace observée uniquement ; pas de ressources fictives.
- Entourage : pierre, fer, relief discret ; halo uniquement pour les éléments déjà visibles de l'engine.
- Les six raccourcis existants, le pavé de déplacement et l'action contextuelle conservent leurs handlers et leurs dimensions.
- L'Arche et la Faille restent distinguables par leur silhouette ; pas de fausse information dans le brouillard.

## Écran 2 — Veyr / refuge

- Bannière panoramique locale de Veyr encadrée de bronze, chaleur des torches contre le bleu nocturne.
- Blocs réels : **préparation/coffre**, **forge**, **Échos**, **fiche de l'Égaré** ; ne pas promettre de commerce, repos interactif, quête ou PNJ actif.
- Le bouton « Descendre dans Nhal » reste fixe et lisible sur téléphone ; l'accessibilité du contraste doit rester au moins égale à la version UI-102.
- Le coffre sauvegardé reste distinct du sac risqué ; les unités et Fragments sont issus du jeu, jamais des valeurs de maquette.

## Écran 3 — sac / inventaire

- Panneau coulissant réel `#ui092-sheet` avec `#bag-panel` existant. Habillage « coffre portatif » sans tabulation ou emplacements fictifs.
- Lignes et icônes des objets en métal patiné ; noms en ivoire, sélection en ambre.
- Nombre d'unités max **8**. Les équipements et usages n'apparaissent que si réellement autorisés ; danger du Rappel explicitement visible.

## Écran 4 — personnage

- Habillage « fiche de l'Égaré » : statuts réels du jeu, six caractéristiques `FOR / AGI / CON / PER / VOL / INT`, équipement existant, pas de classe ou talents inventés.
- L'identité du Sprite C encapuchonné reste la référence iconographique ; le CSS n'introduit pas de portrait non produit.
- Tuiles lisibles, valeurs contrastées, fiches accessibles au refuge et en expédition.

## Implémentation UI-103A

- `docs/ui103a.css` chargé **après** les styles UI-102 / UI-099 / UI-100 ;
- mise à jour de `docs/index.html` (un seul `<link>`) ;
- cache de `docs/sw.js` mis à jour pour maintenir le rendu hors ligne, et dans l'APK WebView qui partage les mêmes assets ;
- tests statiques qui interdisent la création de faux écrans ou la modification accidentelle des handlers.

**Non inclus dans cette passe :** portraits pixel-art supplémentaires, nouveaux cadres SVG rasterisés, icônes objets dessinées, nouveaux menus de commerce ou d'entraînement. Ces éléments demanderont une passe ART-103B avec validation visuelle dédiée.

## Validation Android obligatoire

Tester sur **320 × 640**, **360 × 780** et **393 × 704** en portrait :

1. Nhal : la grille entière reste au-dessus du dock ; aucun pixel du sol ou des ennemis n'est obscurci par l'habillage.
2. HUD : PV / END / profondeur / sac / tours restent lisibles ; menace affichée seulement si connue.
3. Inventaire : ouvrir/fermer Sac, compter les objets, équiper si disponible, revenir aux déplacements sans action involontaire.
4. Personnage : fiches au refuge et en descente ; valeurs et contraste sans rognage.
5. Refuge : tap sur les quatre accès, préparation, annulation et départ ; bouton fixe touchable, aucun chevauchement.
6. PWA en mode avion et APK moderne : feuilles CSS chargées ; sauvegarde `rogov-web-v1`, `schemaVersion=1`, et reprise intactes.

**Dépendance GitHub :** la PR UI-102 (#69) reste distincte et fait encore l'objet de contrôles WebView. UI-103A est empilée sur cette branche ; ne fusionner dans `main` qu'après intégration de UI-102 et contrôles de qualité, sans masquer les erreurs existantes de CI.
