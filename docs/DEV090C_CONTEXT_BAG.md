# ROGOV — DEV-090C : interactions proches et inventaire Android

**Statut : fusionné dans `main` via [PR #15](https://github.com/MAthiks/Rogov-Android/pull/15), le 18 novembre 2026.** Tests validés : Node **222/222**, Chromium mobile **21/21**, Chrome Android 13 et APK. Recette sur téléphone physique à confirmer.

## Constat

Les progrès du moteur d'exploration avaient multiplié les blocs indépendants (pièges, passages secrets, coffres, portes, sites, sac). Les actions et informations importantes restaient dispersées sous la carte. DEV-090A rapproche les déplacements et DEV-090B les combats ; DEV-090C poursuit ce travail en rassemblant les interactions locales et l'inventaire.

## Modifications

- **Panneau « À portée »** juste sous le combat : ne montre que les contrôles réellement pertinents autour du personnage. Le résumé ne contient que des catégories déjà détectées : Indice, Piège, Lieu, Coffre ou Porte.
- Les **portes** conservent deux actions distinctes (sélection gratuite, confirmation d'un tour) ; un bouton désactivé n'encombre plus la vue lorsqu'aucune porte n'est proche.
- Les **pièges, secrets, coffres et sites** gardent leurs textes d'avertissement, leurs exigences de portée, leurs coûts de tour et d'endurance, et leur confirmation explicite. Aucune action automatique.
- Un cinquième raccourci **À portée** est activé uniquement lorsqu'il existe une interaction. Il défile jusqu'à l'action sans dépenser de tour ; les anciens raccourcis Carte, Combat, Rapport, Sac restent identiques.
- **Sac repliable** accessible via le raccourci Sac : compte en direct sur 8 emplacements, indicateur de remplissage, état SAC PLEIN, objets regroupés par catégorie et avertissement sur la perte du butin lors du Rappel.
- Le coffre du refuge Veyr conserve son inventaire sélectionnable et sa logique de cases à cocher historiques. Les sauvegardes et le moteur ne sont pas modifiés.
- **Aucune fuite du brouillard de guerre** : le dock reprend exclusivement les indices déjà connus et les états des actions précédemment présents dans le DOM. Un passage secret non découvert reste inconnu.
- Compatible paysage/portrait, rendu SVG et ASCII, navigation clavier et PWA hors ligne. Cache service worker incrémenté.

## Tests de non-régression

- Contrôle statique de l'ordre des blocs, de l'unicité de tous les identifiants d'actions et des raccourcis.
- Scénarios Chromium mobile 360 px : sélection d'une porte gratuite puis ouverture/fermeture coûtant un tour, panneau qui reste fonctionnel après reload, absence de débordement.
- Sac plein : jauge 8/8, deux catégories d'objets, ouverture sans tour et contenu préservé après reload.
- Secret : indice visible dans le dock sans révéler les coordonnées du passage ; recherche payante d'un tour et sauvegarde valide.
- CI complète Node + Chromium, Chrome Android 13, APK historique de compatibilité. Recette sur téléphone physique recommandée après mise en ligne.

## Limites et suite

DEV-090C n'ajoute ni un nouveau système de butin ni des icônes de classes. **DEV-090D** pourra ensuite améliorer l'interface des équipements et des choix de préparation, avant reprise de **DEV-089D** (quatre familles architecturales).

## Test Android après fusion

Ouvrir **https://mathiks.github.io/Rogov-Android/** dans Chrome et actualiser. Faire une nouvelle descente : s'approcher d'un coffre, d'une porte ou d'un indice ; consulter le panneau À portée ; vérifier que les actions sont explicites, que le sac est accessible par son raccourci et qu'aucun tour ne passe en consultant l'interface. Les descentes déjà sauvegardées restent inchangées.
