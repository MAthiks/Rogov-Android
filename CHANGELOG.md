## ART-091D — Veyr, concepts de PNJ et objets Sprite C (18 novembre 2026)

- 8 nouveaux SVG originaux 24×24 : 3 concepts de PNJ de Veyr (non interactifs) et 5 icônes pour tous les objets existants.
- Coffre sécurisé et sac utilisent les mêmes pictogrammes, avec repli sur symboles ASCII ; cases à cocher, libellés et quantités préservés.
- Galerie repliable au refuge, sans dialogue, marchand, personnage actif ou mécanique supplémentaire.
- Pack PWA hors ligne renouvelé ; tests Node, Chromium Android tactile, Android 13 et APK ; validation physique des visuels encore à effectuer.
- Cycle ART-091A/B/C/D terminé techniquement. Prochains chantiers : QA mobile/équilibrage, DEV-090D et DEV-089D séparés.

## ART-091C — Interactifs et lieux de Nhal (18 novembre 2026)

- Refonte des 15 sprites 24×24 dans docs/interaction-art.js : 2 portes, 2 coffres, 4 pièges, Arche, faille, secret, 4 marqueurs de sites.
- États discernables par silhouette : passage noir vs panneau opaque, couvercle scellé vs relevé, indices vs pointes exposées vs neutralisation vs mécanisme usé.
- Moteur, combats, visibilité, sauvegardes, ASCII et états de donjon inchangés ; nouveau module précaché PWA.
- Tests SVG/Node et Chromium tactile, conservation de la QA Android 13 et APK ; ART-091D reste en attente.

## ART-091B — Trois silhouettes ennemies Sprite C (2026-11-18)

- Charognard à corps bas et bec osseux, Gardien déchu de pierre et masse imposante, Larve de faille horizontale et segmentée ; trois nouveaux SVG originaux 24×24.
- Remplacement des sprites uniquement, sans modification des ennemis existants, de leurs PV, intentions, portées, états, ni du brouillard/ASCII.
- Conservation des marqueurs de ciblage, des bordures de menace et des jauges PV, et du sprite PJ ART-091A.
- Cache PWA renouvelé ; tests Node et Chromium Android renforcés ; recette visuelle sur téléphone physique à confirmer.
- Suites prévues : ART-091C interactifs/lieux, ART-091D PNJ/objets.

## ART-091A — L'Égaré encapuchonné / Sprite C (2026-11-18)

- Quatre vues directionnelles originales en SVG 24 × 24, capuche relevée et palette gris prune, compatibles avec les tiles de Nhal.
- Orientation purement graphique sur mouvement réel ; aucune donnée de sauvegarde ni règle de combat ajoutée.
- Clé de sprite historique et légende conservées, commandes tactiles/ASCII identiques, cache PWA incrémenté pour le jeu hors ligne.
- Tests Node et Chromium portrait ajoutés ; validation esthétique sur téléphone physique encore à réaliser.
- Prochains lots : ART-091B ennemis, ART-091C interactifs/lieux, ART-091D PNJ/objets.

## GDD v0.8 — DOC-079 : exploration profonde de Nhal (2026-11-18)

- Chapitre de conception ajouté : salles/couloirs, portes, carte large, caméra et brouillard de guerre.
- Passages secrets facultatifs : indices, fouille, caches, raccourcis et salles de lore ; aucune sortie obligatoire cachée.
- Pièges proposés avec indices, contournement, désamorçage, états sauvegardés et garde-fous anti-mort arbitraire.
- Découpage de production DOC-079 / DEV-080 à DEV-083 / QA-084 et renvoi dans Master Prompt, roadmap et backlog.
- **Documentation uniquement : aucune mécanique d'exploration nouvelle jouable par ce commit.** La v0.7f reste la version publiée.

## Web Alpha v0.7f — ECO-078 : économie de Veyr (2026-11-18)

- Le Fragment de cendre a désormais deux usages à la forge du refuge : 2 Fragments -> 1 Lame cendrée, ou 1 Fragment -> 2 Bandages.
- Lame cendrée (Arme +1) : attaque de base 4, meilleure précision, parade et chance critique. L'équipement est utilisable dans le même moteur tactique/statistique.
- La fabrication consomme exclusivement le coffre sécurisé, pas le sac ; impossible en expédition. Les coûts, la disponibilité et le risque de perte sont explicités sur Android.
- Le Rappel détruit la lame emportée, mais pas celle restée au coffre ; l'extraction la restitue sans duplication. Les anciennes sauvegardes restent compatibles.
- **Économie encore en prototype** : coûts et rythme à tester en conditions réelles, objectif Alpha 8/10 non encore certifié.

## Web Alpha v0.7e — VAR-077 : descentes procédurales équitables (2026-11-18)

- Première descente d'introduction historique conservée ; les suivantes varient selon leur graine et numéro.
- Murs, failles, Arche d'extraction, deux sources de butin et positions des trois ennemis générés puis sauvegardés.
- Contrôle automatique : au moins deux chemins de retour possibles depuis l'Arche/les objets, un chemin sans monstre et sans faille mortelle, aucun ennemi au point d'entrée.
- Le Charognard peut approcher les reliques précieuses ; le joueur reste libre de l'éviter ou de se replier.
- Toutes les nouvelles variantes affichables en mode graphique/ASCII, avec inspection des véritables cases ; anciens runs sans carte persistée inchangés.
- **La variation n'est pas encore une économie de butin ni une validation humaine de l'Alpha 8/10.** ECO-078 et tests Android prioritaires.

## Web Alpha v0.7d — DEV-073C : Gardien et intentions ennemies (2026-11-17)

- Gardien déchu : préparation annoncée sur un tour, coup lourd au tour suivant, garde haute après la frappe et interruption en cas de repli hors CONTACT.
- Défense de garde du Gardien : jet statistique de blocage avec la graine persistante ; les coups ratés ne la déclenchent pas.
- Intentions du Charognard et de la Larve alignées sur leurs déplacements et leurs attaques réelles.
- Bannière de danger même sans cible sélectionnée, cartes de cible avertissant de l'imminence et styles accessibles sur mobile.
- Compatibilité des anciennes sauvegardes et des anciennes rencontres, RNG de combat persistante, Rappel/extraction inchangés.
- **À faire :** équilibrage et validation manuelle Samsung, puis test de la boucle par plusieurs joueurs.

## Web Alpha v0.7c — DEV-073B : combat statistique (2026-11-17)

- Jets reproductibles de précision et de critique pour les deux camps ; RNG persistante dans la sauvegarde.
- Dégâts physiques modifiés par les statistiques, réduction d'armure et résistance occulte de la Larve.
- Défenses tactiques non garanties : esquive, parade et blocage utilisent attributs et équipement. Échec et critique affichés dans le journal.
- Endurance : attaques 1, défenses 2, attente +3, déplacement/soin +1. HUD d'Endurance et chances effectives en regard de la cible.
- Migration sans perte des anciennes sauvegardes, sans changement du Rappel et de l'extraction.
- **Limites :** équilibrage préliminaire et IA ennemie capable de choisir sa propre défense non implémentée (DEV-073C).

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
