# QA-096 — Recette visuelle et ergonomique Android

**Démarrage :** 19 novembre 2026. **Statut : EN COURS / NO-GO artistique.** Ce dossier ne certifie ni test physique ni satisfaction humaine.

## Contexte et invariants

Base `UI-096C` (PR #45) : carte de Nhal 11×11, cockpit tactique, silhouettes Sprite C et PJ encapuchonné quatre directions, coffres/pièges/intentions, refuge Veyr, sac et fiche unique. Ambiance **dark fantasy / low magic**, contraste Veyr (ambre) / Nhal (pierre froide). Ne pas modifier le moteur, le combat, les règles du Rappel, l'économie, le brouillard, les saves (`rogov-web-v1` / schéma 1), ASCII ou l'offline durant le recueil QA. Godot/PC reporté.

## Contrôle de publication (GitHub, 19 novembre)

Le commit `ed2459c` sur `main` a un workflow `ROGOV Web — Tests and GitHub Pages` réussi, dont le job `deploy` et l'étape `Deploy` sont en succès : [run 44629654676](https://github.com/MAthiks/Rogov-Android/actions/runs/44629654676). Le workflow APK de ce commit est également réussi : [run 44629654708](https://github.com/MAthiks/Rogov-Android/actions/runs/44629654708). Ces statuts attestent le déploiement et les tests automatisés, **pas le rendu sur un téléphone physique**.

## QA technique reproductible

La suite Playwright `tests/mobile-browser.test.mjs` contient un contrôle `QA-096` ajouté pour produire des preuves sur Chromium en **320×640**, **360×780**, **393×704** (DPR 3, tactile, portrait) :

- Capture **premier écran de Veyr** et **premier écran de Nhal** pour chaque format ; toutes les captures portent le préfixe `qa096-`.
- Vérification de l'absence de défilement horizontal, CTA de départ visible et quatre raccourcis du refuge ≥44 CSS px, six raccourcis de Nhal et boutons de commandes de terrain ≥44 CSS px.
- Carte graphique 11×11 non masquée par le dock, présence d'une seule silhouette Sprite C et image native 24×24, cellule affichée ≥16 CSS px (minimum mécanique ; à confirmer visuellement).
- Vérification du contraste texte/fond sur des éléments **à fond uni** (CTA, étiquette sécurisée, mission) selon un ratio WCAG ≥4,5. Les dégradés, illustrations, intentions et sprites exigent une observation humaine complémentaire.
- Journal JSON de géométrie (taille carte/case/commandes) + six PNG en artifact `qa096-chromium-portraits` de la validation PR. Ceci n'est **pas un test sur le Chrome du téléphone utilisateur**.

La couverture préexistante continue à vérifier les marqueurs d'intention visibles sans fuite de brouillard, portes, pièges, le mode ASCII, la reprise des sauvegardes, l'offline et les véritables actions/leurs coûts en tours.

## Recette physique à réaliser

Ouvrir la version [GitHub Pages](https://mathiks.github.io/Rogov-Android/) sur un **Android réel**, en Chrome puis si possible en PWA installée. Noter modèle, version Android, taille/zoom d'affichage, résolution CSS approximative, navigateur, présence de barre de navigation ou découpes d'écran. Ne pas effacer les données du site ni désinstaller la PWA avant le contrôle de reprise de sauvegarde.

1. **Veyr / premier regard (≤10 secondes) :** l'objectif, le coffre conservé, le bouton *Commencer une descente* sont-ils identifiables sans tutoriel ? Capturer l'écran.
2. **Veyr / gestes :** accéder à Préparer, Forge, Échos et Égaré, choisir un objet et sa quantité ; vérifier la jauge 0–8, la fiche unique et les valeurs de forge ; faire défiler derrière le CTA fixe, sans recouvrement gênant ni clic accidentel.
3. **Nhal / premier regard :** distinguer le PJ encapuchonné, le sol, le mur, la porte, le coffre, le piège révélé, l'Arche et la Faille. Vérifier le contraste à luminosité moyenne en conditions normales ; signaler chaque élément non identifiable sans zoom.
4. **Nhal / tactile :** marcher, attendre, soigner, ouvrir un panneau puis le fermer ; vérifier qu'aucun bouton ne se trouve sous la barre système, que la carte n'est pas masquée et que la menace/les intentions sont comprises **sans dépendre de la couleur seule**.
5. **Sécurité du jeu :** visiter les trois profondeurs si possible ; vérifier absence de divulgation du brouillard, extraction volontaire vs Rappel, coffre préservé, sac perdu en cas de Rappel, reprise après fermeture/rechargement et mode ASCII. Tester la reprise en PWA hors ligne après premier chargement réussi.
6. **Comparaison :** prendre une capture de Veyr et une de Nhal, si possible avec un ennemi visible. Comparer à `qa096-chromium-portraits` pour les proportions, le niveau de noir, le poids des panneaux, la taille des cellules et l'espacement du dock.

**Risque à observer en priorité :** en-dessous de 761 px de hauteur, le CSS réduit la carte à `30dvh` pour éviter qu'elle passe derrière le dock : ≈192 px de large sur 320×640, donc ≈17 px par case de 11. C'est un compromis de lisibilité **à juger sur téléphone** ; ne pas agrandir la carte au détriment de boutons tactiles accessibles sans preuve.

## Testeurs (5 personnes × 2 descentes)

Pour chaque participant, saisir sans l'aider : comprend le but en 30 s (oui/non), reconnaît au moins 4 des 5 catégories visuelles nécessaires sur le trajet (PJ, porte, ennemi, coffre/piège, issue), déclenche une action intentionnelle en ≤2 gestes, identifie au moins une menace et comprend le risque de perdre le sac. Après les deux descentes, poser **« As-tu envie de rejouer une autre descente ? »** (oui/non), noter durée approximative, erreurs, confusion, difficulté visuelle et suggestion libre.

**Critères GO conditionnels :** 5×2 descentes réellement observées ; au moins **4/5** répondent « oui » à l'envie de rejouer ; aucun défaut P0 (écran illisible, contrôle indispensable inaccessible, sauvegarde corrompue, brouillard dévoilé), et bugs P1 de lisibilité/ergonomie corrigés ou explicitement arbitrés. Après seulement, réévaluer l'Alpha 7,5/10 et la DA 6/10. La réussite CI seule **ne vaut pas GO**.

## Registre de constats

| Priorité | Observation | État | Preuve attendue |
| --- | --- | --- | --- |
| P1 à examiner | Carte réduite à ~17–19 px/case sur écrans courts | Ouvert, pas encore défaut confirmé | Captures et manipulation 320×640 / 393×704 |
| P1 à examiner | Échelle et contraste des marqueurs ! / … / ▣ | Ouvert | Capture d'ennemi visible, compréhension sans légende |
| P1 à examiner | Densité/CTA fixe du refuge et navigation derrière celui-ci | Ouvert | Capture Veyr et interaction sur téléphone |
| P0 surveillance | Sauvegarde, ASCII, PWA hors ligne et brouillard | Couvert en automatisation ; essai réel requis | Reprise, mode hors ligne, exploration |

## Prochaine décision

Corriger les défauts révélés par les captures et les essais sur une branche UI/ART dédiée (WIP=1), relancer `test-web`, `android-web`, `build`, puis seulement acter GO/NO-GO. **Aucune nouvelle mécanique avant ce jalon.**
