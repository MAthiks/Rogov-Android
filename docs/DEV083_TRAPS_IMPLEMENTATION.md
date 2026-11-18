# DEV-083 — Pièges annoncés et désamorçables de Nhal

**Statut : prototype expérimental dans `dev/dev-083-traps-disarm` ; non fusionné.** Source de vérité : [GDD Exploration profonde de Nhal v0.8](GDD_EXPLORATION_NHAL_V0.8.md), sections 4, 6, 7 et 8. Le moteur DEV-085 déjà fusionné sert de base.

## Intention

Nhal doit récompenser **l'observation, le contournement et la préparation**, pas sanctionner une case invisible. Le premier lot implémente **deux mécanismes distincts par nouvelle descente profonde** :

| Piège | Indice | Choix de traversée volontaire | Contre-jeu |
|---|---|---|---|
| **Dalle instable** | Fissures, poussière déplacée | **2 PV maximum** (1 si CON ≥ 8), déclenchement unique | Contourner, fouiller, désamorcer |
| **Fil d'alarme** | Fil sombre, stries au sol | **0 dégât** ; Charognards plus attentifs pendant **3 tours** dans leur salle habituelle | Contourner, fouiller, désamorcer |

Les effets sont volontairement limités. **Aucun piège ne se réarme au rechargement**.

## Expérience joueur

1. L'environnement fournit un **indice passif** proche de la case dangereuse, si elle est visible (distance usuelle 3 cases ; PER ≥ 7 : 4).
2. **Toucher une case visible pour l'inspecter ne consomme jamais de tour**, et les cases sous brouillard ne divulguent pas un piège.
3. **Fouiller** près de l'indice révèle le mécanisme en **1 tour** ; sa nature et son effet deviennent explicitement lisibles.
4. Si le joueur tente de pénétrer une case piégée encore cachée, **le premier mouvement est intercepté**, le piège identifié **sans déplacement, dégât ni tour**. Un **second mouvement volontaire** peut le déclencher. Cela supprime la blessure surprise tout en conservant le choix.
5. **Désamorcer** un piège révélé adjacent coûte **1 tour et 2 END**. Probabilité fondée sur AGI et INT : `clamp(55 + (AGI − 5) × 5 + (INT − 5) × 4, 30, 90)`. Un échec ne déclenche jamais le mécanisme par surprise ; il prend du temps, attire potentiellement une réaction ennemie et consomme une étape du **RNG de combat déjà sauvegardé**.
6. En cas de réussite, le piège passe à `disabled` et accorde **1 XP unique** ; impossible de répéter la fouille ou de récolter des XP en désamorçant le même piège. En cas de traversée volontaire, il passe définitivement à `triggered`.
7. **Mode ASCII et graphique** identiques dans leur connaissance : `~` trace suspecte visible, `!` piège révélé, `x` désamorcé, `;` déclenché. La mini-carte affiche les pièges identifiés dans les zones déjà découvertes ; elle ne divulgue jamais les caches sous le brouillard.

## Garantie d'équité procédurale

La nouvelle génération pose les pièges **après** salles, portes, ennemis, coffres, failles et secrets. Jamais sous l'Égaré, sur un coffre, sur une faille ou un seuil architectural. Les **routes publiques directes vers l'Arche et les trois coffres sont protégées**.

Le générateur recalcule les trajets en traitant **les deux cases piégées comme infranchissables** et vérifie :
- Deux retours indépendants du départ et de chaque coffre vers l'Arche ;
- Une route sans ennemi **ni piège** vers l'extraction ;
- L'accessibilité des coffres sans combat ni piège obligatoire ;
- Aucun passage secret nécessaire à l'extraction.

Le Charognard ne marche pas sur les cases piégées (pas de blocage imprévu). L'alarme augmente temporairement sa portée d'attention de 2 à 4 cases, **sans modifier ses restrictions territoriales DEV-085** ni créer de nouvel ennemi.

## Sauvegardes

`run.traps` est ajouté uniquement lors d'une **nouvelle descente profonde** ; la première descente pédagogique et toutes les descentes déjà commencées restent intactes. `trap.status`, `trap.attempts`, `run.alarmUntil` et le `rngState` sont sauvés dans la même sauvegarde existante `rogov-web-v1`. Aucune migration destructrice ni remise à zéro. Les anciens runs où `run.traps` manque sont toujours légaux.

## Critères de recette

- **200 graines** déterministes, 2 mécanismes contrastés, aucun piège obligatoire, double extraction garantie.
- Avertissement **avant la première entrée**, aucun dommage caché ou saut de tour.
- Fouille et désamorçage vérifiés après sérialisation ; échec reproductible avec le même RNG ; XP unique.
- Aucun piège à mort instantanée depuis la pleine santé et aucune alarme dommageable directement.
- FOG/ASCII/sprites cohérents ; actions tactiles en portrait ; reprise hors ligne de la PWA ; sauvegardes pré-DEV-083 valides.
- **Recette physique Android indispensable avant fusion**. Une nouvelle descente (à partir de la deuxième) est nécessaire pour faire apparaître ces deux pièges.

## Lancement d'essai isolé sur téléphone (Termux)

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-083-traps-disarm https://github.com/MAthiks/Rogov-Android.git rogov-dev083
cd rogov-dev083
python -m http.server 8770 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8770/** dans Chrome. Ce port distinct évite de mélanger les essais avec la version officielle et les sauvegardes des autres copies.

**Politique de publication :** PR en brouillon, `main` reste inchangée. La V0.7f/PWA publique n'est pas réputée enrichie tant que DEV-083 n'est pas fusionné et déployé. L'équilibrage des chances et du rythme des pièges exige encore des retours humains.


## Retour de recette Android physique — 18 novembre 2026

**QA-083 : VALIDATION TERRAIN DÉCLARÉE PAR LE JOUEUR.**
Après l'essai de DEV-083 sur son téléphone, le joueur confirme explicitement : « Validation effectuée ».

- Ce retour lève le blocage de principe « aucun essai Android physique ».
- Le retour ne détaille pas séparément chaque scénario (indice, fouille, désamorçage, alarme, rechargement hors ligne) : ne pas inventer de résultats granulaires ni de durée de session.
- Les contrôles automatisés existants sur `adf1ea62ada7b699260018dc69fc8436732aced5` sont verts : suite Node / navigateur mobile, Chrome Android 13 émulé (4/4), compilation de l'APK historique. Cette compilation n'implique pas que les nouveaux pièges existent dans l'APK Kotlin historique.
- **Décision de fusion et publication distincte** : la confirmation de recette n'est pas une instruction de merger la branche ni de déployer GitHub Pages. `main` reste inchangée à ce checkpoint.

**Étape suivante :** revue de diff / contrôles de merge, puis intégration autorisée et vérification du déploiement PWA, sans casser les sauvegardes existantes.
