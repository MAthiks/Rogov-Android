# DEV-086 — Pièges stratégiques des couloirs et coffres

**Statut : prototype de placement à tester ; branche dev/dev-086-corridor-chest-traps, sans modification de main.**
Suite au retour terrain : « Piège fonctionnel, il serait plus intéressant de les placer dans les couloirs où devant des coffres afin d'avoir un intérêt. »

## Objectif

Éviter les mécanismes isolés au milieu des salles : faire des pièges un choix visible dans les déplacements, l'accès au butin et le retour à l'Arche. Ne pas confondre « intérêt tactique » et « difficulté imposée ».

## Règles du nouveau placement

1. **Fil d'alarme : corridor réel entre deux salles.** Jamais sur un seuil, une porte ou un objet. La priorité est donnée aux couloirs qui appartiennent à un trajet naturel d'extraction ou de collecte. Le joueur peut suivre une autre liaison, fouiller ou désamorcer.
2. **Dalle instable : une case directement adjacente à un coffre profond** (Fragment de cendre ou tonique). Le coffre pédagogique de la salle de départ demeure sans dalle. Priorité à la case empruntée par le chemin direct vers ce coffre, sans piéger toutes ses approches.
3. **Indice atteignable** : chaque mécanisme dispose d'une case adjacente, visible une fois approchée, atteignable depuis l'entrée sans marcher sur un piège ou sur un ennemi.
4. **Placement combiné** : les deux cases sont considérées simultanément infranchissables avant acceptation du plan. Un retour sans combat et deux itinéraires indépendants depuis l'entrée et depuis chaque coffre restent disponibles, sans secret nécessaire.
5. **Aucune dégradation des règles DEV-083** : avertissement avant traversée volontaire, fouille, désamorçage statistique AGI/INT, déclenchement unique, expérience unique, indices et brouillard cohérents.
6. **Sauvegardes existantes intactes** : seules les nouvelles descentes profondes reçoivent les nouveaux placements. Les positions et états des pièges des runs entamés ne sont jamais recalculés.

Le générateur examine les emplacements candidats, privilégie la circulation naturelle, puis rejette toute paire pouvant rendre un piège obligatoire. En absence de paire sûre, il essaie une autre configuration déterministe : il ne force jamais un piège devant la seule issue.

## Critères QA

- 200 graines : fil sur véritable couloir, dalle exactement voisine d'un coffre profond, avertissement atteignable et deux retours sûrs même avec les deux cases bloquées.
- Pas de piège sous l'Égaré, un ennemi, une porte, un coffre, une faille, un secret ; pas de corruption de sauvegarde.
- Tests moteur existants : combat actif, coffres, failles, secrets, extraction, sauvegardes anciennes, RNG.
- PWA hors ligne : cache de version distinct ; interface ASCII, graphique, mini-carte et tactile en portrait.
- **Test réel Android avant fusion** : constater que le fil d'alarme se trouve dans un couloir et que la dalle offre un choix d'approche à un coffre profond, sans forcer le déclenchement.

## Essai isolé sur Android (Termux)

    pkg install -y git python
    git clone --depth 1 --branch dev/dev-086-corridor-chest-traps https://github.com/MAthiks/Rogov-Android.git rogov-dev086
    cd rogov-dev086
    python -m http.server 8771 --bind 127.0.0.1 --directory docs

Ouvrir **http://127.0.0.1:8771/** dans Chrome et lancer une nouvelle deuxième descente. Le port dédié évite de confondre les tests avec le site officiel.

**Déploiement :** aucun merge ni changement de main sans retour terrain. Le numéro DEV-086 désigne l'amélioration du placement, non un nouveau type de piège.
