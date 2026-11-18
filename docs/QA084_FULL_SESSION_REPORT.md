# QA-084 — Première recette complète d'exploration ROGOV

**Date :** 18 novembre 2026  
**Périmètre :** DEV-080 → DEV-081 → DEV-082, branche expérimentale `dev/dev-082-secrets`.  
**Statut :** recette navigateur automatisée **validée**, recette sur téléphone physique **non effectuée**. PR #1/#2/#3 toujours en brouillon, `main`/v0.7f inchangés.

## Test de partie complète, depuis l'écran titre

La recette automatisée `QA-084 mobile: end-to-end two descents, discovered secret, public extraction and saved loot` utilise Chromium au format téléphone (360 × 780, commandes tactiles) et **l'interface réelle du jeu**, plutôt que de téléporter le personnage entre les salles.

Parcours réalisé :

1. Ouvrir le jeu, sélectionner l'épée au refuge, lancer la **première descente**.
2. Atteindre l'Arche par des mouvements tactiles, extraire, vérifier le coffre à Veyr.
3. Équiper l'épée, lancer une **deuxième descente** à carte 44 × 32, avec caméra 11 × 11.
4. Suivre des couloirs ordinaires jusqu'à un **Fragment de cendre**, ramassé normalement.
5. Explorer jusqu'à un indice local ; inspecter sans consommer de tour.
6. **Fouiller** : exactement un tour, mur transformé en passage praticable ; rendu graphique, ASCII et mini-carte cohérents.
7. Entrer, trouver le bandage caché ; entrer une seconde fois : **ni duplication de bandage ni XP supplémentaire**.
8. Recharger la page et poursuivre avec le passage révélé et le sac conservés.
9. Sur le trajet vers l'Arche, fermer une porte normale, vérifier qu'un pas contre elle ne coûte pas de tour, **recharger**, rouvrir et continuer.
10. Rejoindre l'Arche par la route publique, extraire, puis **recharger depuis l'écran titre** : épée, butin et nombre d'extractions préservés.

**59 mouvements tactiles de navigation au total** sur la recette réussie. La première route peut aussi ramasser un Fragment de cendre : le test utilise la valeur du coffre **après** le tutoriel comme référence ; le deuxième Fragment provient légitimement de la seconde descente.

## Résultats CI

- **181/181 tests Node : réussite** (moteur, statistiques, combats, génération, sauvegardes).
- **7/7 tests navigateur Chromium : réussite**, incluant cette nouvelle partie complète.
- **Rapport CI validé (code SHA `15f20045`) :** https://github.com/MAthiks/Rogov-Android/actions/runs/44266128653
- Les trois scénarios Chrome **Android 13 émulé** de DEV-080/081/082 avaient déjà réussi sur le code applicatif de référence : https://github.com/MAthiks/Rogov-Android/actions/runs/44251118876. Ce sont des validations distinctes, **pas** un passage physique du nouveau scénario QA-084 sur Android.

## QA-084B — Combat réel avec IA active et extraction

Deux validations complémentaires ont été ajoutées **sans supprimer ni affaiblir les ennemis générés** :

- **Moteur Node :** une deuxième descente générée conserve les trois ennemis initiaux. Le héros utilise son épée, approche normalement le Charognard, le sélectionne, le vainc en **2 attaques**, marche **52 cases**, récupère un Fragment de cendre et rejoint l'Arche avec les adversaires restants. Le coffre est vérifié après extraction et sauvegarde/rechargement.
- **Interface Chromium mobile 360 × 780 :** même scénario, avec **52 déplacements tactiles**, sélection de cible et attaques via les boutons réels, rechargement du jeu et vérification de la persistance du butin. **Les deux ennemis non combattus restent actifs.**
- **Réussite CI :** 181/181 tests Node et 7/7 tests Chromium, aucun échec ([workflow 44266128653](https://github.com/MAthiks/Rogov-Android/actions/runs/44266128653), SHA `15f200458d18fdf12c57c7a14784b15928482c71`).

Ce scénario teste une rencontre réelle, **pas** une exploration libre de toutes les variantes ennemies. Il ne remplace ni une longue session avec plusieurs rencontres, ni l'évaluation manuelle des dégâts, de la tension et de l'ergonomie sur Android physique.

## Limites importantes

Le premier parcours complet, celui des **deux descentes et du passage secret**, désactive les ennemis **uniquement dans sa sauvegarde temporaire de navigateur** afin d'isoler l'exploration. **Le code du jeu et les sauvegardes réelles ne sont pas modifiés.** Un **deuxième parcours séparé** conserve les trois ennemis actifs, combat un Charognard puis rejoint l'Arche avec les deux adversaires restants présents. La recette complète avec tous les dangers sur un **téléphone physique** reste nécessaire.

Le test n'évalue pas encore le confort des doigts, la lisibilité prolongée, les performances de la batterie, la tension des rencontres, ni le plaisir de rejouer.

**Critère de publication inchangé :** recette manuelle sur Android physique, avec captures/retours, validation des sauvegardes réelles et de l'extraction, avant toute fusion de PR. **DEV-083 (pièges)** reste en attente.
