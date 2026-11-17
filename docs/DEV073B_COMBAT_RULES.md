# ROGOV — DEV-073B : précision, critiques, défenses et Endurance

**Web Alpha v0.7c : premier moteur statistique.**  
**Statut : code à valider en CI et à tester sur Android avant toute note qualitative.**

## Modèle partagé

Héros et ennemis utilisent les mêmes attributs et bonus d'équipement pour toucher, esquiver, parer, bloquer, résister et infliger un critique. Une action tactique reste un choix actif, suivi d'un jet influencé par les deux profils.

## Jets reproductibles

- PRNG 32 bits déterministe avec état enregistré dans la descente (champ rngState).
- Graine propre à l'indice de descente. Un rechargement reprend exactement la suite des jets ; aucune utilisation de Math.random.
- Une ancienne sauvegarde sans graine reçoit une valeur dérivée de son numéro de descente, sans changer ses PV, tours, XP, objets ou ennemis.
- Une sélection ou action impossible ne consomme ni tour, ni Endurance, ni jet.

## Précision et critiques — chiffres provisoires

- Chance de toucher : arrondi de 35 + précision attaquant - 0,75 × esquive cible, borné entre 35 et 95 %.
- Un jet détermine la touche ; un autre, seulement si la touche réussit, détermine le critique.
- La chance de critique est issue de PER, AGI, arme et talent, plafonnée à 30 %.
- Dégâts physiques : épée 3, poings 2 avant force et armure. Le bonus de Force peut varier entre -1 et +3 ; critique ajoute environ 50 % au coup brut.
- Armure physique absorbe le plancher d'armure divisée par 3 (Gardien : -1 dégât).
- Une onde surnaturelle utilise la résistance occulte au lieu de l'armure.
- **Les ennemis utilisent eux aussi ces chances et peuvent manquer ou effectuer un critique.**

## Défenses actives — chiffres provisoires

La première attaque compatible et qui touche déclenche un jet de défense. Une réussite ou un échec consomme la posture choisie jusqu'au tour suivant.

- Esquive : 48 + aptitude d'esquive - malus lié à la précision adverse, bornée de 20 à 90 %. Réussite = annulation du coup de mêlée, pas des ondes.
- Parade : 49 + maîtrise de parade - malus lié à la Force adverse, bornée de 20 à 90 %. Arme de mêlée obligatoire ; réussite = mitigation et riposte.
- Blocage : 55 + maîtrise de blocage, bornée de 30 à 92 %. Réussite = absorption issue du bouclier ou d'une garde improvisée ; possible contre l'onde.
- En échec, les dégâts subis restent soumis aux protections ordinaires, mais ne sont pas annulés.

**Les profils des ennemis influencent leurs dégâts, chances de touche et critique, armure et résistance. L'IA n'utilise pas encore de postures de parade ou de blocage choisies : DEV-073C.**

## Endurance

- Endurance maximale de départ : 15 (depuis CON et AGI), distincte des PV.
- Attaquer : -1. Esquiver, Parer, Bloquer : -2.
- Attendre : +3. Se déplacer : +1. Soigner : +1.
- Coût insuffisant = action refusée sans dépense de tour ni de jet.
- Déplafonnement interdit : récupération au maximum dérivé, prévu pour l'équilibrage.

## Sauvegardes, Rappel et extraction

- Clé rogov-web-v1 et schéma 1 inchangés. Nouveaux champs facultatifs dans les anciennes sauvegardes, normalisés au chargement.
- Mort = Rappel à Veyr, sac perdu, coffre et héros conservés.
- Extraction réussie = contenu du sac déposé au coffre ; XP conservés.
- Aucune apparition rétroactive de créature dans une ancienne partie.

## Étape suivante

DEV-073C : télégraphie des intentions ennemies, choix défensifs des adversaires, équilibrage des statistiques, reprise de sauvegarde sur Samsung et test de runs complets. Les sorts et compétences de classe attendront une base de combat validée.
