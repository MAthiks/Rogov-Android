# UI/ART-099 — Refonte mobile carte dominante + allègement des matériaux

**20 novembre 2026 · gros lot exceptionnel, WIP=1 · FUSIONNÉ, PR #59, commit `0ceb968` · contrôle physique à réaliser**

## Décision produit

Retour utilisateur sur Android après ART-097C2 : la seconde capture confirme
que le défilement vertical fonctionne ; le pavé directionnel reste fixé,
les trois cartes ennemies sont accessibles. Les obstacles réels à résoudre
sont la densité visuelle de Nhal et la longueur de la page, **pas** un
nouvel échec des boutons.

**Un seul lot exceptionnel** regroupe la densité des matériaux de terrain et
la navigation mobile, sans changer l'économie, les combats ni la structure
des salles et des couloirs.

## Fonctionnement cible

**Carte au premier plan (Android portrait ≤730 CSS px)**

- Carte 11×11 de Nhal conservée ; anciennes sauvegardes 15×9 affichées
  sans migration ; mode ASCII intact.
- En-tête ROGOV, HP/END, danger visible, mission et vrais six raccourcis
  restent présents, avec les boutons du pavé et les soins fixes.
- Les panneaux **Combat**, **Sac** et **Rapport** ne se répètent plus dans
  la longue page. Les mêmes nœuds, contrôles et écouteurs natifs
  sont transférés aux tiroirs UI-092A, par la navigation d'origine.
- Le **Journal** se consulte depuis son raccourci natif et ne gonfle plus
  l'écran de descente. Le retour d'action actuel est lisible sous forme
  d'une bande de statut courte directement sous les raccourcis.
- **Menu** contient, sans copie, les vrais blocs **Fiche de l'Égaré**,
  objectif/itinéraire, inspection d'une case, plan découvert et légende.
  Les éléments reviennent à leur place sur PC ; la fiche retourne au
  refuge via UI-096C. Le libellé d'inspection de la dernière case visible
  figure aussi dans la bande de statut.
- La décision d'extraction / nouvelle profondeur à l'Arche ainsi que
  les avertissements imminents restent directement visibles hors Menu.

**Sols et murs plus lisibles**

- Six sols : lignes secondaires de joints atténuées, micro-fissures,
  mousse et usure de chaque variante beaucoup plus discrètes ; toutes
  les balises matière 097A1/097C2 demeurent dans les SVG.
- 48 murs : séparation du plan supérieur, parement et ombre soulignée ;
  texture aléatoire cosmétique atténuée. Aucune forme de fausse
  porte, secret ou piège. Aucun shader ni glow de case PJ.
- Toujours 54 SVG 24×24 crispEdges et Sprite C capuche 4 directions.
  Matériau déterminé par le hash *déjà calculé* des coordonnées ;
  aucune lecture d'un voisin inconnu pour sélectionner un mur.

## Contrats strictement conservés

`SAVE_KEY=rogov-web-v1`, schéma 1. Aucun changement de mouvement,
attaque, tour, soin, déplacement, ciblage, extraction, butin, RNG ou
`game.js`. Aucun clone DOM, écriture en storage, nouvel état sérialisé,
accès au contenu d'une case masquée, interaction automatique ou asset réseau.
Pas de modification de la taille des vrais boutons de survie.
Tous les panneaux passent par les identifiants et handlers existants.

CSS et contrôleur additionnels `docs/ui099.css`, `docs/ui099.js`.
Petites intégrations `docs/index.html`, `docs/app.js`.
Matières dans `docs/terrain-art.js`. Cache PWA `docs/sw.js`.
Seule interface mobile en descente ciblée ; desktop et refuge restent
fonctionnels sans utiliser la nouvelle mise en page.

## Recette automatisée validée, recette physique restante

1. `npm run check:web`, `npm run test:web` incluant
   `tests/ui099-focus.test.mjs` et les contrats antérieurs.
2. Chromium Android tactile 320×640, 360×780, 393×704 : carte,
   top HUD, six raccourcis, bande courte, dock à 44px au minimum,
   absence de débordement et feuille fermée au-dessus du dock ;
   menu connaissances, Sac, Journal, Rapport et combat réels.
   Captures `ui099-map-first-<largeur>x<hauteur>.png` en CI.
3. Chrome Android 13 (émulateur), APK WebView Android 13 installé
   avec tests de sauvegarde et hors réseau, APK Kotlin compatibilité.
   Aucun test émulé n'est un essai sur téléphone physique.
4. Contrôle manuel sur Android : fonds de sol moins bruyants, murs
   discernables sans la légende, personnages / coffres / Faille visibles,
   actions Combat et menu faciles à retrouver, retour carte fiable,
   reprise d'une ancienne partie, consultation sac/journal, mode ASCII,
   traitement de l'Arche, et fonctionnement hors ligne.
5. GO esthétique après capture physique ; campagne 5 testeurs ×
   2 descentes ultérieurement. Godot/PC restent reportés.

**Statut final (20 novembre 2026) :** fusion squash PR #59,
commit `0ceb9688851708bff655031c12765b192bf73d1a`.
**4/4 workflows CI verts** — 394/394 tests Node, 65/65 Chromium,
Chrome Android 13, WebView Android 13 (sauvegarde/offline et panneaux)
et build Kotlin/ASCII. Les tests WebView attendent désormais réellement
l'initialisation JavaScript lors d'un rechargement.

**Encore ouvert :** un essai esthétique et ergonomique sur vrai Android
après mise à jour de la PWA ou de l'APK principal ; validation de
l'absence d'obstruction et de la reprise de sauvegarde sur l'appareil
de l'utilisateur. Une fusion GitHub seule n'actualise aucun APK installé.
Ne pas déduire un GO artistique du seul émulateur.
