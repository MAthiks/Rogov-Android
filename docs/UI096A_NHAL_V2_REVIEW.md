# ROGOV — UI-096A · Maquette Nhal, itération 2

**Date :** 19 novembre 2026.  
**Statut : PROPOSITION DE MAQUETTE — non approuvée, non intégrée au jeu.**  
**Origine :** demande de continuer les maquettes après la première planche UI-096 ; comparaison au cockpit réel `docs/ui092.js` / `docs/ui092.css` / `docs/index.html`.  
**Référence :** [UI-096 v0.1](UI096_V3_VISUAL_MOCKUPS.md) et [Sprite C](ART_DIRECTION_SPRITE_C_V1.md).

## Objectif de cette itération

L'itération 1 comportait de beaux détails mais une **carte trop encombrante verticalement**, un dock disproportionné et des affordances qui ne recouvraient pas toujours le jeu existant. L'itération 2 reste un **concept pixel-art illustratif**, pas un mockup à mesurer pixel par pixel ; elle restaure les **six raccourcis fonctionnels** et les contrôles de survie réels, à adapter pour les écrans de 320 à 393 CSS px.

**Décision proposée :** préserver l'identité Sprite C mais réduire les encadrements, rendre la menace immédiatement lisible, donner 55–60 % de l'attention visuelle à la carte, et séparer nettement commandes persistantes / panels facultatifs.

### Schéma fonctionnel — Android portrait 360×780

```text
┌──────────────────────────────────────┐
│ NHAL · PROFONDEUR 2/3       TOUR 48  │  ~36px
├──────────────────────────────────────┤
│ ♥ PV 12/16   END 11/20      SAC 5/8 │  ~52px
├──────────────────────────────────────┤
│                                      │
│         CARTE 11×11                  │  max ~340px
│    │░░│ pierre / brouillard          │  adapte hauteur
│    │🜁 │ PJ capuche, sans cadre vert  │
│    │⌂ │ ennemis seulement visibles   │
│                                      │
├──────────────────────────────────────┤
│ ⚠ GARDIEN · Coup lourd annoncé      │  ~36px
├──────────────────────────────────────┤
│ Carte Combat À portée Sac Rapport    │  ~48px
│                  Journal             │  visuel regroupé
├──────────────────────────────────────┤
│       ↑             Bandage          │
│    ←  ◷  →         Tonique           │  ~176px
│       ↓             Actions          │
└──────────────────────────────────────┘
```

Les libellés et chiffres ne sont que des **valeurs de démonstration** ; les valeurs du moteur doivent toujours gouverner l'affichage. `Actions` signifie **ouvrir le tiroir `jump-action`**, et non exécuter une action gratuite ou consommer un tour.

## Contraintes réelles relevées dans le dépôt

- `docs/ui092.js` référence `jump-map`, `jump-combat`, `jump-action`, `jump-report`, `jump-bag`, `jump-journal`, `jump-menu`. Le raccourci `À portée` est `jump-action` ; le dock affiche séparément les vraies commandes de mouvement, attente et soins.
- `docs/index.html` affiche le compteur `floor-depth`, `turns`, `bag-count`, deux jauges `health-meter` et `endurance-meter`, et l'état de menace `threat-state`. Aucune nouvelle métrique n'est nécessaire à la maquette.
- Une grille de six raccourcis est actuellement supportée ; à 320px, deux mots peuvent devenir trop petits. **Prototype à comparer :** six boutons avec libellés courts et pictogrammes vs quatre raccourcis visibles + panneau « Plus » avec accès au Rapport/Journal. Les deux restent des propositions, aucun flux d'action ne doit disparaître.
- `docs/ui092.css` limite déjà la largeur de la carte à `min(100%,42dvh,430px)`, puis `32dvh` lorsque la hauteur est ≤760px afin d'éviter que le dock masque le jeu. **Conserver impérativement ce garde-fou** ; ne pas recopier les proportions de l'illustration tels quels.
- Les commandes de déplacement et de soin ont aujourd'hui des cibles ≥44 CSS px et un dock mesuré par `ResizeObserver`. Les tiroirs déplacent les nœuds DOM existants sans changer d'handler : la refonte doit les **habiller**, pas les dupliquer.
- `#tile-map` doit conserver la carte 11×11 et le brouillard de guerre réel ; la maquette représentative peut montrer plusieurs salles, mais la PWA ne peut afficher que les cases que le moteur rend visibles.
- Conserver `#dungeon-map` ASCII, les sauvegardes `rogov-web-v1`, schéma 1, les attaques annoncées au prochain tour, le ciblage qui ne consomme pas de tour et les commandes réelles d'esquive/parade/blocage/repli.

## Direction graphique proposée

- **L'Égaré** : capuche gris prune relevée dans les quatre directions ; visage clair, silhouette compacte, aucun cadre fluorescent persistant.
- **Gardien déchu** : lourde armure de pierre, signe de coup lourd **distinct du simple marqueur de sélection** ; avertissement seulement si l'ennemi est réellement visible et menaçant.
- **Larve de faille** : corps bas segmenté, signature organique différente du Charognard.
- **Arche vs Faille** : l'Arche doit être une **porte architecturale turquoise**, la Faille une **fracture du sol vert malade**. Jamais une simple variation de couleur du même pictogramme.
- **Environnement** : murs riches en silhouette et relief, **sols moins contrastés que le PJ et les interactions** ; décorations sans effet sur collision ou ligne de vue.
- **HUD** : deux jauges compactes, menace sur une seule ligne, fonds anthracite et bordures pierre minces. Ambre pour le refuge/interaction sûre, rouge pour coup imminent, pas pour toutes les créatures.
- **Feedback** : pictogramme bref de préparation + distinction visuelle « menacé / frappe imminente » ; mouvement et soins ne doivent pas être cachés par des animations.

## Prochaines décisions visuelles

1. **Maquette mobile réaliste à 360×780** : travailler des tailles de boutons, de carte et de texte réellement intégrables, pas uniquement une peinture d'ambiance.
2. **Veyr** : proposition d'écran hub ambre/pierre, préparation primaire, coffre sécurisé, forge, dossier des Échos uniquement après révélation ; pas de nouveaux PNJ actifs.
3. **Comparatif avant/après sur captures du moteur** : tester 320×640, 360×780, 393×704 ; évaluer lisibilité du Gardien/Larve et « porte vs faille » à taille réelle avant de donner un GO à `UI-096B`.

### Politique d'implémentation

**Ne modifier aucune règle de gameplay** et ne pas annoncer ce rendu comme déjà en jeu. Garder un lot `UI-096B` unique pour les adaptations CSS/structure après validation de la maquette, et tester Node + Chromium tactile + Android 13 + APK + PWA hors ligne ; contrôle manuel sur téléphone physique toujours requis.

**Checkpoint de reprise :** `docs/UI096A_NHAL_V2_REVIEW.md` contient la proposition à affiner, `docs/UI096_V3_VISUAL_MOCKUPS.md` contient le cadrage global ; reprendre avec l'écran Veyr puis recueillir une validation sur les choix avant code.
