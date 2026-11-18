# ROGOV — DEV-090A : refonte UI/UX du poste de pilotage Android

**Statut : fusionné dans `main` via [PR #13](https://github.com/MAthiks/Rogov-Android/pull/13) le 18 novembre 2026.** Les tests automatisés (220 moteur, 16 Chromium, Chrome Android 13 et APK) sont validés. La recette finale sur téléphone physique n'a pas encore été confirmée.

## Priorité de production

**DEV-089D (quatre secteurs graphiques) est mis en attente.** Le moteur a beaucoup gagné en profondeur ; l'étape prioritaire est de rendre le jeu **immédiatement compréhensible et confortable à jouer sur un téléphone en portrait**, sans toucher aux règles, à la génération ni aux sauvegardes.

## Objectif du premier lot : terrain et actions au même endroit

- **Carte en premier** : afficher les PV, l'endurance et l'information sur les menaces, puis le terrain sans faire défiler une fiche de personnage ou un rapport détaillé.
- **Commandes collées à la carte** : déplacer la croix directionnelle immédiatement sous le terrain, avec un bouton central **ATT.** pour attendre délibérément un tour. Les commandes restent de vrais boutons DOM avec leurs identifiants et raccourcis clavier historiques.
- **Soins d'urgence** : bandage et tonique à côté des déplacements (ou juste dessous en très petit écran), avec état activé/désactivé lié à l'inventaire et aux PV réels.
- **Raccourcis de navigation** : Carte, Combat, Rapport, Sac. Ils déplacent uniquement le défilement de l'écran, sans tirer de jet, révéler de cases cachées ou dépenser un tour. Rapport déploie sa section explicitement lorsqu'elle est disponible.
- **Informations secondaires non bloquantes** : détails de caractéristiques, rapport d'expédition et conseils restent disponibles plus bas ; la légende devient un panneau pliable, fermé par défaut.
- **En-tête de descente allégé** : le nom du jeu et les statistiques permanentes restent présents, mais utilisent moins de hauteur sur les écrans étroits.

## Accessibilité et contrat visuel

- Cibles tactiles de **44 pixels de hauteur minimum** pour les actions principales ; largeur adaptée et disposition des soins en deux colonnes sous la croix sur les téléphones de **370 px ou moins**.
- Aucun débordement horizontal à 360 px ; carte graphique et carte ASCII restent intégralement accessibles.
- Les flèches utilisent les attributs `data-direction` déjà associés au moteur. La nouvelle touche **ATT.** conserve `id="wait-btn"`, donc la même règle de coût en tour.
- Le mode ASCII, les textes de journal, les interactions de porte, coffre, piège, salle spéciale et combat restent inchangés.
- Les raccourcis n'activent aucune action tactique : en particulier **Combat** mène aux cibles ou à la fiche contextuelle déjà visible, sans sélectionner automatiquement un ennemi.
- Le brouillard n'est pas affecté et les informations inconnues ne sont pas révélées par l'interface.

## Validation

**Automatisée :** le workflow PR exécute les tests moteur existants, la suite Chromium mobile et des scénarios spécifiques DEV-090A : proximité carte/commandes, lisibilité 360 px, absence de défilement horizontal, coût nul des raccourcis, coût réel d'ATT., légende pliable, persistance du mode ASCII et compatibilité après rechargement.

**Recette physique recommandée :** tester sur un Android en portrait et, idéalement, sous 360 px de large :
1. Une nouvelle descente profonde : la carte, les PV, l'endurance, les déplacements et soins doivent être visibles et utilisables sans recherche de boutons.
2. Les quatre raccourcis, et vérifier qu'aucun tour ne passe.
3. Une attente depuis le centre de la croix, puis déplacement, ouverture d'une porte et désamorçage d'un piège.
4. Une cible visible : accès au combat sans masquer les informations essentielles.
5. Basculer en ASCII, jouer, recharger et vérifier la sauvegarde.
6. Parcourir l'écran avec TalkBack si disponible ; chaque commande possède un libellé.

## Tester cette version séparément du site public

Depuis Termux :

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-090a-mobile-cockpit https://github.com/MAthiks/Rogov-Android.git rogov-qa-090a
cd rogov-qa-090a
python -m http.server 8792 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8792/** dans Chrome. Le port séparé évite de mêler les sauvegardes de test avec la version officielle.

**À faire après ce lot, selon les retours :** écran de combat plus compact, inventaire en onglets, aide contextuelle, réglages de taille des contrôles, direction artistique de l'interface (icônes et panneaux) et enfin DEV-089D. Ces évolutions ne sont **pas déjà implémentées** par DEV-090A.
