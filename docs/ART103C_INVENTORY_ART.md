# ROGOV — ART-103C : inventaire et emplacements réellement équipés

**Référence visuelle :** écran « SAC » de la planche UI-096 — Maquettes v3 fournie par l'utilisateur le 21 novembre 2026. Ce chantier adapte l'identité dark fantasy de l'illustration au sac tactique du jeu réel, à capacité **8 unités**, sans proposer de catégories ou d'équipements inexistants.

**Branche :** `feature/art-103c-inventory-equipment` ; empilée sur ART-103B / PR #71, elle-même sur UI-103A / PR #70, puis UI-102 / PR #69.

## Changements réalisés

- `docs/item-art103c.js` : les **11 objets officiels** tirés de `ITEMS` et `ITEM_ART_IDS` sont tous repris. Affinage matériel original des sprites SVG 24×24 déjà présents, avec symboles d'ombre, métal, armure, os, tissu et éclats minéraux. Les ID et les effets de jeu restent intacts. Aucun chargement d'image externe, ni hasard, ni stockage.
- `docs/app.js` : le renderer de sac réutilise ces onze images ; chaque ligne reçoit la nature visuelle de l'objet et l'état d'équipement **effectif**, sans action. Les quatre emplacements existants `mainHand`, `offHand`, `body`, `relic` sont présentés comme une grille de fiches, avec pictogramme réel, nom, ou « Aucun » en cas de slot vide. **Pas d'emplacement de bague, casque, magie ou talent fictif.**
- `docs/art103c.css` : cases de fer noir, encadrement de bronze, icônes agrandies à 35 CSS px sur écrans usuels, sous-titres de type, nombres mieux distincts et mise en avant du matériel réellement porté. Les gestes Équiper / Retirer / Utiliser / Abandonner demeurent les boutons de l'engine, avec leurs coûts en tours ; les touches restent de 44 CSS px minimum.
- `docs/index.html` et `docs/sw.js` : activation après ART-103B et précache des CSS/JS. PWA hors ligne et APK WebView partagent les mêmes sources.
- `tests/art103c-inventory.test.mjs` et `tests/mobile-browser.test.mjs` : validations des onze SVG, du schéma, des vrais quatre slots, captures des trois portraits, inspection des commandes et de la persistance.

## Réalité des objets, pas valeurs de la maquette

Équipement existant : Épée usée, Lame cendrée, Dague d'ossement, Masse ferrée, Rondache usée, Cuirasse de récupération, Armure de plaques disjointes.

Objets existants : Bandage, Sels de vigueur, Tonique du crépuscule, Fragment de cendre.

Le modèle de combat et les règles de perte au Rappel sont inchangés : tous les objets emportés dans Nhal restent risqués, les objets au coffre restent sécurisés et une action réelle consomme les tours prévus.

## Contrat Android / QA

Les validations doivent vérifier les trois portraits **320 × 640, 360 × 780, 393 × 704** :
1. Dans une descente avec épée équipée et deux bandages, quatre slots lisibles, un réellement actif, deux lignes d'inventaire avec les bonnes quantités.
2. Le tiroir mobile et les boutons de contrôle ne se chevauchent pas, la croix est touchable (≥44 px), aucun défilement horizontal.
3. Les images SVG chargent en autonomie, restent nettes à 24 px source et visiblement agrandies sans masquer les noms.
4. Ouvrir, parcourir et refermer le sac ne dépense pas de tour et ne modifie pas la sauvegarde. Les actions du joueur gardent leurs handlers et leur coût.
5. Mode avion/PWA : `item-art103c.js` et `art103c.css` disponibles en cache ; APK moderne : rendu à partir des mêmes ressources.
6. Les captures `qa096-screenshots/art103c-bag-{320,360,393}.png` (CI) sont destinées à une revue réelle sur téléphone. Une CI verte ne prouve pas, à elle seule, que la fidélité artistique de l'illustration est entièrement atteinte.

**Non inclus :** interactions drag & drop, objets supplémentaires, catégories Équipement / Objets / Ressources fictives, modifications de `docs/game.js`, achat, vente, usure nouvelle ou recettes de forge. La future fiche personnage ART-103D restera un lot séparé.

**Fusion :** ne pas fusionner directement dans `main` avant validation des PR #69, #70, #71 puis CI du présent lot.
