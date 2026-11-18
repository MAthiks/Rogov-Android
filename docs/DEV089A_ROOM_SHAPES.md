# ROGOV — DEV-089A : Diversité réelle des salles de Nhal

**Statut : prototype implémenté sur `dev/dev-089a-room-shapes`, non fusionné dans `main`.**  
**Référence :** [GDD Exploration profonde de Nhal v0.9](GDD_EXPLORATION_NHAL_V0.9.md), sections 11, 13 et 14.

## Objectif

Créer une vraie variété **géométrique** dans les nouvelles descentes profondes, sans simuler des obstacles par de simples sprites. Le graphe 4 × 3 de DEV-085 reste volontairement identique : sa refonte en topologie variable relève de **DEV-089C**, pas de cette PR. Le nouveau style de tiles relève de **DEV-089B**.

## Quatre variantes générées

| Type `room.shape` | Génération et collision |
|---|---|
| `l` | Un angle intérieur de quatre cases devient un mur solide dans la salle périphérique 0 ou 11 ; les portes sur les autres côtés restent praticables |
| `pillar` | Un pilier central bloque déplacement et ligne de vue |
| `collapsed` | Deux cases de maçonnerie effondrée forment un obstacle intérieur |
| `alcove` | Deux contreforts resserrent un passage et forment une petite alcôve accessible |
| `rectangle` | Ancienne chambre rectangulaire, conservée pour la majorité du plan |

La répartition des variantes est **déterministe**, basée sur la graine de descente ; les quatre types particuliers apparaissent chacun une fois dans une nouvelle carte profonde, mais dans des salles qui varient. Les cinq autres salles, les chambres dédiées au butin, aux combats, au refuge et à l'Arche gardent un centre dégagé. **12 salles, 6 portes et 17 connexions** pour cette première livraison.

## Contrat technique

- `room.shape` décrit la silhouette ; `room.obstacles` contient les coordonnées des blocs de maçonnerie **réels**, enregistrées avec la carte et `run.geometryVersion=1` pour les nouvelles descentes.
- Une maçonnerie bloquante est un vrai `#` du plan : collision, LOS, mini-carte, ASCII et rendu SVG lui attribuent tous le comportement d'un mur.
- Les murs intérieurs sont placés **après** les seuils ordinaires, mais **avant** départ, butin, ennemis, failles, secrets, pièges et salles spéciales ; la validation vérifie leur placement et l'absence d'obstruction des vraies portes.
- Les secrets DEV-082 ne peuvent pas ouvrir par erreur un des murs structurels créés par DEV-089A.
- Les **deux voies de retour indépendantes**, l'accès aux coffres et sites, les indices de pièges et la possibilité d'extraire sans combat restent testés.
- Un même seed retourne exactement le même plan. Une descente en cours sans `geometryVersion` ou `room.shape` reste inchangée et valide au chargement.
- Aucune dépendance réseau : le cache PWA est incrémenté pour la nouvelle version.

## Tests prévus et exécutables

`tests/room-shapes.test.mjs` (240 graines) : types de salles, blocages réels, voies de retour, butin et salles accessibles, secrets non superposés, répétabilité et sauvegardes historiques.

`tests/mobile-browser.test.mjs` : depuis Chrome mobile 360 px, le pilier est un mur graphique, bloque une commande tactile sans dépenser de tour, interrompt la LOS, reste un mur ASCII et survit au rechargement.

Critères de fusion : `npm run check:web`, `npm run test:web`, Playwright Chromium mobile, Chrome Android 13 émulateur et APK de compatibilité verts. Tester ensuite l'exploration sur Android réel avant de fusionner.

## Recette physique Android (sans modifier la version publique)

Sur Termux :

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-089a-room-shapes https://github.com/MAthiks/Rogov-Android.git rogov-qa-089a
cd rogov-qa-089a
python -m http.server 8789 --bind 127.0.0.1 --directory docs
```

Ouvrir `http://127.0.0.1:8789/` dans Chrome, puis commencer une **nouvelle deuxième descente** (la première est un tutoriel). Repérer les piliers, la salle en L, les murs effondrés, explorer un coffre et un site interactif, contourner un piège, extraire puis charger une partie. Le port 8789 isole les sauvegardes du site public. Les nouveaux obstacles ne sont pas ajoutés rétroactivement dans les descentes antérieures.

**Non couvert par DEV-089A :** nouveau tileset, changement de la grille des pièces ou familles de secteur (089B/C/D).