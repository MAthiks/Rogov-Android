# DEV-081 — recette sur un téléphone Android réel

**État : non validé sur appareil physique.** La PR #2 est en brouillon et dépend de DEV-080 ; ce protocole n'autorise ni fusion ni publication.

## Essai séparé du site public et de DEV-080

- Version publique v0.7f : GitHub Pages, inchangée.
- DEV-080 sur Termux : port **8765**.
- DEV-081 sur Termux : port **8766** (origine et sauvegarde distinctes). Ne pas réutiliser 8765 pour DEV-081.
- Le test sur émulateur Android 13 et les tests Chromium/Node sont validés, mais ne remplacent **pas** les manipulations sur ton téléphone.

### Installation une seule fois (Termux)

Termux est disponible via [F-Droid](https://f-droid.org/packages/com.termux/). Dans Termux :

```sh
pkg update
pkg install -y git nodejs python
git clone --depth 1 --branch dev/dev-081-fog-los https://github.com/MAthiks/Rogov-Android.git rogov-dev081
cd rogov-dev081
node tools/make-icons.mjs
python -m http.server 8766 --bind 127.0.0.1 --directory docs
```

Laisser Termux ouvert, puis ouvrir **http://127.0.0.1:8766/** dans Chrome Android. Ne pas vider les données Chrome et ne pas tester sur le site GitHub Pages.

Pour relancer un autre jour, entrer `cd ~/rogov-dev081`, puis exécuter `python -m http.server 8766 --bind 127.0.0.1 --directory docs`.

### Parcours physique à essayer

1. **Portrait :** les touches, la caméra et les panels sont lisibles ; aucune barre horizontale nécessaire.
2. **Première descente :** ancienne petite carte intacte. Effectuer un Rappel ou une extraction pour débloquer la seconde.
3. **Seconde descente :** grand donjon ; les cases non explorées sont noires, le voisinage visible est clair, la caméra se déplace.
4. **Porte :** s'approcher d'une porte ; la fermer (1 tour) masque la salle derrière ; l'ouvrir (1 tour) révèle l'intérieur. Une inspection de porte seule ne dépense pas de tour.
5. **Mémoire :** avancer puis reculer ; le sol déjà vu reste visible en grisé, sans créatures fantômes.
6. **ASCII :** mêmes cases découvertes et même caméra qu'en graphique ; le sol mémorisé est noté `:` et l'inconnu est vide.
7. **Plan repliable :** les zones inconnues et les ennemis hors vue ne doivent pas apparaître.
8. **Ennemis :** un adversaire éloigné ne figure plus dans les cibles ou menaces. Une fois visible, il peut être sélectionné ; après perte de visibilité, il ne doit plus pouvoir être attaqué.
9. **Sauvegarde :** recharger la page puis vérifier tours, porte, position, PV, sac et cases explorées.
10. **Hors ligne :** une fois l'application chargée et le service worker activé, stopper le serveur Termux avec Ctrl+C, activer le mode avion et recharger **la même adresse locale**. La descente doit se rouvrir avec son brouillard et ses découvertes.

**En cas de problème :** prendre une capture d'écran et noter l'action, l'étape et ce qui était attendu. Ne pas appuyer sur Réinitialiser et ne pas effacer les données Chrome. Relancer le serveur local avant de retenter une connexion en ligne.

**Critères de sortie :** aucune perte de sauvegarde, aucun ennemi ni trésor lointain révélé, extraction et Rappel inchangés, contrôles tactiles fiables, fonctionnement hors ligne vérifié. DEV-082 (passages secrets) vient après cette recette, sans fusion prématurée de DEV-080/081.
