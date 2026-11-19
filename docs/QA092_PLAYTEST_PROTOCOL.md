# QA-092 — Fiche de test joueur Android, 2 descentes

**Rôle de l'observateur :** regarder sans guider. Le joueur ne doit pas connaître le donjon ni les commandes au préalable. En cas de blocage, noter la difficulté avant d'expliquer ; toute aide doit être enregistrée.

**Objectif du studio :** 5 testeurs différents, **2 descentes par testeur**, soit 10 descentes observées. Les tests automatiques ne sont pas comptabilisés dans cet échantillon.

## Fiche de session individuelle (à dupliquer cinq fois)

- Testeur anonyme : T01 / T02 / T03 / T04 / T05
- Date et heure :
- Téléphone, taille d'écran, version Android, navigateur :
- Site navigateur / PWA installée / APK (choisir) :
- Familiarité avec les roguelikes : aucune / occasionnelle / régulière
- A-t-il reçu une aide ? Oui / Non ; si oui, à quelle étape ?
- Incident reproductible, vidéo ou capture : lien (si autorisé) :

### Descente 1 — Découverte et compréhension

| Observation | Donnée |
|---|---|
| Équipement choisi et compris ? | |
| Nombre de tours et résultat (extraction / Rappel / abandon) | |
| Les déplacements et l'attente ont-ils été trouvés seuls ? | |
| Combat : cible, action et défenses compris ? | |
| Interactions : porte, coffre, piège ou secret compris ? | |
| Sac, HUD, journal et rapport ouverts facilement ? | |
| Une action a-t-elle semblé injuste ou involontaire ? | |
| Bug bloquant ou perte de sauvegarde ? | |
| Une capture ou remarque précise ? | |

### Descente 2 — Décision et envie de rejouer

| Observation | Donnée |
|---|---|
| Joueur a-t-il choisi de se rééquiper différemment ? Pourquoi ? | |
| Nombre de tours et résultat (extraction / Rappel / abandon) | |
| A-t-il perçu une véritable variation du donjon ? | |
| A-t-il choisi d'éviter ou d'engager un danger ? Pourquoi ? | |
| A-t-il compris les conséquences du butin exposé ? | |
| Les soins et défenses ont-ils semblé utiles ? | |
| A-t-il trouvé un objectif clair pour revenir à Veyr ? | |
| Bug bloquant ou geste tactile impossible ? | |
| Une capture ou remarque précise ? | |

### Questions de sortie — demander sans suggérer

1. **Que se passe-t-il si tu meurs avec du butin ?** (réponse libre)
2. **Pourquoi repartirais-tu dans Nhal, ou pourquoi non ?** (réponse libre)
3. **Quelle action ou information était la plus difficile à trouver ?** (réponse libre)
4. **Sur une échelle de 1 à 5, quelle était la lisibilité des commandes ?** (1 illisible → 5 évidente)
5. **Sur une échelle de 1 à 5, quelle était la tension ressentie ?** (1 aucune → 5 forte)
6. **Lancerais-tu volontairement une troisième descente aujourd'hui ?** Oui / Non / Incertain
7. **Laquelle des améliorations te semble indispensable ?** (réponse libre, ne pas donner d'options avant qu'il réponde)

### Bilan observateur

- Temps nécessaire pour trouver le premier déplacement :
- Temps nécessaire pour comprendre « À portée » :
- Temps passé à rechercher le sac ou le rapport :
- Nombre d'aides verbales :
- Nombre de blocages, par sévérité (P0 / P1 / P2) :
- Observations et citations du joueur :

## Registre consolidé à remplir après les cinq sessions

| Testeur | Descentes terminées / 2 | Rejouer ? | Comprend la perte du sac ? | Commandes / 5 | Tension / 5 | Incidents P0 |
|---|---:|---|---|---:|---:|---:|
| T01 | — | Non testé | Non testé | — | — | — |
| T02 | — | Non testé | Non testé | — | — | — |
| T03 | — | Non testé | Non testé | — | — | — |
| T04 | — | Non testé | Non testé | — | — | — |
| T05 | — | Non testé | Non testé | — | — | — |

**Ne jamais remplir les cases avec des résultats simulés.** Tout avis « envie de rejouer » doit correspondre à un vrai testeur. La cible d'acceptation initiale est **au moins 4 Oui sur 5**, aucun P0 non corrigé, et aucun mécanisme essentiel inaccessible sur le smartphone de recette.

## Classification des anomalies

- **P0 / bloquant** : crash, sauvegarde perdue, action de jeu essentielle inaccessible, softlock non intentionnel ou manipulation irréversible non signalée.
- **P1 / majeur** : information cruciale incompréhensible, décision de combat opaque, action involontaire récurrente, préparation qui empêche un choix stratégique pourtant attendu.
- **P2 / polish** : contraste, hiérarchie visuelle, retour sonore, libellés ou animation n'affectant pas les règles ni la progression.

Chaque anomalie doit contenir : appareil, version, sauvegarde ou graine si disponible, étapes de reproduction, résultat attendu, résultat observé, image/vidéo si possible.
