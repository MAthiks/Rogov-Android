# GAME-101A — Écoute tactique des galeries (20 novembre 2026)

## Décision de design
Nhal dispose déjà d'étages, de caches, de pièges et de rencontres. Ce premier lot de gameplay après UI/ART-100 ajoute **une décision d'information contre du temps et de l'Endurance** plutôt qu'un bonus de dégâts ou un nouvel ennemi.

- **Écouter** dans une descente profonde : 1 tour entier, **−2 END** et une vraie phase ennemie ; pas de récupération d'Endurance gratuite.
- Sons calculés sur un chemin cardinal jusqu'à **8 unités acoustiques**. Sols ordinaires : 1 unité ; une porte fermée : 3 ; murs : infranchissables. Aucune transmission au travers des murs pleins.
- Ne considère que les ennemis actuellement **hors du champ de vision**. Résultat : direction cardinale approximative, distance qualitative et indication de pluralité ; jamais nom, coordonnées, salles, pièges ni butin.
- L'information reflète l'instant **avant** la phase ennemie : elle peut être périmée aussitôt que le tour a été joué. Les textes le rappellent.
- S'il n'y a pas de bruit détectable, le message souligne que ce n'est pas une garantie d'absence de danger.
- Aucune modification de carte, de mémoire FOV, de génération, de RNG de combat, du schéma de sauvegarde ni des états Sprite C. L'action est absente des anciennes descentes sans brouillard.

## Ergonomie
La touche d'écoute se trouve **dans la case libre en haut à droite du pavé directionnel**, sans agrandir le dock Android. Taille tactile au moins 44 px, indicateur de coût, désactivation si moins de 2 END, raccourci clavier **L**. Le résultat est lu en texte et dans le journal, y compris lorsque la phase ennemie produit un avertissement.

## Recette
1. Entrer dans une descente profonde (après la première descente), approcher d'une porte opaque avant une salle ennemie et toucher **ÉCOUTER**.
2. Vérifier 1 tour consommé, 2 END retirés, lecture d'une direction imprécise ou d'un silence prudent ; jamais de position précise.
3. Ouvrir la porte ou changer de couloir puis réécouter : la position révélée n'est pas « enregistrée » comme du terrain connu.
4. Essayer à 1 END : bouton inactif et aucun tour perdu ; attendre restaure l'Endurance selon la mécanique préexistante.
5. Basculer graphique/ASCII, sauvegarder, recharger, tester sur Android 320–393 px, hors ligne, avec et sans ennemi ; les anciennes sauvegardes restent valides.

**Tests automatisés** : calcul acoustique, portes/murs/LOS, absence de divulgâchage, invariants de temps/END/RNG/FOV/sauvegarde, bouton tactile et rechargement mobile. Le ressenti d'utilité et la fréquence des informations doivent encore être évalués sur un téléphone physique et en parties humaines ; les tests CI ne le remplacent pas.
