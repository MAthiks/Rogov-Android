# ROGOV — GDD de combat tactique hybride v0.7

**Statut : conception approuvée le 17 novembre 2026 ; module de contrat DEV-070 implémenté et testé, interface/actions de combat non implémentées.**  
**Version jouable de référence : Web Alpha v0.6.1.**  
**Références d'intention :** Darkest Dungeon (pression tactique, choix et lecture des intentions), roguelike sur grille (exploration continue), extraction à risque (éviter un combat peut sauver l'équipement). Aucune copie d'UI, d'illustrations, de personnages ou de règles propriétaires.

## 1. Vision

Le joueur explore toujours Nhal sur la carte principale. **Il n'y a pas de transition vers une arène de combat séparée.** Une rencontre fait apparaître un **panneau tactique contextuel** associé à une cible identifiée. Le joueur peut combattre, se défendre, changer de position, utiliser un objet, attendre ou tenter le repli.

La décision importante est : « Cet affrontement vaut-il la peine de risquer mon sac ? » Le combat doit renforcer la boucle **Veyr → préparation → descente → butin → extraction ou Rappel → Veyr**, pas l'interrompre.

### Invariants intouchables

- Héros unique et persistent : identité, niveau, XP et connaissance ne disparaissent pas lors du Rappel.
- Mort / PV à zéro : **Rappel au refuge de Veyr**, perte intégrale de ce qui était transporté et ramassé durant cette descente ; coffre sécurisé intact.
- Extraction réussie : transfert intégral du sac de descente au coffre.
- Tour par tour sur grille ; pas de combat automatique en temps réel.
- HTML/CSS/JavaScript natif, commandes tactiles Android, mode graphique/ASCII, fonctionnement PWA hors ligne et sauvegardes locales.
- Les ennemis du jeu restent originaux à ROGOV ; inspiration lovecraftienne d'atmosphère, non reproduction de créatures d'œuvres existantes.

## 2. Engagement hybride et interface

1. Un ennemi **visible et sélectionné** devient la cible active. Le toucher pour inspecter doit rester possible sans coût de tour.
2. Le panneau apparaît lorsque le joueur sélectionne un ennemi, ou lorsqu'une menace proche justifie une alerte. Il ne masque pas la carte et peut se replier.
3. Afficher : cible, famille, PV, distance, arme portée, intention annoncée, état défensif du joueur et dernier résultat de combat.
4. Actions tactiques principales : **Attaquer**, **Esquiver**, **Parer / Bloquer**, **Reculer**. Les deux défenses seront distinctes dans le moteur ; un sous-choix peut éviter de multiplier les boutons.
5. Les commandes de déplacement ordinaires, soins, attente et journal restent disponibles. Aucune action n'exige d'ouvrir une autre page.
6. Sur Android portrait : zones tactiles confortables (environ 44 px minimum), texte lisible, hiérarchie carte > danger > options, couleur **et** icône/texte pour identifier les intentions.
7. Les commandes de clavier et le mode ASCII reflètent les mêmes règles et la même cible.

**Changement de règle voulu :** avancer vers un ennemi ne doit **plus** infliger automatiquement des dégâts. Un mouvement bloqué par un ennemi peut proposer « Attaquer » ou sélectionner la cible, **sans dépenser de tour ni blesser**. Les attaques sont explicites.

## 3. Distances et positionnement

Distance calculée sur grille orthogonale (Manhattan), en préservant les murs et la vérification de ligne de vue quand une capacité l'exige :

- **CONTACT :** case adjacente (distance 1), attaques de mêlée, parade et blocage.
- **PROCHE :** distances 2 ou 3 cases, opportunités de repositionnement ou capacités ayant cette portée.
- **LOIN :** distance de 4 cases ou plus, poursuite/évitement ; pas d'attaque de contact.

Ces seuils sont le point de départ du prototype ; ils doivent être testés, puis documentés si l'équilibrage les modifie. La distance seule n'autorise **pas** une attaque : portée de l'arme, obstacles et géométrie des compétences comptent.

## 4. Déroulement d'un tour

1. Le moteur expose les **intentions ennemies** lisibles avec les informations accessibles au héros (sans révéler de données secrètes).
2. Le joueur choisit une action. Chaque **action valide** consomme un tour ; une action impossible ou sans cible ne le consomme pas.
3. L'action du joueur s'applique : attaque explicite, soin, défense, déplacement, attente ou repli.
4. Les ennemis encore capables agissent selon leurs intentions/règles ; les défenses préparées peuvent réduire ou éviter l'attaque.
5. Le moteur publie des événements structurés au **Journal d'action**, met à jour PV, position, intentions et récompenses.
6. Si les PV atteignent zéro, exécuter le **Rappel** selon les règles persistantes. Si l'arche est atteinte, procéder à l'extraction comme auparavant.

Le système doit rester **déterministe en tests**. Si des jets aléatoires sont introduits ultérieurement, utiliser une source RNG injectée et des graines reproductibles.

## 5. Actions du joueur — définition MVP

| Action | Intention | Condition / effet attendu |
|---|---|---|
| **Attaquer** | Frapper la cible choisie | Cible hostile valide, arme et portée compatibles ; attaque explicite, consomme un tour |
| **Esquiver** | Éviter le coup annoncé | Déplacement court vers une case libre ou posture d'évitement selon l'implémentation retenue ; déjoue certaines attaques, pas toutes |
| **Parer** | Dévier une attaque de contact | Efficace selon le type d'arme et l'attaque annoncée ; ne doit pas contrer automatiquement les ondes surnaturelles |
| **Bloquer** | Amortir les dégâts | Défense plus stable, réduction partielle plutôt qu'annulation systématique ; contrepartie à équilibrer |
| **Reculer** | Rompre le contact | Tente un mouvement vers une case libre ; peut échouer si encerclé ou piégé |
| **Soin / Attendre** | Survivre / temporiser | Conservent leur coût d'un tour et permettent aux ennemis de réagir |

**À équilibrer pendant l'implémentation :** réduction chiffrée des dégâts, probabilités éventuelles, coûts d'endurance, malus d'encerclement, disponibilité de la parade selon l'équipement. Ne pas prétendre que ces valeurs sont déjà décidées ou programmées.

## 6. Intentions ennemies et créatures de référence

- **Charognard** : approche nerveuse, frappe courte ; annonce explicite « approche », « bond », « attaque ». Ennemi pour apprendre esquive/repli.
- **Gardien déchu** : tenue de position, **préparation visible** avant une attaque lourde de contact ; ennemi de référence pour parade/blocage/repositionnement.
- **Larve de faille** : conserve son identité de menace stationnaire et son onde en ligne droite à deux cases, tous les trois tours si le trajet est libre. L'interface indique **préparation / impulsion** avec un signe spectral distinct. Le repli hors de l'axe est la réponse principale.

Les comportements v0.6 (attaques adjacentes, onde de Larve) représentent **l'état actuel**, non les nouvelles intentions tactiques. La transition v0.7 doit être couverte par tests et ne pas rendre les anciennes sauvegardes injouables.

## 7. Journal de combat et lisibilité

Événements structurés : TOUR, CIBLE, INTENTION, ATTAQUE, ESQUIVE, PARADE, BLOCAGE, SOIN, DANGER, EXTRACTION, RAPPEL. Le joueur lit immédiatement *qui prépare quoi*, *ce qu'il a tenté* et *ce qui a réussi*. Les types s'ajoutent au journal existant sans le casser.

Le panneau présente la dernière action et le danger imminent, tandis que l'historique complet reste repliable. La palette sombre et les trois silhouettes de la bible visuelle v0.6 sont conservées.

## 8. Plan d'intégration sans régression

- **Lot 1 — Contrat de combat : TERMINÉ** dans `docs/combat.js` (distance, portée, sélection, intentions, états défensifs, tests). Aucun changement visuel ni modification des règles de combat en production.
- **Lot 2 — Panneau contextuel :** sélection / désélection, portée, intentions, contrôles mobiles. Aucune attaque implicite en touchant la carte.
- **Lot 3 — Actions explicites :** attaque, esquive, parade, blocage, repli ; suppression du coup automatique sur collision.
- **Lot 4 — IA et équilibrage :** intentions distinctes pour Charognard, Gardien et Larve ; journaux lisibles ; essais terrain sur Samsung.
- **Lot 5 — Livraison :** tests, sauvegarde, mode hors ligne, accessibilité, déploiement GitHub Pages.

**WIP maximal : 1 lot actif à la fois.** Ne pas ajouter d'inventaire complexe, d'effets de stress, de groupe à quatre personnages ni de génération procédurale dans cette évolution.

## 9. Tests d'acceptation

- Sélectionner ou inspecter une cible ne coûte aucun tour.
- Marcher contre un ennemi ne l'attaque plus.
- Attaquer sans cible/portée/ligne de vue échoue sans dégât.
- Les intentions sont visibles **avant** leur résolution.
- Une esquive/parade/blocage valide consomme son tour, protège selon des règles vérifiables et inscrit un événement.
- Le repli modifie la distance si la destination est libre ; une case bloquée n'autorise pas de mouvement.
- Une Larve conserve son axe d'onde et le mur bloque sa ligne de vue.
- Défaite => Rappel avec sac perdu, héros/XP/coffre préservés ; extraction => sac sécurisé.
- Ancienne sauvegarde v0.6.1 chargée sans perte de progression ni ennemis ajoutés rétroactivement.
- Rendu ASCII, graphique, tactile, clavier et PWA hors ligne restent jouables.
- Tests Node.js puis validation manuelle sur téléphone Android.

## 10. Décisions ouvertes

Équilibrage exact, coûts d'endurance, désengagement sous menace, calcul de la parade selon les armes et indication visuelle des attaques à aire d'effet seront tranchés **après** un prototype fonctionnel, pas imaginés comme livrés.

**Statut produit : ce document est le nouveau contrat de conception, pas un compte rendu de code déployé.**
