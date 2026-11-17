# ROGOV — Prompt de développement v0.6 (implémenté)

## Rôle

Agir comme une équipe de game design, direction artistique, programmation JavaScript native et QA Android. Construire une identité visuelle originale d'horreur cosmique pour ROGOV, compatible avec les règles de survie/extraction, sans copier de créatures spécifiques ni de ressources d'autres jeux.

## Source de vérité

- Dépôt : https://github.com/MAthiks/Rogov-Android
- Site : https://mathiks.github.io/Rogov-Android/
- Bible graphique : docs/VISUAL_BIBLE_V0.6.md
- Code : docs/game.js, docs/tiles.js, docs/app.js, docs/index.html, docs/style.css
- Tests : tests/web-game.test.mjs

## Fonctionnalités

**v0.6a — unité graphique :**
1. Conserver le jeu en SVG originaux 24×24, fond minéral sombre, accents sémantiques.
2. Refaire Charognard et Gardien déchu, et harmoniser sol, mur, faille et arche.
3. Assurer une distinction nette joueur / danger / butin / ennemi en une seconde sur écran Android.
4. Conserver le bouton graphique/ASCII, la légende et le panneau d'inspection.

**v0.6b — Larve de faille :**
1. Ajouter rift_larva avec identifiant stable, symbole ASCII « L », 4 PV, 1 dégât, 3 XP.
2. Dessiner une silhouette asymétrique spectrale, distincte de l'arche d'extraction.
3. Implémenter l'attaque spéciale : onde en ligne droite exactement à 2 cases, uniquement tous les 3 tours ; un mur central interrompt l'onde.
4. Au contact, la Larve peut frapper ; elle ne doit jamais poursuivre le héros.
5. Ajouter une seule Larve aux nouvelles descentes, sans altérer les expéditions sauvegardées.

## Invariants à maintenir

- Jamais d'APK obligatoire ni de réseau pendant la partie.
- La mort déclenche le Rappel vers Veyr, perd le sac, mais conserve le héros, les niveaux, l'XP et le coffre.
- L'extraction sécurise uniquement les objets ramenés.
- La clé de sauvegarde rogov-web-v1 et le schéma 1 sont conservés.
- Les affrontements prennent un tour ; les soins et l'attente aussi.
- Les matériaux et symboles restent lisibles en petit et sont identifiables autrement que par leur couleur.
- Un nouvel ennemi ne doit pas apparaître rétroactivement dans une descente commencée avant la mise à jour.

## Fichiers livrés

- docs/game.js — type Larve, IA et événements de combat
- docs/tiles.js — sprites et légende v0.6
- docs/index.html — version et aide de gameplay
- docs/style.css — accents lisibles des trois ennemis
- docs/sw.js — nouveau cache PWA versionné
- tests/web-game.test.mjs — tests de la Larve et des anciennes sauvegardes
- docs/VISUAL_BIBLE_V0.6.md — direction artistique

## Validation

Effectuer npm run check:web et npm run test:web, puis vérifier le déploiement GitHub Pages.

Cas clés : silhouettes dans les sprites et légende ; nouvelle Larve ; attaque au tour 3 ; absence de dégâts en diagonale/derrière mur ; mort au combat ; butin ; extraction ; sauvegarde v0.5.1 en cours ; commande tactile, ASCII, mode hors ligne.

## Limites

Ne pas ajouter de quatrième ennemi ou d'objets inventés dans cette version. Ne pas changer la carte, le refuge ou la boucle d'extraction.
