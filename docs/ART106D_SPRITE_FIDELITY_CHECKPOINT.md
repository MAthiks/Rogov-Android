# ROGOV — ART-106D : Personnages, ennemis, portes, coffres et anomalies

**Date de conception :** 22 novembre 2026  
**Référence visuelle :** screenshot Nhal fourni par l'utilisateur  
**Statut :** implémentation sur branche `feature/art-106d-characters-and-interactives`.  
**Dépendance :** ART-106C (`feature/art-106c-nhal-masonry`, PR #78). **Ne pas fusionner 106D avant 106C.**

## Objectif

Faire converger les **vrais sprites 24×24 du jeu** vers la composition dark fantasy du screenshot : capuche prune du PJ, silhouette du Gardien en armure métallique et regard rouge, créatures lisibles, coffres dorés, portes en bois/fer, Arche cyan et Faille vert acide.

Le screenshot est un concept détaillé à une résolution sensiblement supérieure au 24×24 moteur. Ce lot ajoute de vrais pixels et détails à l'atlas, mais ne constitue pas une reproduction pixel à pixel de l'image. **Ne jamais substituer un calque de screenshot au gameplay.**

## Fichiers

- `art106d-finishes.js` : fonction pure d'enrichissement de sources SVG 24×24 pour les seuls types existants.
- `hero-art.js` : appliqué à Sprite C **down/up/left/right** (liseré de capuche, plis de cape, sangles, yeux chauds, vue dos toujours sans visage). La direction droite garde le miroir exact du profil.
- `enemy-art.js` : Charognard (plumage), Gardien déchu (armure, épaulières, yeux rouges) et Larve de faille (segments et yeux rouges). **Aucune modification de leur type, rôle ou mécanique de combat.**
- `interaction-art.js` : finit 6 types existants, **loot**, **chest_open**, **door_open**, **door_closed**, **exit**, **hazard**. Dorures pour coffre fermé, cavité vide ouverte, vantaux bois et ferrures, rune cyan d'extraction et fissure vert acide.
- `sw.js` : nouveau module préchargé hors ligne PWA et APK ; identifiants de cache hérités conservés.
- `tests/art106d-characters-interactives.test.mjs` : validation 4 PJ, 3 ennemis et 18 interactifs, intégrité des SVG d'origine, identité, absence de fuite de brouillard ou d'écriture sauvegarde.
- `tests/mobile-browser.test.mjs` : captures **qa106d-nhal-360.png / qa106d-nhal-412.png** à partir de la vraie carte et assertions sur les assets utilisés réellement.

## Contraintes intangibles

- Identifiants Sprite C, ennemis, portes, ressources, coffres, pièges et Arche inchangés.
- Les pièges non révélés restent seulement des indices ambigus ; **aucune nouvelle décoration ne doit dévoiler un piège caché**.
- Les ennemis ne sont dessinés que selon le code de visibilité existant de `tiles.js`.
- `docs/game.js`, les règles de tours, génération, inventaire, collisions, IA et `rogov-web-v1` sont inchangés.
- SVG originaux `24×24` sans police, image ni requête externe, sans cadre coloré autour du PJ.
- Compatibilité Android 13 Chrome, APK traditionnel et WebView, plus navigateur Chromium.

## Recette

- [ ] Test 106D et tests historiques des sprites verts.
- [ ] 4 workflows GitHub réussis pour le dernier commit.
- [ ] Captures Android du rendu réel comparées au screenshot source.
- [ ] Emplacement et visibilité des PNG/SVG inchangés, aucun objet connu dans le brouillard.
- [ ] Touches tactiles, inventaire, combat, sauvegarde/reprise hors ligne intacts.
- [ ] Validation visuelle sur appareil Android physique.

## Consigne de fusion

**PR 106D dépendante** : attendre que la PR #78 (106C) passe la QA WebView, soit fusionnée, puis ne fusionner la PR 106D qu'après ses propres 4/4 validations. Si 106C est bloquée, 106D peut rester ouverte pour code-review et captures, sans annoncer de release.
