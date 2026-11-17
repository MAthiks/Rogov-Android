# ROGOV — QA-074 : audit de l’objectif Alpha 8/10

**Date : 17 novembre 2026**  
**Référence produit : Web Alpha v0.7d**  
**Méthode : audit des sources de vérité, 10 tests supplémentaires de simulation et vérification CI.**  
**Verdict : objectif 8/10 NON VALIDÉ. Estimation interne prudente : entre 6,5 et 7/10, ce n’est pas une note de joueurs.**

## Périmètre effectivement vérifié

- La suite automatisée s’exécute : **129 tests réussis sur 129, 0 échec**, dont **10 tests d’audit supplémentaires** dans \`tests/qa-alpha-goal.test.mjs\`.
- Vérifiés par code ou exécution : sélection gratuite de cible, attack/defense explicites, télémétrie des intentions, contre-jeu du Gardien, RNG sauvegardé, compatibilité des anciennes sauvegardes, conséquences du Rappel, dépôt du sac à l’extraction, présence des contrôles tactiles et ressources PWA.
- Trois descentes simulées successives ont emprunté exactement le chemin \`up, right × 11, down\` depuis le point de départ (détail : \`up, right, right, right × 9, down\`). **Aucun dégât**, **trois extractions**, **trois Fragments de cendre** et **9 XP** au total, sans nécessité de combat.
- Deux descentes ont été comparées : carte, positions/types ennemis et butin initiaux **identiques**. Le RNG de combat varie par descente, mais pas le niveau.
- Une autre simulation confirme qu’emporter l’Épée usée n’est pas nécessaire sur le trajet sûr.
- La relique \`relic.ashen_fragment\` est récompensée dans le coffre, mais son usage n’est pas encore implémenté dans les règles de consommation ni dans le catalogue d’équipement.

**Ces tests prouvent des propriétés techniques et des faiblesses objectives de la boucle actuelle. Ils ne mesurent ni le plaisir ni la lisibilité réelle sur écran Android.**

## Grille d’acceptation issue de QUALITY_REVIEW_6_TO_8.md

| Axe contractuel | Statut | Motif |
|---|---|---|
| **A. Combat tactique** | **Partiel, avancé** | Cible sans tour, attaque explicite, défenses distinctes, intentions et repli programmés ; la compréhension du journal/choix par joueurs n’est pas démontrée |
| **B. Boucle et récompense** | **ÉCHEC du seuil 8/10** | Route d’extraction sans danger reproductible ; carte et rencontres initiales fixes ; butin relique sans usage |
| **C. Fiabilité et mobile** | **Automatisation réussie, validation mobile manquante** | Tests verts, Rappel/migration/extraction couverts ; zéro nouvelle session portrait Android réellement observée dans cette campagne |
| **D. Validation humaine** | **NON COMMENCÉE** | Aucun résultat de 5 testeurs × 2 descentes, aucun taux mesuré de 4/5 prêts à rejouer |

### Détail des garde-fous

- **A** : le moteur utilise des probabilités non déterministes du point de vue du joueur, mais reproductibles grâce à la graine stockée. Le Gardien prépare un coup lourd et peut être interrompu. Rien ne prouve encore que ses avertissements soient lisibles et amusants sur téléphone.
- **B** : éviter un combat est un choix tactique légitime. Le problème est le caractère **garanti et répétable** d’une route de butin/extraction, qui élimine tension et arbitrage. Le Fragment de cendre accroît un compteur mais ne modifie pas les options du joueur.
- **C** : les tests du modèle, du PWA et de l’interface reposent sur le code et des assertions, **pas sur une navigation de navigateur Android réel** ; ne pas les présenter comme une certification tactile/visuelle. Les sauvegardes conservées par les tests doivent aussi être vérifiées après mise à jour sur téléphone.
- **D** : une évaluation de 8/10 n’est pas crédible sans observations de joueurs. L’absence d’échantillon ne vaut ni succès ni échec utilisateur ; elle **bloque l’homologation**.

## Note provisoire de studio, non certifiée

| Domaine | Estimation d’audit | Raisonnement |
|---|---:|---|
| Concept et identité | 8/10 | Veyr/Nhal/Rappel, identité sombre, objectif lisible |
| Gameplay | 6/10 | Combat décisionnel enrichi, mais répétition sûre et récompenses sous-utilisées |
| Technique | 7/10 | 129 tests verts et migrations ; contrôle mobile réel absent |
| Direction artistique | 5/10 | Pas de nouvel essai visuel Android ou avec testeurs pour relever la note initiale |
| Production | 7/10 | Meilleur contrôle CI et documentation ; validation de terrain encore absente |

**Moyenne indicative : 6,6/10.** Cette moyenne n’est **pas** une mesure utilisateur et ne peut pas remplacer les critères obligatoires. Elle situe le projet **vers 6,5–7/10**, toujours sous le seuil visé.

## Décisions de priorité

1. **VAR-077 — Variété significative** : au minimum plusieurs agencements jouables et chemins d’extraction non garantis ; comparer au moins deux descentes avec situations tactiques distinctes. Veiller à garder une possibilité de fuite, sans imposer tous les combats.
2. **ECO-078 — Butin qui sert** : donner au Fragment de cendre au moins un choix concret au refuge (amélioration, artisanat, échange ou capacité), avec coût/opportunité ; conserver les risques du coffre/sac.
3. **QA-074 — Recette Samsung** : deux sessions portrait complètes (titre, Veyr, descente, combat, extraction, sauvegarde/reprise) et contrôle des avertissements/lisibilité/taille des touches/absence de débordement.
4. **Tests humains** : cinq joueurs sans aide, deux descentes chacun ; noter compréhension, risque perçu, frustration, bugs et désir de troisième descente. Exiger **au moins 4/5** volontaires pour rejouer.

### Décision finale

**Ne pas annoncer “Alpha 8/10”** sur la base de la quantité de tests ou des seules fonctions livrées. Maintenir la PWA publique comme prototype jouable ; privilégier variété et valeur du butin, puis les tests utilisateurs avant nouvelles classes ou nouveaux sorts.

## Évolution après l'audit — VAR-077 (18 novembre 2026)

Le constat de trois descentes identiques concernait la v0.7d. **La v0.7e corrige ce point en ajoutant des dispositions variables dès la deuxième descente** et en contrôlant les itinéraires d'extraction et de retour des zones de butin. Voir [VAR077_PROCEDURAL_NHAL.md](VAR077_PROCEDURAL_NHAL.md). Ce premier lot ne change pas le verdict historique sur l'économie insuffisante, la validation Android ou les essais joueurs : **8/10 toujours non homologué**.
