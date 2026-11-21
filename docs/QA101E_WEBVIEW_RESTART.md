# QA-101E — Redémarrage réel de la WebView et inspection CDP

## Observation sur le commit fusionné

La PR GAME-101E #65 (commit source `d6e3252`) a réussi **4/4** validations, y compris l'APK WebView Android 13. Sur `main` (`f581082`), la suite Android WebView a confirmé que le stockage persistait après `am force-stop` / redémarrage : `savePresent=true`, `run=0`, titre **CONTINUER**, aucune alerte de sauvegarde invalide.

Le contrôle suivant appelait `Runtime.evaluate` avec `button.click()` **synchroniquement**. Sur l'émulateur à froid, le chargement de la scène Nhal a occupé le moteur de rendu plus longtemps que le délai fixe de 3,5 secondes et l'inspection CDP a expiré. Il n'est pas établi que le jeu soit en panne : le test a échoué **avant** de vérifier l'état visuel restauré.

## Correction ciblée

Programmer `button.click()` sur la prochaine tâche du navigateur (timer 0), en vérifiant préalablement la présence et l'activation du bouton. Cette commande CDP ne reste plus bloquée par le rendu synchrone. Le test **attend toujours** le jeu et l'expédition visibles (25 secondes maximum), 121 tuiles réelles, le tour et la descente conservés, le rechargement hors réseau, le sprite et les captures. Le moteur du jeu et les politiques de sauvegarde ne sont pas modifiés.

**Limites** : il s'agit d'une stabilisation de recette en émulateur, pas d'une correction de gameplay prouvée ni d'une validation du comportement sur téléphone physique. La CI Android reste bloquante ; aucun échec d'assertion métier ne doit être ignoré.
