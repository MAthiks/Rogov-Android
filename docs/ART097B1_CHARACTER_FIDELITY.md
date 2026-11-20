# ART-097B1 — Personnages Sprite C, finition haute lisibilité 24×24

**Date :** 20 novembre 2026. **Statut : fusionné dans `main` via PR #52**, commit `58e981aa3617adae0cc665c4794a581bc9b9bcb5`. Recette physique ouverte.
**Référence :** [Direction artistique Sprite C](ART_DIRECTION_SPRITE_C_V1.md)
et maquette UI/ART-097 fournie dans la conversation.
**Base :** UI-097A2 (PR #51 fusionnée).

## Audit initial

Le moteur rend déjà 4 orientations du PJ `down/up/left/right` et trois
ennemis `charognard/guardian/rift_larva` via 7 SVG transparents originaux
24×24 encodés en data-URI. Le HUD d'intentions, les badges PV, l'état de
ciblage, le brouillard et les contrôles tactiles sont tous gérés hors de
ces SVG. Les ennemis n'apparaissent que s'ils sont réellement visibles.

À 220 px de carte (portrait 320×640), chaque case fait environ 20 px CSS :
on ne peut pas placer des détails fins de concept art sans brouiller la
silhouette. **La hiérarchie est silhouette > contraste > détail.**

## Modifications graphiques isolées

| Sprite existant | Détails de matière ajoutés | Invariant |
| --- | --- | --- |
| Sprite C, face | plis du manteau, petite attache cuivre, usure des bottes | capuche relevée, visage clair |
| Sprite C, dos | surpiqûre de cape, harnais croisé, mêmes bottes | arrière sans visage |
| Sprite C, gauche/droite | ourlet de cape et surplomb de capuche | miroir exact, silhouette cohérente |
| Charognard | plumes déchirées, barbes claires, rémiges usées | bec crochu, asymétrie basse |
| Gardien déchu | épaulières fendues, jambières lourdes et fente de casque | masse d'armes, grande largeur |
| Larve de faille | facettes chitineuses, épines dorsales et ombre ventrale | corps segmenté horizontal, point spectral discret |

Les couleurs restent désaturées, les highlights parcimonieux et **aucun
halo de joueur, animation, lueur sur tuile voisine, trait de danger ou effet
de particule** n'est créé. La maquette est une direction de qualité, pas un
atlas qui pourrait être collé tel quel sur des cases de 24 px.

## Fichiers

- `docs/hero-art.js` : sept ajouts graphiques ciblés dont le détail de
  semelles commun aux quatre vues ; clés identiques, données inchangées.
- `docs/enemy-art.js` : détails individuels ajoutés aux trois silhouettes.
- `tests/art097b1-character-polish.test.mjs` : 7 ressources 24×24,
  transparence, marqueurs de silhouette, clés, orientations, sauvegardes,
  brouillard et précache local.
- `tests/mobile-browser.test.mjs` : décodage image Chromium des 7 sprites,
  planche de contrôle à 24 px natifs et 60 px nearest-neighbor
  `qa096-screenshots/art097b1-seven-character-views.png`, sans tour dépensé
  ni écriture de sauvegarde. Régressions historiques de FOV et ciblage conservées.
- `docs/sw.js` : version de cache renouvelée pour déployer les nouveaux
  sprites dans la PWA hors ligne.
- `package.json`, `ROADMAP.md` et checkpoint mis à jour.

## Contrat

Aucune modification de `docs/game.js`, `docs/combat.js`,
`docs/enemy-ai.js`, `docs/tiles.js`, `docs/dungeon.js`,
`docs/app.js` ni des styles de carte. RNG, tours, dégâts, PV, IA,
navigation, SVG de terrain et carte 11×11 inchangés. `SAVE_KEY` demeure
`rogov-web-v1`, schéma 1 ; ASCII et mode PWA offline conservés.

## Critères avant fusion

1. `test-web` : Node, 7 assets, portraits Chromium 320×640,
   360×780 et 393×704, galerie 24px/60px; aucun indice caché révélé.
2. `android-web` : Chrome Android 13 émulé.
3. `build` : APK signé, installé et lancé en émulateur.
4. Inspection humaine de la galerie : capuche visible, Larve distincte du
   Charognard, Gardien distinct du PJ, absence de halo ou confusion avec
   la porte, l'Arche ou les alertes. Les nouveaux détails restent lisibles.
5. Test esthétique et gestuel sur **téléphone Android physique** et campagne
   **5 testeurs × 2 descentes** restent nécessaires au GO artistique.

**Suite : ART-097B2** éventuelles poses/animations pixel art à budget Android
fixé, uniquement après revue de ce lot ; **ART-097C** ambiance/éclairages à
coût faible. Aucune nouvelle mécanique.

## Bilan de livraison — PR #52

**Validation automatisée complète : 378/378 tests Node, 57/57 tests Chromium**, Chrome Android 13 et compilation/signature/installation/lancement APK sur émulateur réussis. Une assertion de cache héritée de UI-097A2 a été rendue compatible avec les versions suivantes ; aucune logique du moteur modifiée.

Les captures Chromium en 320×640, 360×780 et 393×704 montrent toujours le donjon entier, les raccourcis et le pavé accessibles. La planche `art097b1-seven-character-views.png` (artefact `qa096-chromium-portraits`, run `44687908197`) a été inspectée : les quatre capuches conservent la même identité et les trois ennemis ont des silhouettes distinctes. Ces constats restent limités à des captures d'émulateur Chromium.

**Non effectué :** recette sur un téléphone Android physique, validation artistique finale, animations et campagne de cinq testeurs × deux descentes. Ne pas rehausser la note DA provisoire sans retour humain.
