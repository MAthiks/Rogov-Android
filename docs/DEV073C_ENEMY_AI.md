# ROGOV — DEV-073C : intentions ennemies et défense du Gardien

**Version web : Alpha v0.7d.**  
**Statut : prototype d'IA à valider par tests CI et recette Android.**

## Contrat de jeu

Le combat reste hybride, sur la carte. La cible n'a pas besoin d'être sélectionnée pour qu'un danger imminent soit signalé : une bannière synthétise les menaces qui peuvent frapper à la prochaine action. Les descriptions correspondent aux conditions réelles du moteur et sont recalculées après chaque tour.

### Gardien déchu — cycle annoncé

1. **PRÊT** : au CONTACT, le Gardien **arme son coup lourd**, sans infliger de dégâts lors de cette préparation. L'intention du panneau indique que le coup est en préparation.
2. **COUP LOURD IMMINENT** : après un tour de préparation, l'attaque suivante utilise les jets statistiques et ajoute un point de dégâts de base. Le joueur peut **esquiver, parer, bloquer, frapper en premier ou se replier**.
3. **INTERRUPTION** : si le héros sort du CONTACT avant la résolution, la préparation est perdue ; aucun jet de frappe n'est dépensé.
4. **GARDE HAUTE** : après sa frappe, le Gardien tient sa garde. Sur la première attaque du joueur **qui touche**, il effectue un jet de blocage fondé sur ses statistiques et son équipement. Une réussite absorbe une partie des dégâts et consomme la garde.
5. **REPRISE** : à la phase ennemie suivante, au CONTACT, il prépare une nouvelle attaque ; hors de portée, il retrouve un état normal.

Les trois états sérialisés sont **ready, winding, guarding**. Un état absent dans une ancienne sauvegarde est initialisé à ready lors de la migration. Les états inconnus sont refusés par la validation, sans suppression de la sauvegarde.

### Charognard

- À distance PROCHE et dans sa zone d'agression, l'intention **approche** avertit le joueur de son déplacement.
- Au CONTACT, l'intention **attaque de contact imminente** correspond au coup effectivement possible à la phase suivante.
- Le Charognard reste mobile, sans équiper fictivement un bouclier.

### Larve de faille

- À deux cases, sur un axe rectiligne dégagé, l'intention signale **une onde imminente** si le prochain tour est un multiple de trois.
- Hors de l'axe ou si un mur bloque, aucune attaque à distance n'est annoncée ni déclenchée.
- Au CONTACT, la Larve reste une menace de mêlée ; ses protections de Faille et jets utilisent toujours le modèle statistique.

## Lisibilité Android

- Les cartes de cibles signalent les menaces imminentes par « ⚠ » et un contour distinct.
- Une **bannière globale** présente les dangers du prochain tour, même si une autre cible est sélectionnée.
- Le panneau d'engagement distingue préparation, coup lourd imminent et garde haute par **libellé, couleurs et contexte** ; les couleurs seules ne portent pas l'information.
- Le journal distingue préparation, annulation d'attaque, attaque effective, garde réussie ou échouée.

## Compatibilité et limites

- Même clé de sauvegarde et schéma ; aucune création rétroactive de créatures.
- Le Rappel perd le sac entier mais conserve héros, coffre et XP. L'extraction reste identique.
- Le RNG continue d'être stocké par descente. Un coup annulé n'utilise aucun jet, une garde ne consomme pas de jet si le héros rate sa frappe.
- **Prototype ciblé** : seul le Gardien adopte une garde défensive ; les Charognards et Larves conservent leur comportement et leurs annonces cohérentes. Étendre les postures à d'autres ennemis seulement après validation des combats.

## Recette sur Samsung

1. Descendre dans Nhal, se mettre au CONTACT du Gardien et attendre un tour. Vérifier la préparation et l'absence de dégâts immédiats.
2. Attendre jusqu'à « coup lourd imminent », puis esquiver, parer ou bloquer. Tester plusieurs combats pour constater des réussites et des échecs statistiques.
3. Reculer d'une case libre pendant la préparation : confirmer que l'attaque est interrompue et que le journal le signale.
4. Après le coup lourd, attaquer le Gardien pendant sa « garde haute » : vérifier le message de garde et les dégâts résultants.
5. Tester la bannière de menaces, y compris avec une autre cible sélectionnée et en mode ASCII.
6. Vérifier le rythme de la Larve, le déplacement du Charognard, le retour à Veyr et la reprise après fermeture du navigateur.
7. Vérifier l'absence de débordement horizontal sur Android portrait et le comportement hors ligne.

**Le statut Alpha 8/10 ne pourra être envisagé qu'après les essais réels de la boucle d'extraction et les retours des joueurs.**
