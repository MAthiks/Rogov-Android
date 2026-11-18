# DEV-081 — Brouillard de guerre et mémoire des profondeurs de Nhal

**Statut : implémentation en PR #2 brouillon, empilée sur DEV-080 ; pas de publication sur main.**
**Bloquant :** la PR #1 (DEV-080) reste en recette sur téléphone Android physique. Ne pas fusionner DEV-081 avant acceptation de DEV-080.

Sources : [ROGOV_MASTER_PROMPT.md](ROGOV_MASTER_PROMPT.md), [GDD_EXPLORATION_NHAL_V0.8.md](GDD_EXPLORATION_NHAL_V0.8.md).

## Contrat de visibilité

Le brouillard n'est activé **que sur les nouvelles grandes descentes** (à partir de la deuxième descente) disposant de `run.exploration`.

- **Inconnu :** noir en mode graphique, espace vide en ASCII, et aucune donnée d'entité ou de tuile secrète dans le DOM.
- **Déjà vu :** architecture mémorisée, gris atténué dans les sprites, caractère `:` pour le sol en ASCII ; aucune ancienne position de créature.
- **Actuellement visible :** tuile, objet et éventuelle créature montrés en direct. Rayon euclidien de **5 cases**, mur et porte fermée opaques. Deux obstacles orthogonaux empêchent aussi le regard dans un angle diagonal fermé.
- Une porte fermée peut être reconnue elle-même, mais l'intérieur derrière elle n'est **pas révélé** tant qu'elle bloque la ligne de vue.
- L'inspection d'une case inconnue renvoie « Obscurité » ; l'inspection d'une case mémorisée ne redonne aucun PV ou renseignement d'ennemi.
- Ciblage, panneau tactique, décompte de menaces et intentions immédiates ne listent que les **ennemis visibles**. Une cible perdue de vue est retirée de la sélection à l'action suivante ; les attaques hors vue sont interdites.

## Sauvegardes et déterminisme

`run.exploration.seen` est un tableau d'entiers de cases visitées, **trié, sans doublons**, validé avant chargement. Les cases visibles sont recalculées à partir de la position et de l'état des portes. Elles deviennent définitivement connues après un déplacement valide ou une ouverture / fermeture. Une lecture ou une inspection ne consomme aucun tour et ne modifie pas l'exploration.

Les anciennes sauvegardes sans `run.exploration`, y compris les descentes profondes DEV-080 en cours, **conservent leur affichage complet** et n'ajoutent pas de brouillard rétroactif. `SAVE_KEY` et `SCHEMA_VERSION` restent inchangés.

La carte et l'extraction restent celles de DEV-080 : la vision ne ferme aucune route, ne crée aucune mort artificielle et ne modifie pas les récompenses.

## Mini-carte et modes de rendu

Le plan est **repliable**, calculé exclusivement avec les cases déjà connues, et ne répertorie pas les ennemis. La fenêtre de caméra reste **11×11** en graphique et ASCII et suit le héros. Le module `exploration-visibility.js` est préchargé par le service worker afin de préserver la reprise hors ligne.

## Recette attendue

1. Lancer la première descente et charger une vieille partie active : aucun brouillard rétroactif.
2. Entrer dans une nouvelle descente profonde : voir uniquement le voisinage.
3. Fermer une porte : voir la porte, jamais la salle derrière ; l'ouvrir permet de la découvrir. Refermer, s'éloigner, revenir : la mémoire subsiste.
4. Observer un Charognard, quitter son champ de vision : aucun marqueur de menace ni PV actuel dans la carte, la mini-carte, les choix de cible et le panneau d'information.
5. Comparer sprites, ASCII, inspection et mini-carte sur la même sauvegarde ; vérifier que les cases inconnues n'apparaissent pas dans les attributs d'accessibilité.
6. Recharger hors ligne une sauvegarde où plusieurs pièces sont déjà découvertes : même mémoire, sans apparition de créatures fantômes.
7. Confirmer que l'Arche reste atteignable par une route normale, que l'extraction sécurise le sac et que le Rappel en fait perdre le contenu.

**Limites :** pas de passage secret (DEV-082), pas de pièges (DEV-083), pas de mécanisme de lumière variable, pas de prétention à un test physique Samsung déjà réalisé. Le système est une nouvelle fonctionnalité expérimentale, pas une mise à jour publiée.
