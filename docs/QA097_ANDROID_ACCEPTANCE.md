# QA-097 — Recette d'acceptation Android de ROGOV

**Date :** 20 novembre 2026. **Statut : lot QA-097 fusionné via PR #55, `903ec158a97d7b3a3d5dfd413e32cb4d79c6af1f` ; GO technique automatisé, NO-GO artistique** en attente des essais Android physiques et utilisateurs.  
**Base vérifiée :** `main 87c8fdacfad7113713936b3210f4fb467854dec3`, ART-097C1 (PR #54), code PWA et APK HTML/CSS/JS.  
**Référence :** maquette UI/ART-097 (dark fantasy), [QA-096](QA096_ANDROID_VISUAL_RECIPE.md), [checkpoint ART-097C1](CHECKPOINT_CHAT_ART097C1.md).

## Portée / décision de studio

**Gel des mécaniques et des ajouts graphiques.** Ce chantier apporte
des **preuves de test et des mesures**, pas un nouveau moteur, de nouveaux
sprites ou une refonte esthétique invisible au joueur.

Conserver : Sprite C capuche 4 directions, 24×24, Nhal 11×11,
murs/portes/coffres/pièges/Arche/Faille, torches locales fog-safe,
animations ART-097B2, six raccourcis réels, commandes de terrain,
brouillard, trois ennemis, `rogov-web-v1` schéma 1, mode ASCII,
PWA hors ligne, Rappel, extraction et rétrocompatibilité des sauvegardes.

## QA technique reproductible (PR)

La suite Chromium `tests/mobile-browser.test.mjs` garde l'ensemble
des anciens tests et ajoute **QA-097 Android acceptance** aux trois
formats **320×640, 360×780 et 393×704**, DPR 3, tactile et
`prefers-reduced-motion: reduce`.

| Contrôle | Preuve attendue | Décision |
|---|---|---|
| Géométrie | 121 cases, un PJ, carte entièrement avant les raccourcis, puis le pavé fixe | Bloquant P0 si case essentielle inaccessible |
| Tactile | 6 raccourcis + 5 boutons du pavé + 2 soins : 13 cibles ≥44×44 **px CSS**, centre dans le viewport et réellement touchable par `elementFromPoint` | Bloquant P0 si action indispensable masquée |
| Brouillard | Au moins une case masquée ; aucun ennemi/indice d'intention ni classe/lumière ART-097C sur un souvenir ou une case inconnue | Bloquant P0 |
| Sauvegarde | 22 rendus graphiques successifs **sans écriture** dans `rogov-web-v1` ni tour consommé | Bloquant P0 |
| Mise en page | Aucun défilement horizontal, aucun recouvrement carte/raccourcis/dock | P0 ou P1 selon impact |
| Temps de rendu | 22 échantillons, médiane, p95, maximum (Chromium CI) | **Diagnostic seulement** : n'atteste pas les FPS d'un appareil |

À chaque format, capture `qa097-nhal-WxH.png` et rapport JSON
`qa097-report.json` stockés sous `qa096-screenshots/`, dans l'artefact
GitHub Actions `qa096-chromium-portraits`. Ne pas traiter la valeur p95
de Chromium CI comme une mesure sur un smartphone.

**Trois validations GitHub obligatoires** :
`test-web` (Node + Chromium),
`android-web` (Chrome Android 13 réel dans l'émulateur),
`build` (compilation, signature/install et lancement APK).
Le succès automatique est un jalon de stabilité, pas un GO artistique.

## Recette physique sur Android — exécution humaine

Utiliser le dernier build publié, à luminosité moyenne, Chrome Android ;
recommencer en PWA installée si possible. **Ne pas effacer les données
du site, ne pas désinstaller l'application et ne pas réinitialiser le héros.**
Noter téléphone, version Android, navigateur, taille d'affichage, orientation,
échelle et si le clavier/les barres système recouvrent des touches.

1. **Veyr (10 s de découverte)** : compréhension objectif/stash/départ ;
   préparer, accéder à Forge/Échos/Égaré ; capturer le premier écran.
2. **Nhal (premier regard)** : capuche Sprite C identifiable, murs vs sols,
   portes vs coffres, Gardien/Charognard/Larve distincts ; lire PV/END
   et l'étage sans zoom. Capturer Nhal avec une entité visible.
3. **Tactile (10 gestes)** : quatre déplacements, Attendre, Sac ouverture/
   fermeture, Combat, À portée, Bandage et Tonique (si disponibles).
   Tester avec la barre système Android visible. Noter chaque clic
   manqué, double clic, action intempestive ou bouton inaccessible.
4. **Danger et FOV** : indice `!` / `…` / `▣` compréhensible autrement
   que par sa couleur, aucune porte/piège/entité révélée à travers le
   brouillard ; torche ambre, Arche turquoise et Faille cramoisie sans
   halo sur le PJ ni masquage d'information.
5. **Animations et fluidité** : marcher 20 cases, rencontrer les trois
   silhouettes si possible, comparer mouvement normal et option Android
   « Réduire les animations ». Mesurer ressentis : fluide, ralentissement,
   latence, surchauffe, énergie ; si possible, relever FPS via un outil
   de diagnostic **du téléphone** sans confondre avec p95 CI.
6. **Persistance** : reprendre une ancienne sauvegarde sans la réinitialiser ;
   passer ASCII/graphique ; fermer/rouvrir ; vérifier continuité.
   Pour PWA installée, tester hors ligne **après mise en cache initiale**.
   Vérifier extraction volontaire / Rappel sur une partie de test
   uniquement si les conditions sont réunies.

## Campagne testeurs : 5 personnes × 2 descentes

Voir [formulaire terrain](QA097_FIELD_REPORT_TEMPLATE.md). Pour chaque
participant **sans aide**, vérifier :
- objectif compris en ≤30 s ;
- ≥4/5 catégories reconnaissables (PJ, portes, hostiles, coffre/piège, issue) ;
- action voulue en ≤2 gestes, danger compris et risque de sac perdu compris ;
- **« As-tu envie de rejouer une descente ? »** : oui/non ;
- confusion, durée approximative, clics involontaires, remarque libre.

### GO / NO-GO

**GO artistique conditionnel uniquement si** :
CI Web/Android/APK verte **et** revue physique validée **et**
5 participants ont réellement terminé deux descentes **et**
au moins 4/5 veulent rejouer **et**
aucun défaut P0 ni P1 restant sans décision explicite.

**NO-GO / blocage P0 :** sauvegarde perdue/corrompue, case cachée révélée,
action obligatoire inaccessible, carte illisible, plantage empêchant la
partie. **P1 :** intention incompréhensible, mauvais contraste, boutons
trop proches, lourde dégradation de fluidité. **P2 :** décoration mineure.

Ne pas réévaluer les notes provisoires **DA 6/10** et **Alpha 7,5/10**
tant que les preuves de terrain manquent. Aucune validation physique
n'est présumée dans cette page.

## Suivi

| Éléments | Statut initial |
|---|---|
| Tests Node + Chromium, Chrome Android 13, APK | À valider sur PR QA-097 |
| Rapport JSON + captures Chromium | À produire en CI |
| Téléphone utilisateur | Non testé dans ce lot |
| PWA offline physique / sauvegarde ancienne | Non testé dans ce lot |
| Campagne 5×2 | Non démarrée / aucun résultat déclaré |
| GO esthétique / note DA | NO-GO provisoire |

**Étape après validation technique :** analyser les preuves de terrain,
corriger uniquement les défauts reproduits (un lot UI/ART par priorité),
sans recréer le gameplay ni ajouter de mécaniques.

## Résultats confirmés du lot QA-097 — PR #55

**CI avant fusion :** 385/385 tests Node, 60/60 Chromium,
workflow `android-web` Chrome Android 13 émulé réussi et workflow
`build` APK compilation/installation/lancement réussi.

| Portrait Chromium (DPR 3) | Carte (CSS px) | 13 centres touchables | Minimum cible largeur × hauteur | Cases masquées | Fuite brouillard | Médiane / p95 redraw (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 320×640 | 220 | 13/13 | 47×44 | 44 | 0 | 0,9 / 1,6 |
| 360×780 | 335,4 | 13/13 | 52,5×44 | 44 | 0 | 0,8 / 1,6 |
| 393×704 | 284 | 13/13 | 57,3×44 | 44 | 0 | 0,8 / 1,5 |

**Source des mesures :** `qa097-report.json` de
[l'artefact `qa096-chromium-portraits`, run #44706385938](https://github.com/MAthiks/Rogov-Android/actions/runs/44706385938).
Ces mesures ne sont ni la fréquence d'images réelle ni la latence d'un
téléphone physique. 22 reconstructions DOM sans aucune mutation de
sauvegarde ou de tour, 121 cases, une silhouette PJ, aucun ennemi
ou éclairage sur les cases cachées. Les captures des 3 formats ont été
inspectées ; navigation visible sous la carte et au-dessus du dock.
**Observation non bloquante à contrôler sur vrai téléphone :**
la carte reste plus petite sur écran 320×640 qu'en 360×780 ; le
contraste du décor et la compréhension des pictogrammes exigent un
retour humain.

**Décision :** QA automatique technique passée ; **NO-GO artistique
toujours ouvert**. Ne pas augmenter DA 6/10 / Alpha 7,5/10 sans
5 utilisateurs × deux descentes et recette physique conforme.
