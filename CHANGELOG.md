## Web Alpha v0.7b — DEV-073A : caractéristiques et équipements (2026-11-17)

- Profils FOR/AGI/CON/PER/VOL/INT persistants pour le héros et les trois familles ennemies.
- Catalogue des bonus de l'Épée usée et des équipements innés des ennemis ; pièces de bouclier/armure réservées aux tests (pas encore obtenables).
- Calculs dérivés d'Endurance, précision, critique, esquive, parade, blocage et protection ; **aperçus sans effet sur les dégâts ou les chances réelles**.
- Fiche d'attributs repliable et aperçu du profil de l'ennemi ciblé.
- Migration des anciennes sauvegardes sans perte de héros, XP, coffre, sac, position, cible ou ennemis ; version de schéma et clé conservées.
- Prochaine phase : DEV-073B (jets reproducibles et effets des bonus).

## Conception évolutive — statistiques de combat et archétypes (2026-11-17)

- Décision de design : parade, blocage, esquive, toucher et coups critiques devront dépendre des statistiques du PJ/PNJ, de l'équipement, de l'Endurance et des talents de classe.
- Conservation des six caractéristiques du GDD et des onze archétypes définis précédemment ; magie low magic à coût/risque.
- Nouveau dossier de conception : docs/STATS_EQUIPMENT_CLASSES_V0.7.md et découpage DEV-073A/B/C, DEV-075/076.
- **Aucun changement du code jouable ni des sauvegardes dans ce commit de documentation.**

## Web Alpha v0.7a — DEV-072 : vrai combat tactique (17 novembre 2026)

- Se déplacer dans un ennemi ne l'attaque plus : il devient cible sans tour dépensé.
- Attaquer n'est possible qu'au CONTACT contre une cible vivante sélectionnée ; dégâts 3 avec épée, 2 sans arme.
- Esquive : annule la première attaque de mêlée du tour, n'annule pas l'onde de Faille.
- Parade : requiert l'épée ; réduit le premier coup de mêlée de 1 et riposte de 1.
- Blocage : absorbe 1 dégât du premier coup, mêlée ou onde.
- Recul : une case libre s'éloignant de l'ennemi, sans traverser pièges, murs ou créatures.
- Actions valides : un tour ; actions impossibles : aucun tour ni PV consommé.
- Panneau tactique activé, clavier F/E/P/B/R, couleurs distinctes et boutons de taille tactile.
- Sauvegardes existantes compatibles ; Rappel et extraction inchangés. IA et équilibrage à compléter en DEV-073.

## Web Alpha v0.6.2 — DEV-071 : ciblage et panneau tactique (2026-11-17)

- Sélection sans coût de tour depuis la carte graphique ou une bande de cibles accessible en mode ASCII.
- Panneau de cible : nom, famille, PV, distance CONTACT/PROCHE/LOIN, intention du prochain tour, arme et défense.
- Touche C pour passer à la cible suivante ; désélection et contour visuel sur l'ennemi sélectionné.
- Les quatre actions tactiques annoncées sont encore de simples aperçus non interactifs. **Le moteur de combat de la v0.6.1 reste inchangé** : se déplacer contre un ennemi l'attaque encore.
- Sauvegardes compatibles, cache PWA versionné et tests de régression.
- Le futur lot DEV-072 remplace l'attaque par collision et active les défenses tactiques.

## Fondation du combat v0.7 — DEV-070 (2026-11-17)

- Nouveau module pur `docs/combat.js` : distances CONTACT/PROCHE/LOIN, lignes de vue rectilignes, sélection/désélection de cible sans coût de tour, aperçu de l'IA actuelle, états de défense contrôlés et modèle de données pour le futur panneau.
- 12 nouveaux tests `tests/combat-contract.test.mjs` ; les 37 tests précédents restent actifs.
- Le gameplay publié v0.6.1, le format des sauvegardes et le Rappel restent inchangés. Le combat hybride complet n'est pas encore disponible.
- Bilan de studio 6/10 et objectifs qualité 8/10 sauvegardés dans `docs/QUALITY_REVIEW_6_TO_8.md`.

## Préparation v0.7 — décision de conception (NON PUBLIÉE, 2026-11-17)

- Adoption du **combat hybride sur carte**, avec panneau tactique contextuel plutôt qu'une arène séparée.
- Intentions retenues : cibles explicites, distances CONTACT/PROCHE/LOIN, esquive, parade, blocage, repli et intentions ennemies annoncées.
- Préparation de la documentation : GDD combat v0.7, prompt d'implémentation, Master Prompt et plan de production.
- **Aucun changement de code de combat v0.7 et aucune nouvelle version jouable à ce stade.**

## Web v0.6.1 — correctif Android (2026-11-17)

- Correctif de l'écran titre trop large sur Samsung.
- CSS critique embarqué et ressources PWA d'interface versionnées.
- Version jouable Web de référence, distincte des APK natifs.

## Web v0.6 — bestiaire et direction artistique (2026-11-17)

- Lignées visuelles originales et nouvelle Larve de faille, avec onde à distance.
- Bible visuelle et prompt v0.6 intégrés.

## Historique Android natif

## v0.1.3 — diagnostic de compatibilité (2026-11-17)

- Nouvel identifiant `com.rogov.android.compat` pour exclure un conflit d'installation.
- Target SDK 33, correspondant à Android 13.
- Signatures v1 et v2 activées explicitement dans Gradle pour élargir la compatibilité.
- Maintien du test réel `adb install` et démarrage sur émulateur Android 13.
- Aucune modification des données du jeu ni de la progression.

## 0.1.2 — 17 novembre 2026
- Version d'installation diagnostic Android, avec identifiant distinct `com.rogov.android.installtest`.
- Ne remplace aucune version existante de ROGOV et ne modifie pas ses sauvegardes.
- Ajout d'un test GitHub Actions sur émulateur Android 13 : installation, lancement et vérification du processus.
- Examen de la signature, du manifeste et de l'alignement APK déjà présents dans la CI.

## 0.1.1 — 17 novembre 2026
- Corrections de configuration Gradle et du build Android.
- Vérifications de l'extraction et du Rappel.
