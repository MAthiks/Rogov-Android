# ROGOV — VAR-077 : descentes procédurales sans difficulté factice

**Statut : prototype jouable dans l'Alpha Web v0.7e.**  
**Date : 18 novembre 2026.**  
**Canal : PWA / Android navigateur.**

## Objectif de conception

Le joueur doit décider **quelle route prendre, quel danger accepter et quand rentrer**. Le procédural n'a pas le droit de transformer la difficulté en piège arbitraire : pas de fermeture derrière le héros, pas d'extraction entourée d'obstacles mortels, pas de combat obligé faute d'autre passage, et pas de « bonne route » identique à répéter indéfiniment avec le même butin.

## Première livraison : ce qui est réellement implémenté

- La **première descente** garde la carte et les positions historiques pour servir d'introduction accessible.
- Dès la **deuxième descente**, chaque secteur est généré de façon déterministe à partir de son numéro : tracé des murs, position de l'Arche, deux objets et trois ennemis.
- Les motifs de structure sont des modules de ruines (quatre familles de formes), avec de petites obstructions variables. **Ce n'est pas encore un générateur de salles/donjons illimités**.
- Le Charognard est placé près du Fragment de cendre (deux cases maximum) ; le Gardien et la Larve protègent des zones secondaires. Le danger du butin devient **prévisible et optionnel**, pas obligatoire pour rejoindre l'Arche.
- Les failles mortelles sont posées **avant l'entrée** et ne se déplacent pas. Les sprites/ASCII et l'inspection affichent la vraie disposition.
- Le joueur peut toujours éviter l'affrontement pour **sortir sans butin** ; l'amélioration de la valeur de cette décision est prévue avec ECO-078.
- La disposition est enregistrée dans \`run.map\`, les objets dans \`run.loot\`, et les coordonnées ennemies dans \`run.enemies\`. La carte ne change pas après rechargement ; le RNG des combats reste distinct.
- Le Rappel continue de perdre l'intégralité du sac et l'extraction le dépose au coffre, sans modifier le schéma ni la clé de sauvegarde.

## Garde-fous automatiques

Pour chaque carte générée, le moteur vérifie les chemins sur la grille en évitant les murs et les failles :

1. **Départ → extraction** : il existe au moins deux itinéraires qui ne passent pas tous par un point de passage obligatoire (test de suppression de chaque case intérieure d'un chemin).
2. **Butin → extraction** : chaque objet bénéficie du même contrôle d'itinéraires alternatifs.
3. **Départ → extraction et butin → extraction sans combat** : il reste au moins un chemin praticable en traitant la position initiale des monstres comme un obstacle.
4. Les créatures ne sont pas générées près du point d'entrée (au moins quatre cases de Manhattan).
5. La carte est refusée si une configuration ne respecte pas ces contraintes. Le générateur essaie un autre motif déterministe, **jamais une difficulté injuste imposée**.
6. Chaque tuile de butin doit avoir un objet correspondant dans le registre enregistré.

La phase de QA balaie **120 numéros de descente** et vérifie ces règles. Les tests ne signifient pas que toutes les situations possibles pendant l'IA dynamique ont été résolues : un Charognard peut encore poursuivre et perturber un trajet, ce qui est un risque de combat lisible.

## Retour limité sans enfermement

Nous autorisons des détours, des alcôves et des itinéraires plus longs ; nous **n'ajoutons pas** de porte verrouillée, d'effondrement soudain ou de mécanique à sens unique dans ce lot. Réduire les possibilités de retour doit se faire d'abord par la **pression et la lisibilité** (danger local, coût de temps, choix d'un détour), pas en supprimant sans avertissement la seule sortie.

Toute future mécanique d'effondrement ou de voie à sens unique devra être annoncée **avant** l'engagement et accompagnée d'au moins une alternative connue, testée, ou d'un moyen de désengagement.

## Ce que ce lot ne résout pas encore

- L'utilité des Fragments de cendre à Veyr : **ECO-078**.
- La génération de brouillard de guerre, de salles multiétages et les interactions avec portes : non livrées.
- Le gain d'XP à l'extraction vide et le rapport risque/récompense : à équilibrer avec l'économie de refuge.
- La vérification manuelle du cheminement, des tuiles 24×24, des contrôles tactiles et des reprises de sauvegarde **sur Samsung**.
- L'évaluation de plaisir : **5 testeurs × 2 descentes**, puis mesurer si 4/5 souhaitent en faire une troisième.

## Critères de recette Android

1. Ouvrir une nouvelle partie : premier secteur identique à l'introduction, sauvegarde intacte.
2. Terminer ou subir le Rappel ; lors de la deuxième descente, vérifier **une autre disposition**.
3. Comparer la troisième descente avec la deuxième : différent emplacement d'extraction ou de butin, ennemis à d'autres positions.
4. Ramasser un Fragment de cendre, puis essayer de rentrer par deux chemins. Observer l'avertissement du Charognard et les possibilités de repli.
5. Fermer/recharger Chrome en cours de seconde descente : mêmes murs, objets, ennemis et coordonnées, sans apparition rétroactive.
6. Tester les modes graphique/ASCII, puis le hors-ligne après le premier chargement.
7. Noter toute impasse perçue comme injuste, tout chemin impossible à distinguer visuellement et tout déséquilibre de récompenses.

**La qualité visée 8/10 n'est pas déclarée atteinte tant que ECO-078 et la validation réelle du plaisir de jeu ne sont pas réussis.**
