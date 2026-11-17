# ROGOV — ECO-078 : valeur du butin et forge de Veyr

**Version Web Alpha : v0.7f — première boucle économique jouable.**  
**Date de décision / livraison : 18 novembre 2026.**  
**Statut : prototype à équilibrer sur Android et avec de vrais joueurs.**

## Pourquoi cette mécanique existe

VAR-077 a apporté des itinéraires différents, mais une extraction sans danger demeurait moins intéressante que l'exploration. Le Fragment de cendre rapporté à Veyr n'avait pas d'utilité. ECO-078 le transforme en une **ressource de décision** : préparer une expédition plus sûre maintenant, ou économiser plusieurs descentes pour une meilleure arme, elle-même perdable si emportée dans Nhal.

Le joueur reste libre de fuir et d'extraire sans butin ; **aucune difficulté forcée** n'est ajoutée pour l'obliger à combattre ou dépenser.

## La forge — deux choix initiaux

| Fabrication | Coût au coffre | Résultat | Compromis |
|---|---|---|---|
| **Lame cendrée (Arme +1)** | 2 Fragments de cendre | 1 Lame cendrée | Puissante et durable si gardée au coffre ; **perdue au Rappel si emportée** |
| **Réserve de soins** | 1 Fragment de cendre | 2 Bandages | Matériel de soin plus modeste mais immédiatement utile |

Les recettes sont dans \`docs/economy.js\`. **Les fragments du sac ne sont jamais consommables à la forge** : seule l'extraction peut les déposer dans le coffre. La fabrication n'est autorisée qu'à Veyr, sans coût de tour, sans effet sur l'XP ou le numéro de descente et sans aléatoire.

### Lame cendrée

- Nouvel objet \`weapon.ashen_blade\`, obtenu uniquement par fabrication, **sans prérequis de possession de l'Épée usée** ; même un personnage ayant perdu son arme garde une possibilité de reconstruction par des descentes sans arme.
- Lorsqu'elle est emportée, la lame est automatiquement équipée comme arme principale. Si le joueur prend à la fois une Lame cendrée et une Épée usée, **la Lame cendrée est prioritaire**, les deux objets continuant à occuper deux places du sac.
- Dégâts de base **4** contre **3** pour l'Épée usée, avant les attributs du porteur, armure, défense et critique.
- Bonus dérivés : \`attack +2\`, \`accuracy +3\`, \`parry +7\`, \`critical +4\` contre \`attack +1\`, \`accuracy +1\`, \`parry +4\`, \`critical +1\` pour l'épée normale. **Ces valeurs sont expérimentales.**
- Attaque et parade utilisent le même moteur statistique et RNG reproductible que les autres armes.
- Le Rappel détruit tous les objets portés, **y compris la Lame cendrée** ; le héros et les armes déjà restées au coffre persistent.
- L'extraction rend au coffre la lame portée et le butin trouvé, sans duplication.

### Réserve de soins

- 1 Fragment permet de fabriquer **2 Bandages** supplémentaires au coffre (cumulables).
- Les Bandages doivent toujours être **sélectionnés et emportés** dans le sac de descente ; ils ne soignent pas magiquement depuis Veyr.
- Bandages perdus au Rappel s'ils étaient emportés, comme les autres objets.

## Interface du refuge

Le panneau **La forge des cendres** apparaît sous « Coffre sécurisé » : solde de fragments, deux recettes, leur coût et leur compromis, boutons tactiles de fabrication. Boutons désactivés tant que le nombre de fragments sécurisés est insuffisant.

Après fabrication, la liste du coffre et le nombre de fragments sont immédiatement actualisés. Le journal indique la dépense. Une sauvegarde locale est faite avant de lancer une nouvelle descente.

## Garde-fous, sauvegardes et tests

- **Clé** \`rogov-web-v1\` ; **schéma** \`1\` inchangés. Aucune nouvelle donnée obligatoire en migration : seules les nouvelles entrées d'objets apparaissent si fabriquées.
- Toutes les opérations sont validées avant copie de l'état ; une action impossible ne dépense rien, ne duplique rien et ne modifie pas le journal.
- Recharger la page n'annule pas la fabrication : les fragments consommés le restent, la lame ou les bandages ne sont pas recréés automatiquement.
- L'ancien équipement, la cible, les combats, les plans procéduraux et les récompenses d'extraction sont préservés.
- Tests automatiques couvrent frais de fabrication, doubles fabrications, ancien héros, parade, dégâts de l'arme, Rappel, extraction et interface PWA.

## Limites et travail futur

Cette livraison **ne constitue pas encore une économie complète** : seulement une ressource et deux recettes. Les coûts, la valeur réelle d'une arme perdable, la fréquence des fragments et l'équilibrage des soins doivent être confrontés aux retours des joueurs.

Il faut encore mesurer si le joueur se dit naturellement « je rentre avec un Fragment maintenant, ou je continue pour une récompense plus intéressante ? » et si le risque de perdre une Lame cendrée crée de la tension sans découragement.

**QA :** vérifier sur Samsung le panneau de forge, la sélection de la lame, une extraction avec arme, un Rappel avec perte de lame, et la reprise des sauvegardes. L'objectif Alpha 8/10 nécessite toujours deux sessions Android et cinq joueurs × deux descentes ; 4/5 doivent vouloir rejouer.
