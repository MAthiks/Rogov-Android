# GAME-095D3 — Audit des expéditions, ressources et risque réel

**Plateforme active : Android PWA / APK.** Portage PC / Godot maintenu dans le GDD, sans changement de moteur. Lot d'instrumentation **uniquement**, sans modification du gameplay, des sauvegardes ni de l'interface.

## Pourquoi ce chantier

- D1 mesurait la génération de 300 cartes et des duels **isolés**, sans trajet ni continuité des PV et du sac.
- D2 a ajouté une riposte d'esquive et l'échange du coffre à huit places ; leur intérêt doit être mesuré dans une expédition entière.
- D3 introduit donc un **simulateur d'actions réelles** contre le moteur publié : marche, ouverture des portes, combat, défense, soins, équipement, coffres, extraction et descente. Aucun déplacement instantané de l'Égaré après le départ.

## Protocole

Exécution : npm run audit:expeditions, ou
node tools/expedition-audit.mjs --count 20 --start 2 --max-actions 440.

Pour chacune des mêmes graines d'expédition, comparer :

1. **exit_only** : privilégie la route vers l'Arche, soigne les blessures importantes, combat les adversaires adjacents et poursuit tant que son état le permet.
2. **scavenge** : suit des détours vers les coffres disponibles, équipe les pièces sans emplacement occupé, peut échanger au coffre à sac plein, utilise les consommables et peut esquiver les coups lourds annoncés du Gardien.

Les deux scénarios partent avec **une épée usée et deux bandages**, possédés réellement par l'Égaré à Veyr. Chaque déplacement, ouverture de porte/coffre, coup, soin, esquive, échange et transition d'étage appelle l'API de gameplay ; chacun déclenche la réaction ennemie et le coût de tour correspondant. Les cartes, ennemis, pièges et coffres proviennent de l'authentique générateur. Le sac est contrôlé à huit places au maximum.

L'itinéraire utilise toutefois la **carte complète générée** (un *oracle géométrique*), y compris des coffres et portes qu'un joueur n'aurait pas encore découverts. Il ne prévisualise pas les récompenses avant ouverture. Cette information supérieure au joueur est volontairement déclarée dans les résultats : **ce n'est ni une IA de joueur humain, ni un taux de réussite humain, ni un test UX**. L'algorithme n'explore pas exhaustivement toutes les stratégies : il ne fuit pas tous les ennemis, ne cherche pas tous les secrets, ne négocie pas tous les événements de salle et n'optimise pas l'utilisation de la riposte.

## Mesures et interprétation

Rapport JSON reproductible :
- issue (extraction, Rappel, budget d'actions, route impossible ou erreur de commande)
- profondeur atteinte et tours réellement consommés
- déplacements, attaques, esquives, portes ouvertes et attente
- blessures et soins, utilisation d'Endurance, équipement
- coffres ouverts, échanges et encombrement maximum

Un **budget de 440 actions** limite les échecs de cheminement et les scénarios trop longs ; une limite atteinte est rapportée comme *incomplète*, jamais comme une mort ou une victoire. Les mesures de dégâts et de consommation sont propres au protocole de suivi, et doivent être lues avec la trace des politiques.

## Garde-fous

- Ne jamais écrire directement dans les positions, PV, ennemis, butin, sac ou tours pour avancer une scène ; seul le compteur de descentes est initialisé **avant** le démarrage afin de cibler une graine.
- Aucune triche de santé, de trésor ou d'Endurance entre les trois étages.
- SAVE_KEY=rogov-web-v1 et SCHEMA_VERSION=1 ; équipement, RNG, cartes et mécanique d'extraction inchangés.
- Tests Node : reproductibilité des graines, bornes, CLI et erreurs ; CI : 6 graines / 12 essais, rapport conservé 21 jours. Le navigateur Android et le paquet APK continuent leur validation habituelle.
- **Toujours à faire :** recette Samsung physique, cinq personnes × deux descentes, intérêt réel des décisions, pression multi-ennemis et éventuel équilibrage D3B **après les mesures**. Aucun score de qualité n'est attribué sans validation humaine.

## Suite de GAME-095D

Analyser les profils D1/D2/D3 ensemble, examiner les interruptions de trajet et l'utilisation des ressources, puis définir un lot D3B **très ciblé** sur un défaut démontré plutôt que d'ajouter artificiellement des ennemis, des PV, de la durée ou un inventaire extensible. Ne pas lancer de nouvelles classes/sorts ou de contenu narratif avant le bilan de jouabilité.
