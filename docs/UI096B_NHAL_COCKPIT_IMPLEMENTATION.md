# UI-096B — Premier lot de refonte réelle du cockpit Nhal

**État :** code fusionné dans `main` par [PR #42](https://github.com/MAthiks/Rogov-Android/pull/42), contrôles Web/Android automatisés réussis ; validation esthétique sur téléphone physique encore ouverte.  
**Date :** 19 novembre 2026.  
**Conception :** [UI-096](UI096_V3_VISUAL_MOCKUPS.md), [Nhal v2](UI096A_NHAL_V2_REVIEW.md).

## Objectif et livrable

Une première évolution **Android portrait**, sans modifier le comportement du dungeon crawler : enlever une partie de l'habillage violemment encadré, renforcer les contrastes fonctionnels, garder la grille 11×11 au premier plan et montrer les avertissements ennemis **déjà connus du joueur** sans obliger à ouvrir Combat.

Le lot ne remplace **pas** les sprites et tiles eux-mêmes : leur relecture visuelle est un chantier ART-096 distinct, soumis à validation de la lisibilité réelle.

### Fichiers et limites

- `docs/ui096.css` : CSS additionnel appliqué seulement à `max-width:730px` et `.frame.is-expedition`; couleurs pierre/ambre, HUD resserré, six raccourcis avec icônes de repérage et texte toujours présent, map à 43dvh sur écrans ordinaires, protection à 30dvh pour hauteurs jusqu'à 760px, tiroir/contextes et dock harmonisés. Aucun bouton réduit sous 44px.
- `docs/ui096.js` : `syncUi096Threat` lit **uniquement les DOM déjà rendus** `#threat-forecast` et `#threat-state`. Une menace imminente reprend mot pour mot la prévision existante (qui respecte `explorationState(...)=visible`). Sinon une simple mention de créature actuellement visible. En l'absence d'ennemi visible ou au refuge, le bandeau est caché. Aucune interrogation des entités, secrets, pièges ou cartes cachées.
- `docs/index.html` : un bandeau `#ui096-threat-banner`, initialement caché, sans bouton ni action ; liaison de la CSS additive.
- `docs/app.js` : synchronisation **en fin de `render()` seulement**, sans changement du moteur, du combat, de la sauvegarde, du RNG ou de la création des tours.
- `docs/sw.js` : cache PWA distinct, fichiers JS/CSS installables et disponibles hors connexion.

### Pourquoi ce choix minimal

Le travail UI-092A conserve les vrais éléments du DOM des panneaux et leurs vrais handlers ; une nouvelle navigation en parallèle risquerait de casser combat et inventaire. Ce lot **valorise l'existant avant de restructurer**. Le choix des boutons, polices et proportions n'est pas un aval artistique final ; c'est une base utilisable à tester.

## Régression validée en CI (19 novembre 2026)

1. Tests Node ciblés : aucun contenu d'ennemi invisible affiché, distinction menace visible vs imminente, absence d'effet sur les tours et les sauvegardes.
2. Tests Chromium à **320×640, 360×780 et 393×704** : aucune carte sous le dock, six raccourcis ≥44px, commande Attendre, ASCII, reprise après rechargement.
3. Test Chromium en situation réelle avec ennemi visible : bandeau d'alerte visible et ouverture du tiroir Combat sans tour gratuit.
4. Tests PWA offline + validation du cache, Chrome Android 13, build/signature/installation APK : **validés avant fusion**, avec **348 tests Node**, **44 scénarios Chromium mobile** et Chrome Android 13 réussi.
5. **Non remplaçable par CI :** photo/capture et test manuel sur téléphone Android physique, taille des sprites, aisance des gestes, compréhension des avertissements et 5 joueurs × 2 descentes. Ne pas attribuer une note artistique sur la base de CSS.

## Exclusions

Aucun nouvel ennemi, aucune animation de combat non autorisée, aucune action automatique, aucune modification des points de vie, des portées, du pathfinding, du brouillard de guerre, des sauvegardes, du mode ASCII, de la distribution du loot ou de la topologie. Veyr, le sac et la fiche personnage restent pour **UI-096C**, les sprites/tiles pour **ART-096**.

**Étape après validation :** tester visuellement le véritable rendu Nhal sur téléphone et décider des améliorations d'ART-096 ; adapter l'échelle et les encadrements sur preuve, pas sur rendu publicitaire.
