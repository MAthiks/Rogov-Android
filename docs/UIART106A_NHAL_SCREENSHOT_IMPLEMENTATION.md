# UI/ART-106A — Nhal : première intégration fidèle au screenshot

**Date :** 22 novembre 2026  
**Branche :** `feature/uiart-106a-nhal-reference`  
**Référence :** screenshot utilisateur de Nhal avec bannière « ROGOV », ressources PV/END/sac, carte cadrée, alerte Gardien, six onglets, croix directionnelle, Bandage/Tonique et Actions.  
**Statut :** code intégré à la branche de développement ; vérifier CI et captures avant fusion.

## Différence essentielle entre référence et rendu réel

La référence est une **illustration de composition**. Le jeu doit s'en approcher dans le navigateur/Android **en rendant des données et cases authentiques**, jamais en posant le screenshot au-dessus d'une carte non jouable.

Ce lot traite surtout l'**architecture des panneaux et leur matériau**. La fidélité détaillée des sols, murs, torches, ennemis et objets est le prochain chantier **ART-106C / ART-106D** ; ne pas présenter ce lot comme une correspondance pixel par pixel.

## Ce qui change réellement dans le code

- `docs/index.html` : ajoute une bannière Nhal structurée avec profondeur/tour affichés, trois panneaux de ressources, un bouton « Actions » avec quatre options réelles, et l'ordre des six onglets conforme au screenshot (Carte, Combat, À portée, Sac, Rapport, Journal). Les contrôles de déplacement/attente/soins historiques conservent leurs IDs et listeners.
- `docs/uiart106a.css` : nouveau style activé uniquement sur l'expédition mobile (≤730 px). Lune/ruines du panorama SVG existant, briques de métal biseauté, jauges contrastées, cadre carte, alerte rouge, navigation six cases, gros D-pad en pierre/bronze, deux consommables et bouton Actions ambre. Disposition responsive 320/360/393/412 px.
- `docs/uiart106a.js` : synchronise **sans écriture d'état** les jauges et compteurs à partir des nœuds réellement mis à jour par `docs/app.js`. Le bouton Actions délègue à `jump-combat`, `jump-action`, `listen-btn` et `jump-menu` ; il n'émet aucune action de jeu lui-même et respecte les états désactivés des boutons d'origine.
- `docs/app.js` : appelle la synchronisation après les rendus des systèmes de combat, menus et interface ; aucune modification de `docs/game.js`.
- `docs/sw.js` : cache hors-ligne versionné pour les nouveaux fichiers.
- `tests/uiart106a-reference.test.mjs` : contrats structurels, valeurs dynamiques, progrès et boutons réels.
- `tests/mobile-browser.test.mjs` : captures `qa106a-nhal-360.png` et `qa106a-nhal-412.png`, vérification de la largeur du bouton Actions, du HUD et de l'absence de changement de sauvegarde lorsque le menu s'ouvre/se ferme.

## Scénarios de validation obligatoire

1. À Veyr et à l'écran titre, ni ce skin Nhal ni les menus secondaires n'introduisent de contrôle inutile.
2. En expédition avec une partie sauvegardée, le statut, la profondeur, le tour, les jauges, le sac et les raccourcis affichent les **valeurs actuelles**, même après rechargement.
3. Les six boutons de navigation restent des accès réels aux mêmes panneaux. **Actions** ouvre une liste qui délègue seulement aux boutons originaux ; aucune action désactivée ne peut être simulée.
4. `#tile-map` continue à dessiner la même caméra et le même brouillard ; le skin n'ajoute ni grille cachée, ni ennemi connu à distance, ni point lumineux hors visibilité.
5. Sur 320×640 / 360×800 / 393×704 / 412×915, aucun débordement horizontal ; la carte n'est pas recouverte par `#field-controls` ; les actions tactiles conservent 44 px minimum.
6. Le changement d'onglet, l'ouverture d'Actions et les consultations n'augmentent pas le compteur de tours et ne modifient pas `rogov-web-v1`.
7. Web/Chromium, Chrome Android 13, APK classique et WebView doivent tous réussir. Contrôle final sur **téléphone Android physique** : comparaison côte à côte des captures réelles avec le screenshot utilisateur, écarts notés.

## Correctif de revue

Le cadre visuel n'applique plus de rognage à `.dungeon-wrap` : `#field-controls` est un descendant fixe et l'interface tactique doit rester affichée hors du rectangle de la carte. Le bouton Menu conserve au moins 44 px de hauteur.

## Limitations honnêtes / suite

- Les vrais carreaux 24×24, Sprite C, ennemis, portes, coffres et éclairages ne sont pas redessinés dans 106A.
- Les illustrations générées en conversation **ne sont pas** des assets interactifs prêts à intégrer et ne sont pas utilisées comme écran figé.
- La qualité plastique finale attendue exige **106B (matériaux), 106C (tilesets/décors), 106D (personnages/interactifs)**, puis une QA sur appareil.
