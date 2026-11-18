# DEV-082 — Cache et raccourci secrets facultatifs

**État : prototype expérimental en PR #3 (brouillon)**, empilé sur DEV-081 puis DEV-080. Ne pas fusionner ou publier avant recette physique validée des parents. La version publique **v0.7f reste inchangée**.

## Intention
Nhal récompense l'observation sans imposer de fouille répétitive ni cacher l'issue du donjon. Une nouvelle grande descente contient **un seul secret facultatif**, déterminé à partir de la carte déjà validée : raccourci si une paroi sépare deux sols ayant un long détour public ; sinon alcôve contenant une petite cache. La première descente et les sauvegardes de descentes anciennes **ne reçoivent aucun secret rétroactif**.

## Boucle d'exploration
- Indice **passif**, gratuit et uniquement lorsque la case d'indice est réellement visible : courant d'air, poussière anormale ou écho dans la pierre.
- Perception (PER) au moins 7 : indice lisible à distance maximale 3 plutôt que 2 ; PER faible **n'empêche jamais** la découverte.
- Lorsqu'il se place contre la paroi suspecte et voit l'indice, le héros peut confirmer **« Fouiller attentivement · 1 tour »**. La fouille déclenche la phase ennemie habituelle ; si le joueur n'est pas à portée, aucun tour n'est dépensé.
- Fouille réussie **déterministe** : pas de dé aléatoire ni de recharge pour relancer un jet. L'emplacement est le même pour une même carte et une même graine.
- Après révélation, un seul mur devient une case de sol praticable dans les deux sens. Le moteur conserve `run.secrets[].revealed`, `run.map` et la mémoire `run.exploration.seen`.
- En entrant sur la case, le joueur trouve **un bandage**, tant que son sac n'est pas plein. `claimed=true` empêche de dupliquer le butin ou l'XP ; avec un sac plein la cache reste à récupérer.
- Le symbole **?** identifie un passage révélé en ASCII et sur la mini-carte ; une illustration dédiée apparaît en mode graphique. Un mur non révélé reste exactement un mur dans les deux rendus et la mini-carte.

## Sécurité des donjons
- Génération des 12 salles, 34 portes et routes ordinaires **avant** le secret ; contrôle normal des deux retours et de l'extraction.
- Aucune serrure obligatoire, aucun piège, aucune fermeture d'un couloir ordinaire.
- Une ancienne partie active sans `run.secrets` est acceptée telle quelle.
- Les données de secret falsifiées sont refusées par le validateur des sauvegardes.
- Les monstres ne sont pas ajoutés dans le secret ; leur IA habituelle peut réagir à une fouille en 1 tour.

## Validation
- Tests Node couvrant au moins **240 graines**, des récompenses récoltées une seule fois, les sauvegardes falsifiées, les anciens états et un parcours d'extraction sans passage secret.
- Test Chromium portrait : indice, bouton de fouille, nouvelle case, récompense, rechargement.
- Test Chrome sous émulateur **Android 13** : interaction, progression, butin et reprise hors ligne.
- **Pas encore de test sur téléphone physique réel.**

## Recette physique isolée

Installer Termux depuis sa distribution officielle et utiliser un troisième port de test :

```sh
pkg update
pkg install -y git nodejs python
git clone --depth 1 --branch dev/dev-082-secrets https://github.com/MAthiks/Rogov-Android.git rogov-dev082
cd rogov-dev082
node tools/make-icons.mjs
python -m http.server 8767 --bind 127.0.0.1 --directory docs
```

Dans Chrome Android : **http://127.0.0.1:8767/**. Le port 8767 est séparé des ports 8765 (DEV-080) et 8766 (DEV-081) et ne touche pas à la sauvegarde du site public.

Vérifier que l'indice est découvert naturellement, que le bouton n'est disponible qu'à portée, que la fouille coûte **exactement 1 tour**, que la zone ouverte reste visible en mémoire, et qu'une seconde entrée dans la cache **ne redonne pas** de récompense. Recharger, recommencer hors ligne, puis atteindre l'Arche par le chemin habituel. Ne jamais effacer les données Chrome en cas d'échec ; enregistrer les étapes et une capture.

**Suite :** aucune progression vers DEV-083 tant que la recette des descentes DEV-080/081/082 n'est pas acceptée.
