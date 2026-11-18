# QA-084 — Échec réel d'exploration : rencontres, coffres et failles

**État : échec terrain confirmé, correction expérimentale en [PR #4](https://github.com/MAthiks/Rogov-Android/pull/4) (brouillon), jamais publiée sur `main`.** Ne pas convertir cette PR en version publique avant une nouvelle session réelle.

## Signalement de l'utilisateur
> « OK le test est un échec aucun ennemie générer dans le donjon. Aucun coffre. Aucune faille. »

Le retour du joueur est prioritaire sur la réussite des tests automatisés précédents. Ceux-ci prouvaient que les listes de données existaient et que l'extraction était possible, **pas que la première salle de la grande descente montrait réellement ces éléments**.

## Diagnostic du code avant correction
- **Rencontres :** 3 adversaires sur 12 salles dans la carte profonde 44 × 32. Le brouillard de guerre pouvait maintenir un long secteur initial sans ennemi dans le champ de vision.
- **Coffres :** seulement 2 cases de butin `$` éloignées ; aucune interaction explicite « Ouvrir un coffre ».
- **Failles :** zéro case `^` créée par `docs/deep-dungeon.js`. Le pictogramme et la mécanique existaient dans l'ancienne carte, mais pas dans le nouveau générateur.
- **Défaut de QA :** scénarios moteur, brouillard et portes isolés, mais pas de garantie que les trois éléments soient présents à l'écran lors d'une véritable arrivée.

Ce constat ne prouve pas quelle URL ni quelle descente l'utilisateur testait ; le résultat terrain reste néanmoins invalide.

## Correctif expérimental
- **4 ennemis** par nouvelle grande descente, dont un Charognard à distance 4–5 dans la salle de départ, visible à travers le LOS normal (aucune fuite de brouillard).
- **3 coffres** par nouvelle grande descente, dont un bandage placé à distance 2–3 du départ. Graphisme de coffre fermé, coffre ouvert distinct, icônes ASCII `C` et `o`. Inspection libre, bouton tactile « Ouvrir le coffre voisin · 1 tour ». Marche sur la case = récupération alternative. Les deux voies utilisent `run.collected` comme unique garantie anti-duplication.
- **2 failles** `^` par carte, dont une dans la chambre de départ à distance 2–4. Elles restent visiblement dangereuses et entièrement évitables. Aucun secret, ennemi ou coffre n'est requis pour atteindre l'Arche.
- **Placement juste :** chacun des emplacements n'est accepté que si le retour normal par au moins deux itinéraires, la sortie sans combat imposé et l'accès au butin restent vrais.
- Les sauvegardes profondes **déjà commencées** (3 ennemis, 2 objets et zéro faille) restent chargeables et **ne sont pas modifiées rétroactivement**. La nouvelle génération s'applique à la **nouvelle descente profonde**.
- Cache hors ligne du prototype isolé : `rogov-v0.7f-qa084-encounters`.

## Tests indispensables avant validation
1. Graines déterministes, au moins **240 nouvelles grandes descentes** : quatre ennemis, trois coffres, deux failles et voies sûres.
2. Dès **l'arrivée** : un ennemi, un coffre et une faille **visibles** à l'écran 11×11 en mode graphique / ASCII, et dans la minimap découverte sans révélation de positions cachées.
3. Sur mobile, se déplacer à proximité du coffre, l'ouvrir en 1 tour, sauvegarder et recharger : le coffre reste ouvert, aucune duplication.
4. Marcher volontairement sur une faille : Rappel connu, perte du sac mais **coffre de Veyr et héros conservés**.
5. Parcourir une extraction normale en évitant failles et ennemis, puis refaire une descente : présence des trois types.
6. Vérifier que les anciennes sauvegardes et les passages secrets DEV-082 survivent à l'ajout.

## Essai sur téléphone réel, isolé des autres versions

Utiliser le terminal Termux depuis sa source officielle :

```sh
pkg update
pkg install -y git nodejs python
git clone --depth 1 --branch qa/qa-084-encounters-chests-rifts https://github.com/MAthiks/Rogov-Android.git rogov-qa084
cd rogov-qa084
node tools/make-icons.mjs
python -m http.server 8768 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8768/** dans **Chrome Android**. Le port 8768 est différent des essais DEV-080/081/082 ; il ne touche ni au site public GitHub Pages, ni aux sauvegardes sur les ports 8765/8766/8767.

**Attention :** la première descente est un tutoriel historique ; la **deuxième descente et les suivantes** utilisent le générateur profond corrigé. Les changements de génération ne s'appliquent jamais rétroactivement à une descente déjà commencée. Tester le premier écran de la **deuxième descente** : une créature, un coffre et une faille doivent déjà se voir sur les cases autour du héros.

En cas de défaut, noter l'URL exacte, le numéro de descente, l'état `graphique/ASCII`, faire une capture et ne pas effacer la sauvegarde du navigateur. Ne pas déclarer QA-084 validée sans test physique et retours du joueur.

**Statut de production :** les PR #1, #2, #3 et #4 restent en brouillon ; la version publique demeure v0.7f. DEV-083 toujours bloqué.
