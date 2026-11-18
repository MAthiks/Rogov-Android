# ROGOV — ART-091D : Veyr, PNJ conceptuels et objets Sprite C

**Référence :** [ART_DIRECTION_SPRITE_C_V1.md](ART_DIRECTION_SPRITE_C_V1.md) — lot final de la refonte graphique Sprite C.

**Dépendances :** [ART-091A](ART091A_IMPLEMENTATION.md) (Égaré encapuchonné), [ART-091B](ART091B_IMPLEMENTATION.md) (trois ennemis), [ART-091C](ART091C_IMPLEMENTATION.md) (interactifs et lieux).

## Périmètre

Huit SVG originaux, indépendants, dessinés pour la lecture en **24×24 pixels**, sans images distantes ni licence tierce. Le nouveau module docs/veyr-art.js est uniquement graphique, sans interaction avec les règles, les sauvegardes ou le RNG.

### 3 silhouettes PNJ, strictement conceptuelles

| Nom d'art | Silhouette | Statut |
|---|---|---|
| Gardien du refuge | Cape et capuche étroites, lanterne à éclat ambré | Illustration de concept |
| Forgeron de reliques | Corps trapu, barbe, tablier usé, marteau | Illustration de concept |
| Érudite de l'Écho | Silhouette fine, capuche sombre, livre ouvert marqué de vert | Illustration de concept |

**Aucun PNJ actif ajouté.** Il n'existe ni nouvel acteur en donjon, ni marchand, ni dialogue, ni quête, ni bouton d'interaction, ni nouvel objet. Les concepts apparaissent seulement dans le panneau « Habitants de Veyr — concepts visuels », replié par défaut au refuge, clairement légendé comme non interactif.

### 5 objets : toutes les entrées actuelles du moteur

| Clé existante | Identité visuelle |
|---|---|
| weapon.rusty_sword | Lame usée, entaille et poignée sobre |
| weapon.ashen_blade | Lame forgée, reflet cendré discret |
| consumable.bandage | Rouleau de toile claire |
| relic.ashen_fragment | Éclat minéral facetté, sans silhouette d'Arche |
| consumable.dusk_tonic | Fiole bouchonnée et liquide vert désaturé |

La **même icône SVG** apparaît dans le coffre du refuge et dans le sac. Noms, catégories, quantités, cases à cocher et interactions restent identiques. Les symboles ASCII originaux sont conservés dans ITEMS et servent de secours en cas d'échec de l'image.

## Intégration

- docs/veyr-art.js : SVG 24×24 et data URIs encodées, sans ressources distantes.
- docs/app.js : conserve infoItem(), les cases à cocher et labels ; ajoute une image décorative avec texte accessible et repli sur symbole.
- Galerie pure présentation de trois portraits de 48 CSS pixels (agrandis depuis 24 px) dans un panneau replié par défaut, sans action de jeu.
- docs/style.css : lisibilité sur Android 360px, conservation du responsive et des tailles tactiles.
- docs/sw.js : précache le nouveau module et renouvelle la version PWA.
- **Intacts :** docs/game.js, le RNG, la génération, le combat, l'économie, la forge, l'inventaire logique, la sauvegarde (rogov-web-v1, schéma 1), le brouillard et le mode ASCII.

## Vérification automatique

1. Node (tests/veyr-art.test.mjs) : cinq clés strictement identiques à celles du moteur, trois concepts distincts, sécurité SVG/offline et invariants de sauvegarde.
2. Chromium portrait Android 360×780 (tests/mobile-browser.test.mjs) : décodage des cinq icônes, trois portraits, coffre, sélection tactile, sac, mode ASCII, rechargement et non-débordement.
3. GitHub Actions : syntaxe, gameplay, Chromium, Chrome Android 13 sur émulateur et installation APK, puis GitHub Pages après fusion.

## Recette visuelle restante

L'approbation graphique **finale** sur **téléphone Android physique** reste à faire : comparer les cinq petites icônes sur fond sombre, vérifier les cases et libellés au coffre, le panneau des concepts, et les icônes du sac. Les tests automatisés ne valident pas à eux seuls le ressenti esthétique.

## Suite

La série ART-091A/B/C/D est techniquement complète après tests et fusion. Reprendre ensuite QA Android physique, retours de testeurs et équilibrage v0.7f. DEV-090D (préparation et équipement au refuge) et DEV-089D (familles architecturales) restent séparés.
