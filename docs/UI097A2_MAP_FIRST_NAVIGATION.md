# UI-097A2 — Carte d'abord, navigation tactique dessous

**Date :** 20 novembre 2026. **État :** branche/PR avant validation.
**Référence visuelle :** maquette dark fantasy mobile ROGOV fournie lors
de UI/ART-097. **Base :** UI-097A1 / PR #50 fusionnée, main `44a4a9f`.

## Diagnostic

Sur Android, `#expedition-shortcuts` occupait une ligne entre les statistiques
de descente et la carte. La maquette place les six accès **sous la carte**,
suivis des commandes. Le bandeau de danger n'apparaît que pour une intention
imminente déjà calculée à partir des adversaires **visibles** par le moteur.
Il était lui aussi au-dessus de la carte.

Une réorganisation purement CSS de toute la page `#expedition` obligerait à
réordonner de nombreux panneaux cachés et pourrait casser les tiroirs.
La méthode retenue est un petit adaptateur **DOM presentation only**.

## Implémentation

- `docs/ui097a2.js` : déplace sur `max-width:730px` les **deux éléments
  originaux**, `#ui096-threat-banner` et `#expedition-shortcuts`, juste après
  `#dungeon-map` (et donc après la carte graphique `#tile-map`). Aucun
  clonage : IDs, événements, états et contrôleurs `ui092`/`ui096`
  restent les mêmes. Deux commentaires marquent les emplacements d'origine.
  En repassant en desktop, restaure le DOM et l'ordre clavier précédents.
- `docs/ui097a2.css` : six vraies cibles `≥44 CSS px`, fond pierre/bronze,
  barre d'alerte dans l'espace prévu sous la carte, désactivation du
  `position:sticky` dans ce dock de navigation ; aucun overlay ni écran
  statique.
- `docs/app.js` : initialise une seule fois le petit adaptateur, sans
  traiter une action du jeu.
- `docs/index.html`, `docs/sw.js` : styles et adaptateur précachés
  et cache PWA versionné ; conservation du mode ASCII.
- `tests/ui097a2-map-first.test.mjs` : contrat des sélecteurs,
  restauration desktop, absence de mutation du moteur et cache offline.
- `tests/mobile-browser.test.mjs` : captures et mesures existantes
  complétées pour les 3 portraits, barre de menaces, vrais tiroirs, ASCII,
  absence de dépense de tour, nav sous carte et au-dessus du pavé.

## Invariants obligatoires

- Sprite C encapuchonné dans quatre directions, 24×24, carte 11×11.
- Aucun changement à `game.js`, `tiles.js`, moteur de combat,
  génération, FOV/brouillard, intentions, RNG, interactions ou équipement.
- Aucune fausse porte, coffre ou icône d'action et aucun piège secret révélé.
- Pas de changement à `SAVE_KEY=rogov-web-v1`, schéma 1.
- Le bouton Carte, Combat, À portée, Rapport, Sac, Journal, Menu et les
  boutons rapides sont les vrais éléments de jeu, avec leurs listeners.
- PWA hors ligne et APK Android, écran Veyr et desktop inchangés.
- Les menaces imminentes affichées restent exclusivement issues
  de l'ancienne logique `syncUi096Threat`.

## Gates

1. `test-web` : Node + Chromium 320×640, 360×780, 393×704,
   carte entière, navigation sous carte au-dessus du dock fixe.
2. `android-web` : Chrome Android 13 en émulateur.
3. `build` : compilation/signature/install/lancement APK sur émulateur.
4. Revoir les screenshots Chromium, y compris menace imminente.
5. **Validation tactile et esthétique sur téléphone physique non prétendue**
   sans retour utilisateur. Test multi-joueurs 5×2 descentes encore ouvert.

Ne fusionner que les validations de ce lot réussies. La reproduction
pixel-par-pixel de la maquette n'est pas atteignable à 24px/case et
320px de largeur ; privilégier carte, lisibilité, actions réelles.
