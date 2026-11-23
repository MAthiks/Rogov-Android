# TECH-108B2 — Élager la cascade CSS mobile sans changer l'affichage

**Base immuable :** `main@52de6bc20434c3bf64f8c21d0977d25070d30f9a` — PR #92 TECH-108B1 fusionnée.
**Statut :** lot candidat, fusion strictement après quatre workflows verts sur le SHA final.

## Précaution et dépendances

L'inventaire TECH-108B1 confirme que `docs/index.html` charge les **23 feuilles CSS** en ordre déterministe. `uiart106a.css` est chargé **avant** `uiart106e.css`. Ces deux ressources sont toujours présentes dans le `CORE` du service worker `docs/sw.js`, et dans l'APK moderne qui emballe directement `docs/`. L'ordre n'est pas modifié.

Le bloc graphique `uiart106a.css` définissait un `min-height:53px` sur les six raccourcis Nhal dans le breakpoint mobile (max-width 730px) puis un bloc destiné aux petits écrans (max-width 730px et max-height 760px) qui redéfinissait :
- hauteur de l'en-tête : 72px et padding 7px ;
- largeur de la caméra `.pixel-map` par une formule dépendante de `dvh` ;
- marge basse des ressources `.nhal106-vitals` : 7px ;
- hauteur des raccourcis : 47px.

Tous ces réglages sont **supplantés dans chaque viewport concerné**, avec les **mêmes sélecteurs CSS et des media queries inclusives**, par `uiart106e.css` chargé après :

| Propriété et sélecteur | Ancienne valeur 106A | Valeur finale 106E |
| --- | --- | --- |
| Hauteur des six raccourcis mobiles, >760px de haut | 53px | 45px |
| Hauteur des raccourcis, ≤760px de haut | 47px | 44px |
| En-tête, ≤760px | min-height 72px / padding-top 7px | 66px / 5px |
| `.pixel-map`, ≤760px | largeur `min(100%, calc(100dvh - 395px), 540px)` | `min(100%, var(--nhal106e-map-width,100%), 540px)` |
| `.nhal106-vitals`, ≤760px | marge 7px | marge 3px |

La règle de dimensions 106A perd son `min-height:53px` et le bloc entier 106A `max-width:730px + max-height:760px` est retiré. Ces valeurs étaient inaccessibles dans l'application complète tant que les feuilles sont toutes deux chargées dans le bon ordre. Il n'y a **aucune suppression de ressource, de sélecteur utilisé, de sprite ou de fonctionnalité**.

## Mesure avant/après

`docs/uiart106a.css` : **17 708 → 17 317 caractères**, soit **391 caractères ASCII supprimés**. Comme toutes les suppressions portent sur de l'ASCII, le poids UTF-8 de cette CSS diminue aussi de 391 octets. Les autres stylesheets, JS, sprites et archives de sauvegarde ne sont pas modifiés.

Le `CORE` du service worker et ses URLs restent identiques. Les clients ayant conservé la vieille CSS en cache gardent donc leur comportement, car les valeurs anciennes y étaient déjà masquées par la feuille 106E.

## Garde-fous

Le nouveau test Node `tests/tech108b2-cascade.test.mjs` est explicitement ajouté à la chaîne obligatoire `npm run test:web` dans `package.json`. Il impose :
- le chargement 106A puis 106E par `index.html` ;
- les deux URLs conservées dans le cache PWA ;
- l'absence des anciennes déclarations inutiles ;
- l'existence des hauteurs mobiles, du cadrage de caméra, de l'en-tête et de la marge dans 106E.

Ce test statique ne remplace **pas** les scénarios Playwright et émulateur Android : ceux-ci doivent à nouveau prouver les tailles 320×640/360×800/393×704/412×915, la reprise PWA hors ligne, la non-révélation du brouillard et les cibles tactiles d'au moins 44px.

**Portée interdite :** pas de modification de gameplay, RNG, inventaire, état sérialisé `rogov-web-v1`, Sprite C ou art validé.

Le risque de déconnexion WebView en émulation reste isolé dans [issue #91](https://github.com/MAthiks/Rogov-Android/issues/91), avec recette physique obligatoire avant clôture de TECH-108D.
