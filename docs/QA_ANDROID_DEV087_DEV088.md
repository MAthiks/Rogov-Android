# ROGOV — Recette Android combinée DEV-087 + DEV-088

**Version de recette :** `dev/dev-088-extraction-decisions` (inclut DEV-087).
**Destination GitHub :** [PR #9](https://github.com/MAthiks/Rogov-Android/pull/9). La [PR #8](https://github.com/MAthiks/Rogov-Android/pull/8) reste indépendante et non fusionnée.
**Statut :** CI automatisée verte pour les deux PR ; recette Android réelle à confirmer avant fusion.

## Démarrage sur le téléphone

Installer Termux, puis exécuter :

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-088-extraction-decisions https://github.com/MAthiks/Rogov-Android.git rogov-qa-088
cd rogov-qa-088
python -m http.server 8788 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8788/** dans **Chrome sur le même appareil**. Garder Termux ouvert pendant le test.

Utiliser le **port 8788** pour isoler le stockage, le service worker et les sauvegardes du site public GitHub Pages et des précédents prototypes en port 8771. Aucune partie du site public n'est modifiée. N'utilise pas le bouton « Réinitialiser » de la version publique.

Si le répertoire `rogov-qa-088` existe déjà, ouvrir Termux et exécuter `cd rogov-qa-088 && git pull --ff-only && python -m http.server 8788 --bind 127.0.0.1 --directory docs`. En cas de service actif sur le port, arrêter le serveur antérieur par `Ctrl+C`.

## Procédure de recette — nouvelle deuxième descente

1. **Démarrage** : créer une partie de recette, terminer la première descente (intro) pour débloquer une deuxième descente profonde. Les sauvegardes antérieures sans `run.sites` ne sont volontairement pas enrichies.
2. **Brouillard** : avant d'explorer, ouvrir « Rapport d'expédition ». Il ne doit révéler ni Arche ni sites inconnus. La consultation ne modifie pas le nombre de tours.
3. **Atelier abandonné** : chercher le marqueur `a`, se placer sur sa case ou à côté, choisir **Fragment de cendre** ou **bandage**. Vérifier qu'il coûte un tour, que le butin entre dans le sac et que le site devient `v`.
4. **Chambre de l'Écho** : chercher `e`, choisir entre l'inscription (+1 XP) et la résonance (+2 XP, coût 2 END). Vérifier qu'une seule interaction est possible.
5. **Cache oubliée** : chercher `k`, prendre un tonique ou fragment. Vérifier l'objet et l'absence de seconde récompense.
6. **Carte et sauvegarde** : quitter vers l'écran titre sans réinitialiser, puis reprendre la partie. Les lieux visités restent `v`; le sac, les XP, le choix exclusif et les ennemis restent cohérents. Le rapport conserve les bons compteurs sans rien stocker en plus.
7. **Extraction** : découvrir l'Arche `E`, rouvrir le rapport. Si le chemin de retour n'est pas intégralement connu, il doit l'indiquer ; s'il est connu, il affiche un nombre indicatif de cases, sans automatiser les déplacements. Atteindre `E` pour sécuriser le butin à Veyr.
8. **Régressions** : tester un coffre, un piège de couloir, une porte et un déplacement tactile ; aucun mécanisme ne doit devenir obligatoire. La fuite, la mort/Rappel et l'extraction gardent leurs règles existantes.

## Validation attendue

Répondre avec **« DEV-087 et DEV-088 validés »** si les étapes ci-dessus fonctionnent, ou envoyer une capture et le dernier message affiché si une étape échoue.

**Ne pas fusionner tant que la validation réelle n'est pas communiquée.** Si validation réussie, fusionner d'abord la PR #8, puis actualiser la base de la PR #9 et relancer les contrôles CI sur le nouveau contexte de `main`.

## CI du dernier code vérifié

- DEV-087 PR #8 : Node/Chromium, Android 13 Chrome, APK historique tous réussis.
- DEV-088 PR #9 : Node/Chromium **210/210 + 11/11**, Android 13 Chrome, APK historique tous réussis.
- Le contrôle Android 13 s'exécute dans un émulateur CI ; il ne remplace pas le test sur le téléphone réel.
