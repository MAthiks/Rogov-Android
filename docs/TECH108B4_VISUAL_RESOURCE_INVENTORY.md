# TECH-108B4 — Inventaire non destructif des ressources graphiques de ROGOV

**Base :** `main@5f19d72d06034d09a5c279cb82a4061fc590be1e` — protection PWA [PR #95](https://github.com/MAthiks/Rogov-Android/pull/95) fusionnée. B4 a été réancrée sur ce commit et ne contient **que ses cinq fichiers propres**.

## Mesure initiale et catégories (index Git)

Le dépôt contient dans `docs/` **12 images suivies par Git : 11 SVG, pour 46 421 octets, et 1 WebP, pour 5 224 octets**. Total des images suivies : **51 645 octets**. Il ne s'agit pas de fichiers inutilisés. Chacun des 12 chemins est présent dans le précache PWA `CORE`.

Les icônes `docs/icon-192.png` et `docs/icon-512.png` sont différentes : elles sont **générées** par `tools/make-icons.mjs` et référencées par `docs/manifest.webmanifest` ainsi que par `docs/sw.js`. Elles ne sont pas suivies par Git. Leur absence avant génération dans un clone n'est donc **pas** une preuve d'obsolescence.

De nombreux sprites de Nhal et Veyr, y compris Sprite C, les ennemis, les murs, les sols et les interactions, sont construits en **JavaScript / SVG intégré** par des fournisseurs de sprites. Ils ne sont pas des images séparées à trouver parmi les SVG sur disque. En particulier, `docs/terrain-art.js`, `docs/hero-art.js`, `docs/enemy-art.js` et `docs/interaction-art.js` doivent rester dans le graphe des modules.

## Ce que mesure le script

`node tools/make-icons.mjs`  
`node tools/tech108b4-assets.mjs --check`

L'inventaire `tools/tech108b4-assets.mjs`, **en lecture seule**, produit un JSON déterministe :
- fichiers visuels suivis, poids et présence dans `CORE` ;
- références **textuelles** trouvées dans HTML, CSS, JS et manifeste (hors service worker), avec les chemins sources ;
- fichiers présents dans `CORE` mais sans mention textuelle apparente, étiquetés **« à investiguer »** et jamais « inutilisés » ;
- candidats fournisseurs de sprites intégrés au JS, détectés par heuristique textuelle ;
- deux icônes PNG générées, état des sorties, déclaration dans le manifeste et dans le cache ;
- chemins de précache manquants ou non résolus.

L'option `--check` échoue pour les chemins manquants, les visuels suivis absents de `CORE`, les deux PNG de build absents après génération, les icônes absentes du manifeste ou le script générateur introuvable/inattendu. Elle **ne supprime rien** et ne tente pas de réécrire les sources.

Le test `tests/tech108b4-assets.test.mjs` protège explicitement les 12 fichiers visuels, les deux PNG de build et les quatre fournisseurs de sprites de référence. Il est intégré à `npm run test:web` après la génération des icônes.

## Limites et prochaines décisions

Une référence textuelle ne garantit pas une utilisation en jeu ; son absence ne démontre **pas** qu'un fichier soit supprimable. Les chemins dynamiques, les SVG fabriqués à l'exécution, les scénarios historiques, le code Kotlin/APK, le cache PWA et les usages des tests doivent être examinés avant toute suppression. **B4 n'autorise aucune suppression de sprite, texture, icône, artwork, module ou documentation.**

La CI doit conserver quatre validations réussies sur le même HEAD : Web/Chromium, Chrome Android 13, APK classique et WebView moderne. La recette Android physique et les redémarrages hors ligne de TECH-108D ainsi que le suivi d'incident [#91](https://github.com/MAthiks/Rogov-Android/issues/91) restent ouverts.

**Invariants absolus :** sauvegarde `rogov-web-v1`, compatibilité PWA/APK, gameplay et RNG, visibilité/brouillard, Sprite C et visuels déjà approuvés.
