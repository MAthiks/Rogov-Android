# ROGOV — DEV-072 : combat tactique jouable (v0.7a)

**Statut : prototype de combat actif ; QA Android et IA avancée à compléter.**

## Règles livrées

| Action | Conditions | Coût | Effet |
|---|---|---|---|
| Sélection | Ennemi vivant sur carte ou bande de cibles ; marche dans sa case | 0 tour | Verrouille la cible, aucun dégât |
| Attaquer | Cible vivante sélectionnée, CONTACT (1 case) | 1 tour | 3 dégâts avec l'Épée usée, 2 sans arme ; ensuite réaction ennemie |
| Esquiver | En descente | 1 tour | Annule le premier coup de mêlée reçu pendant ce tour ; pas l'onde cosmique |
| Parer | Posséder l'Épée usée dans le sac | 1 tour | Réduit de 1 le premier coup de mêlée et inflige 1 dégât en riposte |
| Bloquer | En descente | 1 tour | Absorbe 1 dégât du premier coup, mêlée ou onde de Faille |
| Reculer | Cible vivante, case adjacente libre augmentant la distance | 1 tour | Repositionnement, puis réaction ennemie ; évite les failles mortelles |
| Soin/Attendre | Règles précédentes | 1 tour | Comportement v0.6 conservé |

Toute action invalide n'altère ni tour, ni PV, ni matériel. Les défenses ne durent que le tour joué et ne s'appliquent qu'à une première attaque compatible. Plusieurs adversaires restent dangereux.

## Contrôles

- **Sur téléphone :** toucher l'ennemi sur la carte (ou sa vignette dans la bande) puis toucher un bouton d'action.
- **Clavier :** C = cible suivante ; F = frapper ; E = esquiver ; P = parer ; B = bloquer ; R = reculer ; flèches/WASD = se déplacer ; espace = attendre ; 1/2 = soins.
- Parer est désactivé visuellement sans épée, Attaquer est désactivé hors du CONTACT.
- Les PV, distances et intentions du tour suivant restent visibles. Le journal signale les défenses, les ripostes et les dégâts.

## Invariants de sauvegarde

- **Clé** : rogov-web-v1 ; **schéma** : 1.
- Champs tactiques facultatifs (targetId, defense) ; une ancienne partie ne contenant pas ces champs reste valide.
- La mort déclenche le Rappel, détruit intégralement le sac de descente, mais préserve héros, XP et coffre.
- L'extraction transfère le sac au coffre et accorde les XP prévus.
- Aucun nouvel ennemi ne doit apparaître rétroactivement dans une ancienne descente.

## Tests importants

1. Marcher dans un ennemi le sélectionne sans perte de tour ni PV.
2. Attaque sans cible / hors CONTACT : impossible et gratuite.
3. Épée et mains nues ont des dégâts différents.
4. Esquive : zéro dégât au premier contact, mais l'onde cosmique reste dangereuse.
5. Parade : avec épée seulement, atténue le coup et riposte ; une riposte létale distribue l'XP.
6. Blocage : atténue un coup et peut absorber l'onde de Larve.
7. Le repli cherche une case sûre et ne traverse pas les créatures / murs / faille ; entouré, il échoue sans coût.
8. Plusieurs ennemis : une seule attaque est contrée par la défense préparée.
9. La mort au combat conserve le coffre et détruit le sac ; l'extraction garde le butin.
10. Une sauvegarde de la v0.6.1 se charge et continue à fonctionner.

## Risques ouverts

- Le Gardien frappe toujours immédiatement au contact (préparation d'attaque lourde à faire dans DEV-073).
- L'onde de Larve conserve son rythme du troisième tour ; les messages d'intention existent, mais ne remplacent pas une véritable télégraphie animée.
- L'équilibrage dégâts/défenses est provisoire. Il faut observer les combats sur Samsung avec plusieurs essais complets.
- Il reste nécessaire de recueillir des retours de vrais joueurs avant de qualifier l'alpha de 8/10.

**Le but de ce lot : des décisions tactiques concrètes, pas une nouvelle note de qualité attribuée sans preuve.**
