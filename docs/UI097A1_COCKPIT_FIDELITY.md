# UI-097A1 — Cockpit Nhal pierre/bronze sur Android

**Date :** 20 novembre 2026. **Statut :** lot en PR, non fusionné avant validation.  
**Base :** [UI-096D / PR #47](https://github.com/MAthiks/Rogov-Android/pull/47),
[ART-097A1 / PR #48](https://github.com/MAthiks/Rogov-Android/pull/48),
[ART-097A2 / PR #49](https://github.com/MAthiks/Rogov-Android/pull/49).  
**Référence :** maquette sombre haute fidélité fournie dans la conversation.

## Choix de production

L'écran cible 864×1536 illustre une **ambition graphique** ; une interface responsive
320×640, 360×780 ou 393×704 ne peut recevoir la même quantité de décoration
sans diminuer les cases de la carte ou cacher les commandes. Ce premier lot
réalise l'identité visuelle et la matière du cockpit **sans réorganiser les
raccourcis ni réduire les zones tactiles** ; le repositionnement des commandes
exigerait une recette géométrique séparée.

## Implémentation réelle

- `docs/ui097-nhal-frieze.svg` : paysage de ruines et clochetons original,
  simple illustration horizontale derrière le bandeau, sans objet de gameplay,
  aucune ressource extérieure, SVG statique.
- `docs/index.html` : une mention ROGOV décorative dans **l'en-tête Nhal existant**,
  les IDs des vrais boutons/états/carte restant uniques. Aucun second personnage
  ni second panneau fonctionnel.
- `docs/ui097a.css` : nouvelle palette pierre froide/bronze/ivoire (mobile et
  expédition uniquement), répartition visuelle du HUD en jauges santé/endurance
  et quatre données de run, frise, navigation tactique, bordure du donjon,
  alerte urgente et dock réel à fond sculpté. Les indications de menace restent
  des textes du moteur, jamais de nouvelles données calculées en CSS.
- `docs/sw.js` : noms versionnés et ressources ajoutées au précache pour la
  PWA hors ligne.
- `tests/ui097a1-cockpit.test.mjs` : dépendances et identifiants inchangés,
  ressources locales, sécurité du brouillard, compatibilité du contrat de
  sauvegarde et des contrôles existants.
- `package.json` : inclut le nouveau test dans `npm run test:web`.

## Invariants et limites

Le JS du moteur, `docs/tiles.js`, les sprites 24×24, carte 11×11, SVG
d'interaction, états, actions, tours, RNG, brouillard, extraction, rappel,
sauvegarde `rogov-web-v1` / schéma 1 et mode ASCII restent identiques.
Aucun effet de lumière par-dessus les cases inconnues.
Les contrôles restent les éléments existants et le dock fixe avec touches
≥44 CSS px ; le focus clavier et l'état actif sont conservés.
Les couleurs ne suffisent jamais à signaler un danger : le texte d'alerte
visible conserve la priorité.

## Recette avant fusion

1. `test-web` : Node + Playwright, captures 320×640 / 360×780 / 393×704,
   carte jamais recouverte par les commandes, pas de défilement horizontal,
   six raccourcis et pavé réel, mode ASCII.
2. `android-web` : Chrome Android 13 émulé et test des vrais clics.
3. `build` : APK signé, installé et lancé en émulateur.
4. Contrôle visuel humain sur les captures : branding et contraste, lecture
   des valeurs de PV/END, place donnée à la carte, coût en hauteur de la frise,
   absence d'écran fantôme.
5. Validation physique ultérieure sur Android personnel : luminosité normale,
   gestuelle, PWA offline et anciennes sauvegardes.
   **5 testeurs × 2 descentes** requis avant un GO artistique global.

**Priorité suivante :** UI-097A2, étude de hiérarchie carte/raccourcis/dock
avec mesure de chaque viewport puis ART-097B Sprite C/ennemis ; ne pas
fusionner de changement structurel sans QA.
