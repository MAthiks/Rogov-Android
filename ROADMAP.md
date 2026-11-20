# Roadmap ROGOV — état du 19 novembre 2026

## GAME-095 — Nouvelle priorité : gameplay roguelike

**Décision de direction du 19 novembre 2026 :** recentrer ROGOV sur un dungeon crawler roguelike inspiré de Pixel Dungeon / Shattered Pixel Dungeon, sans en copier les contenus. **Veyr / Nhal, exploration procédurale, combats tactiques au tour par tour, extraction ou Rappel, Sprite C, ASCII et compatibilité des sauvegardes restent fondamentaux.**

**Ordre de production (WIP = 1) :** GAME-095A (variété d'objets et décisions d'équipement), GAME-095B (étages successifs), GAME-095C (tactique/environnements/ennemis), GAME-095D (équilibrage Android et rejouabilité). Le lore NAR-093/094 reste présent mais **n'est plus le moteur des priorités**. Ne pas ajouter de quêtes ou révélations avant d'avoir validé le plaisir des descentes.

**GAME-095A1 — Fondations du butin (fusionné, PR #29) :** six objets avec pictogrammes Sprite C, RNG de butin déterministe indépendant, catalogue et tests. [Spécification GAME-095A](docs/GAME095A_LOOT_EQUIPMENT.md).

**GAME-095A2 — Équipement et sac (fusionné, PR #30) :** quantités à Veyr (sans modifier les anciennes signatures), choix des slots, équipement tactique coûtant un tour, abandon avec confirmation, Sels de vigueur (+6 END), inventaire Android. [Contrat A2](docs/GAME095A_LOOT_EQUIPMENT.md). Distribution de nouveaux objets en donjon reportée à A3. CI et tests Android requis avant validation.


**GAME-095A3/A4 (code fusionné, PR #31) :** trois coffres profonds (Fragment + Bandage garantis, butin variable), validation rétrocompatible, équilibrage de base et workflows Web/Android validés. [Recette A3/A4](docs/GAME095A3_A4_QA_BALANCE.md). La recette physique Android et les **5 joueurs × 2 expéditions** restent ouvertes ; ne pas assimiler tests automatiques et plaisir de jouer.

**GAME-095B1 — Étages successifs (fusionné, PR #32) :** boucle de trois étages, choix libre à l'Arche (extraire ou descendre), blessures et sac persistants, profondeurs/XP sauvegardés, compatibilité des anciens runs et tutoriel, UI mobile. **Tests Web, Chrome Android 13 et APK automatisés réussis ; validation sur téléphone physique et tests humains toujours requis.** [Contrat et recette B1](docs/GAME095B1_MULTIFLOOR.md). Priorité suivante : GAME-095B2 (rencontres et ressources par profondeur), puis C/D.

**GAME-095B2 — Difficulté et récompenses par profondeur (fusionné, PR #34) :** étage 2 davantage orienté risques de Faille et soins, étage 3 vers les sentinelles et l'équipement. Le même effectif de quatre ennemis, les statistiques normales, les voies de retour et le bandage garanti sont préservés. Butin de coffre déterministe, prévisions de risque sans divulgâcher la carte, anciennes parties B1 inchangées, tests multi-graines et Android. [Contrat GAME-095B2](docs/GAME095B2_DEPTH_BALANCE.md). **Tests Web, Chrome Android 13 et APK validés.** La recette sur téléphone physique / cinq joueurs reste à faire.

**GAME-095C1 — Charge annoncée du Charognard (fusionné, PR #35) :** anticipation, charge et interruption par déplacement du Charognard des nouveaux étages 2–3. Tests Web/Android 13/APK réussis ; essais humains encore ouverts. [Contrat C1](docs/GAME095C1_CHAROGNARD_TACTICS.md).

**GAME-095C2 — Repousser et exploiter les pièges (fusionné, PR #36) :** commande tactile pour décaler un Charognard adjacent de 1 case (-3 END, 1 tour, sans dégât sur sol normal), utiliser les dalles et fils d'alarme **révélés**, avec effets uniques et risques associés. Ne traverse ni murs ni portes et n'expose aucun piège caché. Sauvegardes anciennes et RNG de combat préservés. [Contrat C2](docs/GAME095C2_TERRAIN_SHOVE.md). **Tests CI Web, Android 13 et APK réussis.** Recette physique et cinq joueurs × deux expéditions toujours à réaliser.

**GAME-095D1 — Audit d'équilibrage reproductible (fusionné, PR #37) :** analyse structurée sur **100 descentes × trois étages** (300 cartes), avec itinéraires, trois coffres et quatre adversaires par étage ; compare deux politiques simples sur des **duels isolés** via le vrai moteur et rapporte PV, Endurance, tours, Rappel et saturation théorique du sac. [Méthodologie et limites du laboratoire](docs/GAME095D1_BALANCE_LAB.md). Rapport JSON `game095d1-balance-baseline-100` créé par la CI ; les résultats sont des **sondages synthétiques, non des taux de succès humains**. **Tests Web, Chrome Android 13 et APK réussis ;** D1 ne modifie pas le gameplay et ne remplace pas une recette sur téléphone physique. Les résultats orientent D2.

**GAME-095D2 — Riposte d'esquive et échange de coffre (fusionné, PR #38) :** les coups lourds/charges annoncés peuvent ouvrir une riposte avec l'arme et les stats réelles du héros lorsqu'une esquive réussit ou que l'attaque ennemie manque ; une défense ratée n'offre aucun coup gratuit. Un sac plein de huit objets permet désormais d'échanger volontairement un objet non protégé contre le contenu encore inconnu d'un coffre profond, en **un seul tour**, sans capacité supplémentaire ni butin dupliqué. [Contrat GAME-095D2](docs/GAME095D2_BALANCE_CHOICES.md). Comparaison chiffrée des stratégies sur 100 expéditions et tests mobiles/Android 13/APK obligatoires avant fusion ; **essais humains toujours requis**.

**GAME-095D3 — Audit des expéditions et ressources (fusionné, PR #39) :** un laboratoire séparé de la PWA simule deux politiques déterministes sur de **vrais déplacements et actions du moteur** : marche, portes, adversaires, soins, objets, coffres, extraction ou Rappel. Rapporte les coûts, les blessures et la profondeur atteinte ; le routage utilise cependant la géométrie complète et **n'est pas un taux de victoire humain**. [Protocole et limites](docs/GAME095D3_EXPEDITION_AUDIT.md). Aucune modification de l'équilibrage sans mesures, tests Android et retour de joueurs.

**GAME-095D3B — Pression multi-ennemis pendant les expéditions (fusionné, PR #40) :** instrumentation séparée du jeu sur les actions et les tours effectivement consommés par les deux politiques D3. Mesure par étage les créatures visibles au CONTACT/PROCHE, menaces annoncées simultanées, blessures nettes, soins et coffres sous pression. Utilise la visibilité et les intentions du moteur réel, sans fuite du brouillard. **Pas de buff ni de placement imposé** avant vérification sur graines identiques et test Android physique. [Protocole D3B](docs/GAME095D3B_MULTI_THREAT_AUDIT.md). Le rapport D3 devient version 2 ; sauvegardes et PWA inchangées. **Premier audit CI, six graines et douze parcours scriptés :** aucun tour avec deux ennemis visibles simultanément à PROCHE (≤3 cases), ni deux attaques imminentes. L'exploration des coffres rencontre davantage de menaces annoncées (14 tours en moyenne par expédition contre 6,5 pour l'extraction rapide) ; les 12 parcours extraits ne sont **pas** des résultats humains. Un futur D3C pourra tester des rencontres optionnelles coordonnées et leur évitement, sans gonfler les dégâts ni bloquer les issues.

**GAME-095D3C — Duo facultatif autour du butin (fusionné, PR #41) :** réponse limitée aux audits D3B montrant l'absence de menaces groupées dans les parcours synthétiques. Sur les **nouveaux étages 2–3**, repositionner si possible le Gardien existant dans la salle de coffre optionnelle aux côtés de la Larve : coup lourd annoncé au CONTACT et onde de Faille sur l'axe, sans ennemi ajouté ni statistiques augmentées. Exiger une approche réellement visible, les trajets sans combat, les deux voies de retour et le respect des pièges/sites, sinon conserver le placement historique. Le premier étage et les sauvegardes en cours ne sont jamais modifiés. [Contrat D3C](docs/GAME095D3C_OPTIONAL_DUO.md). **CI Web / Chromium portrait, Chrome Android 13 (seconde tentative), build et installation APK validés.** Rapport D3B avant/après sur les mêmes six graines : tours avec deux ennemis PROCHE par expédition 0 → 3 pour l'extraction rapide, 0 → 7,5 pour la collecte ; **5/6 extractions scriptées** pour chaque stratégie après D3C contre 6/6 auparavant. Ceci mesure des bots connaissant la géométrie, pas des joueurs humains. Première recette sur téléphone physique et cinq joueurs × deux descentes toujours requises. Un prochain lot devra examiner si cette pression facultative est bien dosée, sans ajouter de difficulté artificielle.

## UI-096 — Refonte visuelle par maquettes (nouvelle priorité du studio)

**UI-096B — premier prototype Nhal Android (fusionné, PR #42) :** CSS additionnel sobre/contrasté, 6 accès rapides repérés visuellement, carte 11×11 préservée, bandeau de menaces alimenté exclusivement par les avertissements/ennemis visibles déjà filtrés par le moteur, dock et ASCII inchangés. [Contrat et recette UI-096B](docs/UI096B_NHAL_COCKPIT_IMPLEMENTATION.md). **CI confirmée : 348/348 tests Node, 44/44 Chromium mobile, Chrome Android 13 et APK signée/installée réussis. Revue visuelle sur téléphone physique et tests joueurs toujours ouverts.** Aucun Sprite C n'est remplacé par ce lot.



**Décision du 19 novembre 2026 :** priorité à l'interface Android et aux graphismes, **avant** de reprendre l'ajout de mécaniques. [Checkpoint de maquettes UI-096 v0.1](docs/UI096_V3_VISUAL_MOCKUPS.md) : design system sombre/contrasté Sprite C, **maquette A Nhal (carte dominante, menace lisible, dock tactile), maquette B Veyr (coffre/forge/préparation)**, puis C sac et D personnage. **Maquettes conceptuelles, non encore validées ; pas de refonte du moteur fusionnée.** Reprise sur plusieurs sessions depuis le document, choix utilisateur avant PR de code, compatibilité sauvegardes/ASCII/PWA hors ligne et tests Android.

## ART-096 — Première passe graphique sur Nhal

**ART-096A (fusionné, PR #43) :** développement isolé du polissage **sol/murs (reliefs 24×24)**, **porte ouverte/fermée**, **Arche/Faille** et des silhouettes Sprite C Charognard/Gardien/Larve. [Contrat ART-096A](docs/ART096A_MATERIAL_SILHOUETTE.md). Atlas et états fonctionnels inchangés, brouillard de guerre intact, PWA hors ligne versionnée, CI validée : 352/352 tests Node, 45/45 Chromium tactile, Chrome Android 13 et build/installation APK réussis. **La validation esthétique sur téléphone physique et les 5 joueurs × 2 expéditions restent ouvertes.**

**ART-096B (fusionné, PR #44) :** nouveaux détails graphiques 24×24 des **coffres fermé/ouvert** et quatre états des **pièges** ; indices tactiques directement sur les seules cases **d'ennemis visibles** (`!` imminent / `…` préparation / `▣` garde), alimentés par `currentEnemyIntent`. Aucun nouveau système, aucun champ de sauvegarde, aucun regard à travers le brouillard. [Contrat et recette ART-096B](docs/ART096B_CHESTS_TRAPS_INTENTS.md). **CI validée : 357/357 tests Node, 47/47 tests Chromium mobile, Chrome Android 13 et build/installation APK réussis.** **Téléphone physique et cinq testeurs × deux descentes à faire.**

## UI-096C — Refuge Veyr, coffre, sac et fiche personnage

**Fusionné, PR #45 :** Veyr reçoit un véritable écran pierre/ambre avec panorama pixel original et **quatre accès aux sections existantes** (Préparer / Forge / Échos / Égaré), coffre explicitement sécurisé, préparation à **8 unités** avec jauge, même bouton de départ accessible sur Android, et palette de danger dans le sac de descente. **La fiche existante `#actor-stats-sheet` est déplacée sans duplication** entre Veyr et Nhal ; statistiques du moteur inchangées, aucune nouvelle ressource, boutique ou PNJ actif. [Contrat UI-096C](docs/UI096C_VEYR_REFUGE_IMPLEMENTATION.md). **CI validée : 361/361 tests Node, 49/49 Chromium mobile, Chrome Android 13 et build/installation APK.** **QA téléphone physique et 5 joueurs × 2 descentes toujours ouverts.**

## QA-096 — Recette visuelle et ergonomique Android (chantier actif)

**Ouvert le 19 novembre 2026, GO artistique non accordé.** Après UI-096C / PR #45, le dernier workflow GitHub Pages `main` du commit `ed2459c` est **réussi**, déploiement compris ([run](https://github.com/MAthiks/Rogov-Android/actions/runs/44629654676)); APK `main` réussi ([run](https://github.com/MAthiks/Rogov-Android/actions/runs/44629654708)). Ce succès CI ne valide pas l'affichage sur téléphone.

**Outillage QA-096 en préparation sur branche dédiée** : capture Chromium automatisée de Veyr et Nhal aux trois résolutions 320×640, 360×780, 393×704 ; métriques de carte, zone tactile ≥44px et contraste de textes à fond uni ; PNG et JSON archivés en artefact PR. Voir le [protocole QA-096](docs/QA096_ANDROID_VISUAL_RECIPE.md). Le résultat des tests du nouveau lot doit être vérifié avant fusion.

**Reste obligatoire** : captures et gestes sur **Android physique**, test ASCII/PWA hors ligne et sauvegardes, perception Sprite C (capuche quatre directions, coffres, pièges, intentions, Arche vs Faille), puis **cinq testeurs × deux descentes**, dont ≥4/5 souhaitant rejouer, sans P0. La note Alpha provisoire **7,5/10** et la note DA **6/10** sont maintenues jusqu'à cette preuve. Aucune nouvelle mécanique ni portage PC actif avant l'arbitrage.

## UI-096D — Améliorations mesurées après captures Android (en cours)

**Suite de QA-096**, [contrat UI-096D](docs/UI096D_ANDROID_COMPACT_POLISH.md). Deux captures réelles ont révélé une carte trop petite sur écrans courts, une alerte de menace redondante, un refuge trop vertical avant ses accès et un sous-titre alpha obsolète. Correctifs UI seulement : carte agrandie sur hauteur ≤760px, alerte réservée aux véritables coups imminents, Veyr condensé, endurance désaturée, cache PWA versionné. **Tests et capture de contrôle à valider avant fusion ; aucune règle, save, Sprite C, brouillard, combat ou objet modifié.** Le GO graphique humain reste ouvert.

## UI/ART-097 — Objectif haute fidélité sur Android (en production)

**Référence :** nouvelle maquette de Nhal en pixel art dark fantasy, fournie le 20 novembre 2026. Le rendu doit être **réel et interactif** ; ne pas remplacer le moteur par une peinture d'écran. Sprite C, 11×11, état du monde, brouillard, sauvegardes et ASCII prioritaires.

**UI-096D — PR #47 fusionnée**, commit `9596f9f` : carte agrandie en portrait court, Veyr condensé, avertissement de menace réservé aux attaques imminentes ; contrôles Web, Chrome Android 13 et APK réussis. Recette esthétique physique ouverte.

**ART-097A1 — PR #48 fusionnée**, commit `2ab130a` : biseaux de pierre, joints ombrés et patines sur les **54 variantes SVG déterministes** de sol/mur, sans nouvelle tuile mécanique ni fuite des voisins inconnus. **367/367 Node et 53/53 Chromium**, Chrome Android 13 et compilation/install APK validés en automatisation. [Contrat et recette](docs/ART097A1_STONEWORK_IMPLEMENTATION.md).

**ART-097A2 — PR #49 fusionnée**, commit `0cfacd0` : portes ouvertes/fermées, coffres fermés/ouverts, Arche turquoise et Faille cramoisie en SVG 24×24 enrichis ; `INTERACTIVE_IDS` reste à 15, pièges cachés intacts. Aucun faux objet ni nouveau gameplay ; cache PWA renouvelé. [Contrat et recette](docs/ART097A2_INTERACTIVE_ASSETS.md). **370/370 tests Node, 53/53 Chromium, Chrome Android 13 et APK automatisés réussis** ; contrôle physique de la lisibilité encore ouvert.

**Prochaine priorité ajustée après comparaison des captures Chromium : UI-097A**, alléger le bandeau supérieur et les panneaux, renforcer la carte et les commandes sans recouvrement (cartes actuellement 220 / 335 / 284 CSS px en 320×640 / 360×780 / 393×704). Ensuite **ART-097B** (PJ Sprite C et ennemis) et **ART-097C** (lumières et ambiance sans coût excessif). WIP=1, pas de changement de gameplay ni portage Godot/PC actif.

**UI-097A1 — PR #50 fusionnée**, commit `5951506` : bandeau ROGOV et
frise originale de ruines SVG, pierre/bronze pour HUD, jauges côte à côte,
raccourcis tactiles, encadrement de carte et pavé directionnel existant. Le
moteur, les IDs/handlers, 11×11, Sprite C 24×24, brouillard/ASCII/offline,
save `rogov-web-v1` schéma 1 sont inchangés.
**373/373 tests Node, 54/54 Chromium mobile, Chrome Android 13 émulé et
APK installée en émulateur réussis**, captures 320×640, 360×780 et 393×704
inspectées ; sans avertissement, la carte mesure 220 / 335,4 / 284 CSS px,
respectivement, et ne touche pas le dock (écart minimal 26px). Seuls les
tests automatisés sont certifiés. [Contrat et recette](docs/UI097A1_COCKPIT_FIDELITY.md).

**UI-097A2 — PR #51 fusionnée**, merge `38323e4` : sur Android,
les **vrais** six raccourcis et le bandeau d'alerte ennemie imminente
passent **sous la carte** graphique/ASCII et au-dessus des commandes fixes.
Les nœuds DOM et listeners sont conservés, et leur emplacement d'origine
est restauré sur desktop. Module `docs/ui097a2.js` et CSS original
`docs/ui097a2.css` ; pas de gameplay nouveau, pas de fuite du brouillard,
pas de changement de sauvegardes ou de contrôles. **375/375 tests Node et 56/56 Chromium**, avec mesures sur
320×640, 360×780 et 393×704, alerte de coup lourd, Chrome Android 13
et APK réussis en automatisation. Carte entière et six boutons ≥44px
au-dessus du pavé fixe confirmés sur captures Chromium. [Contrat UI-097A2](docs/UI097A2_MAP_FIRST_NAVIGATION.md).
Recette physique et 5×2 descentes toujours ouvertes.

**ART-097B1 — PR #52 fusionnée**, merge `58e981a` :
Sprite C encapuchonné 4 directions : bottes, manteau, attache et harnais
plus lisibles à 24×24 ; Charognard : plumes abîmées ; Gardien déchu :
armure fissurée et masse conservée ; Larve : facettes segmentées.
`docs/hero-art.js` et `docs/enemy-art.js` uniquement pour les assets,
tests Node/Chromium de la galerie 24px/60px, cache PWA versionné.
Pas de modification du moteur, des 3 familles d'ennemis, des tours,
du FOV, des sauvegardes, d'ASCII ou du gameplay. [Contrat](docs/ART097B1_CHARACTER_FIDELITY.md).
**378/378 Node, 57/57 Chromium, Chrome Android 13 et APK automatisés réussis.**
Galerie des 7 sprites (24px / agrandissement nearest-neighbor) et captures
Nhal 320×640 / 360×780 / 393×704 examinées ; aucune case du donjon
recouverte par le dock. Tests esthétiques physiques et 5×2 joueurs ouverts.

**ART-097B2 — PR #53 fusionnée**, commit `abdf705` :
signal de présentation éphémère déclenché après **vrai tour de jeu**,
pas cardinal Sprite C 180 ms, réaction courte (170–200 ms) de
**trois ennemis visibles au maximum**. CSS sans boucles, timers,
particules, filtres, ni animation de cases inconnues ; respect de
`prefers-reduced-motion`. Les sprites SVG restent 24×24,
les quatre capuches, trois ennemis, sauvegardes, brouillard, ASCII
et mécaniques sont intacts. **381/381 tests Node et 58/58 Chromium**, Chrome Android 13 et APK
**automatisés validés** ; captures Nhal 320×640, 360×780, 393×704
inspectées, dimensions de carte et cibles tactiles stables. [Contrat ART-097B2](docs/ART097B2_TURN_BOUND_MOTION.md).

**ART-097C1 — PR #54 fusionnée**, commit `1dca3fd` :
nouveau sconce mural purement décoratif SVG 24×24, uniquement sur un mur
visible adjacent à un sol visible, placé par hash de terrain déterministe,
sans objet de jeu ni gain de vision. Accent lumineux statique **ambre**
autour des appliques, **turquoise** autour des vrais `E` (Arches),
**cramoisi** autour des vraies `^` (Failles) : seulement sur cases
**actuellement visibles** et voisines cardinales visibles, jamais dans
le brouillard, sur un souvenir ou à travers un mur. Pas de filtre global,
de shader, de boucle d'animation, d'effet sur PJ/ennemis/ciblages.
`docs/nhal-lighting.js`, `docs/art097c1.css`, `docs/tiles.js`,
cache PWA versionné et tests Node/Chromium avec fixture réel 11×11.
Aucun changement de gameplay, sauvegarde, ASCII ou moteur.
[Contrat et recette ART-097C1](docs/ART097C1_VISIBLE_LIGHTING.md).
**385/385 tests Node, 59/59 Chromium, Chrome Android 13 et APK
validés en automatisation.** Capture de scène fog-safe torche/Arche/Faille
et portraits Nhal examinés ; aucune lumière sur case inconnue ou
mémorisée, aucun halo de personnage, interfaces tactiles préservées.

**QA-097 — PR #55 fusionnée**, commit `903ec15` (branche `qa/qa097-android-acceptance`) :
gel des mécaniques et des effets supplémentaires ; tests Playwright
tactiles sur 320×640 / 360×780 / 393×704 (13 centres réellement
touchables et ≥44×44 px, carte et navigation sans recouvrement,
brouillard/intentions/lumières sans fuite), 22 rendus de carte mesurés
par format en diagnostic Chromium, sauvegarde et tours inchangés.
[Recette QA-097](docs/QA097_ANDROID_ACCEPTANCE.md) et
[fiche terrain 5×2](docs/QA097_FIELD_REPORT_TEMPLATE.md).
**385/385 tests Node, 60/60 Chromium, Chrome Android 13 et build APK
émulés verts**. Les 13 cibles réellement touchables sur 3 formats
(largeur minimale 47 CSS px, hauteur minimale 44), 44 cases masquées
sans lumière ni hostile divulgué par format ; 22 rendus sans changement
de tour/sauvegarde. Médiane Chromium CI 0,9 / 0,8 / 0,8 ms,
**pas un FPS Android réel**. Captures QA-097 et JSON enregistrés dans
[l'artefact du workflow](https://github.com/MAthiks/Rogov-Android/actions/runs/44706385938). **NO-GO artistique tant qu'aucun test physique
Android ni campagne 5 testeurs × 2 descentes n'est constaté.**
Ne pas rehausser DA 6/10 ou Alpha 7,5/10 sur la seule base de la CI.

**APK-098A — Correctif de distribution en cours, PR à valider :**
audit du workflow `android-debug.yml` : son APK reste un ancien prototype
**Kotlin/ASCII v0.1.3-compat**, malgré l'interface Web/PWA moderne
UI/ART-097. La CI Android Chrome 13 vérifie la **PWA**, pas l'ancien
APK. Nouveau module `:webapp` indépendant, package
`com.rogov.webapk`, WebView HTTPS locale et fichiers `docs/` réellement
empaquetés, sans changer le moteur ni les sauvegardes Web. Nouveau
workflow Android 13 avec tests CDP de 121 tuiles, Sprite C, panneaux,
ASCII, sauvegarde reprise et absence de réseau. Ancien APK et données
Kotlin non écrasés ; **sauvegardes Chrome et WebView isolées,
migration non fournie**. [Contrat APK-098A](docs/APK098A_CURRENT_PWA_ANDROID.md).
**Ne pas déclarer le nouvel APK livré avant CI et inspection de capture.**

**Suite WIP=1 :** fiabiliser le nouvel APK, puis tester réellement
graphismes, FPS ressentis, commandes et sauvegardes sur téléphone ;
corriger les P0/P1 reproduits avant ART-097C2. Godot/PC reportés.

**Gate humaine :** captures et gestes Android réel, brouillard/ASCII/offline et test de 5 participants × 2 descentes requis avant d'augmenter la note artistique provisoire de 6/10 ou l'Alpha de 7,5/10.

## Plateformes — Android en priorité, PC conservé dans le GDD

**Décision du 19 novembre 2026 :** poursuivre exclusivement la **production active sur Android** (PWA/JavaScript, APK et tests tactiles). **Godot est mis en attente** : pas de changement de moteur ni de projet de migration actif. Le **portage PC futur**, Windows en premier, reste inscrit comme objectif de long terme, avec moteur à choisir après stabilisation du gameplay mobile et tests utilisateurs. Préserver autant que possible les règles déterministes, le mode ASCII, les assets Sprite C et les contrats de sauvegarde pour réduire le coût d'une éventuelle adaptation. Aucune date de portage annoncée.

Référence : [GDD exploration v0.9, §16 — stratégie de plateformes et portage PC](docs/GDD_EXPLORATION_NHAL_V0.9.md).

## NAR-094 — Enquête persistante dans les Chambres de l'Écho

Après validation qualitative initiale des textes NAR-093, relier **une véritable interaction de Chambre de l'Écho** à une preuve persistante. Chaque descente profonde possède une Chambre et délivre au plus **un nouvel indice** ; trois indices sont écrits, enregistrés et consultables au refuge et dans le rapport. Mort, Rappel, extraction, sauvegarde, classe et mécanique de combat inchangés ; sauvegardes antérieures sans champ de preuve encore valides. [Dossier NAR-094](docs/NAR094_PERSISTENT_ECHO_INVESTIGATION.md). **Le mystère final et les chapitres de campagne restent à concevoir**, puis à valider humainement via QA-092.


## NAR-093 — Priorité produit : objectif et compréhension du monde

Suite au retour terrain « Pas d'objectif réel. Le lore est confus », avant les nouveaux donjons et UI-092B/C/D : **introduire L'Égaré, Veyr, Nhal et le Rappel**, formuler un premier objectif **atteignable par les règles actuelles** (extraire un Fragment), puis donner les consignes adaptées au butin transporté/sécurisé. [GDD ciblé](docs/NAR093_MISSION_AND_LORE.md) · [Issue #25](https://github.com/MAthiks/Rogov-Android/issues/25).

Le long terme — découvrir l'origine du Rappel et les traces d'une cité enfouie — reste un **mystère sans quête persistante implémentée** ; concevoir ces jalons seulement après validation humaine de la prémisse. Aucun changement de sauvegarde ni de moteur pour NAR-093.


## QA-092 — jalon studio prioritaire avant Alpha 0.8

**Audit engagé :** [compte rendu de production et critères de GO/NO-GO](docs/QA092_STUDIO_AUDIT.md), [protocole humain](docs/QA092_PLAYTEST_PROTOCOL.md). Nouveaux tests Node couvrant extraction réelle, coffre, Rappel, forge, deuxième descente et 30 générations profondes ; tests Chromium en portrait 320/360/393 px sur le parcours complet. **Ce n'est pas une homologation Alpha 0.8 : 5 testeurs × 2 descentes et téléphone physique restent requis.** Constat UX : la sélection de préparation emporte un exemplaire par type d'objet, ce qui mérite observation avant UI-092B/C. UI-092B/C/D et le contenu supplémentaire passent après les P0 de jouabilité.

## UI-092A — descente plein écran mobile (prototype)

**UI-092A** est le premier lot de la maquette UI v2 : carte centrale, HUD compact, commandes/déplacement/soins toujours disponibles en bas, six raccourcis de consultation et panneaux contextuels en tiroirs (sans duplication de commandes). [Document d'intégration et QA](docs/UI092A_ANDROID_COCKPIT.md). **Le gameplay et les sauvegardes restent inchangés** ; validation CI et recette sur Android physique nécessaires avant approbation visuelle. Les lots **UI-092B** (Refuge), **UI-092C** (inventaire), **UI-092D** (personnage et navigation) restent séparés.

## UI v2 — maquette de refonte Android enregistrée (conception)

La [maquette de l'interface ROGOV v2](docs/UI_V2_MAQUETTE_V1.md) propose quatre écrans (Refuge de Veyr, descente Nhal, inventaire, personnage) avec HUD et pavé tactile fixes en descente, palette dark fantasy Sprite C et navigation sans longs défilements. **Statut : référence de conception ; première tranche UI-092A développée.** Les chiffres, objets et actions non présents dans le moteur sont illustratifs. Priorités proposées : **UI-092A** (HUD et descente), **UI-092B** (refuge), **UI-092C** (inventaire), **UI-092D** (personnage et navigation) ; DEV-090D et QA mobile seront réarticulés avec ces lots. Préserver ASCII, sauvegardes, mécanismes, PWA hors ligne et compatibilité Android. L'image de la maquette est fournie dans la conversation ; son original binaire n'est pas encore archivé dans ce dépôt.

## Produit prioritaire : Web HTML/PWA pour Android

| Version | État | Livrable |
|---|---|---|
| 0.1–0.3 | Livré | Refuge, descente, extraction/Rappel, sauvegarde, carte, journal |
| 0.4 | Livré | Deux ennemis, première DA, combat simple |
| 0.5 | Livré | Soins, attente, état de santé |
| 0.5.1 | Livré | Écran titre |
| 0.6 | Livré | Bible visuelle lovecraftienne, Charognard/Gardien revus, Larve de faille |
| 0.6.1 | Livré | Correctif responsive et cache Android |
| 0.6.2 | Livré | Sélection sans tour, panneau contextualisé et intentions (aperçu) |
| 0.7a | Livré | Attaque explicite ; esquive, parade, blocage et repli |
| 0.7b | Livré | Six attributs héros/ennemis, équipement, migration et fiche repliable |
| 0.7c | Livré | Jets de toucher/critiques, défense active influencée par équipement, Endurance et RNG sauvegardé |
| 0.7d | Livré | Gardien : préparation/coup lourd/garde haute ; intentions du Charognard et de la Larve |
| 0.7e | Livré | Carte, dangers, reliques, ennemis, extraction variables après l'introduction ; voies de retour contrôlées |
| **0.7f** | **Économie de refuge (prototype)** | Fragment de cendre convertible en Lame cendrée ou Bandages ; investissement risqué et forge de Veyr ; QA Android à faire |
| **0.7** | **Combat hybride en prototype ; équilibrage et validation humaine à faire** | **Combat hybride sur carte + panneau contextuel, cibles explicites, distances, défenses actives, intentions et repli** |
| 0.8 | À cadrer | Équilibrage combat / économie d'extraction / ergonomie |
| 1.0 | À cadrer | Version testable élargie, progression et contenu stabilisés |

**Référence de la prochaine version :** [GDD combat v0.7](docs/COMBAT_DESIGN_V0.7.md) et [prompt v0.7](docs/DEV_PROMPT_V0.7.md).

**Nouvelle direction systémique (conception) :** [caractéristiques, équipement, critiques, classes et magie](docs/STATS_EQUIPMENT_CLASSES_V0.7.md). Avant d'ajouter des sorts, développer les six attributs communs aux personnages et adversaires, les calculs d'équipement, les chances de critique/parade/blocage et l'Endurance de combat.

**Critères de la cible Alpha 8/10 :** [bilan de studio et scorecard](docs/QUALITY_REVIEW_6_TO_8.md). DEV-070 (contrat), DEV-071 (panneau) et DEV-072 (actions tactiques) sont développés. DEV-073A (attributs) et DEV-073B (jets statistiques reproductibles) sont développés ; DEV-073C (intentions avancées et garde du Gardien) est développé ; **QA-074 sur Android et équilibrage** sont les prochains jalons.

**Audit Alpha 8/10 (QA-074, 17/11/2026) :** [résultats détaillés](docs/QA074_ALPHA_8_ASSESSMENT.md). Les 129 tests sont verts mais **la note 8/10 n'est pas validée** : variété insuffisante (trois extractions identiques sans dégâts), Fragment de cendre non utilisé, absence de validation mobile et de 5 testeurs. VAR-077 et ECO-078 sont implémentés en prototypes. La **recette Android réelle**, l'équilibrage des coûts et les retours de **5 testeurs × 2 descentes** priment sur les nouvelles classes/sorts.

## Direction artistique — Sprite C validé

**Décision validée le 18 novembre 2026 :** la planche « Sprite C », **PJ avec capuche relevée dans les quatre directions**, constitue la nouvelle référence visuelle de ROGOV. Garder la palette sombre et la lisibilité tactique : personnages identifiables à 24×24 px, Charognard bas, Gardien massif, Larve segmentée, portes/coffres/pièges avec états distincts. PNJ du refuge en concepts, pas encore en gameplay. [Contrat graphique et lots ART-091A à ART-091D](docs/ART_DIRECTION_SPRITE_C_V1.md).

**ART-091A — L'Égaré encapuchonné implémenté** : quatre vues SVG 24×24 bas/haut/gauche/droite, direction selon déplacements réels, compatibilité ASCII, sauvegardes et PWA offline. [Contrat d'intégration et recette](docs/ART091A_IMPLEMENTATION.md). Les tests automatisés et la recette physique Android conditionnent la validation artistique finale. **ART-091B**, **ART-091C** et **ART-091D** ont ensuite été engagés par lots séparés. DEV-090D (interface de préparation) et DEV-089D (familles architecturales) sont des chantiers distincts.

**ART-091B — Silhouettes ennemies Sprite C intégrées en prototype** : Charognard bas à bec osseux et griffes, Gardien déchu massif et cuirassé, Larve de faille segmentée horizontale. Trois SVG 24×24 isolés dans `docs/enemy-art.js` ; tous les indicateurs de danger, PV, intentions, brouillard et mode ASCII restent conservés. [Contrat d'implémentation et QA](docs/ART091B_IMPLEMENTATION.md). La validation esthétique sur téléphone physique reste ouverte. Les lots suivants sont **ART-091C** (lieux) et **ART-091D** (concepts PNJ et objets).

**ART-091C — Interactifs et lieux Sprite C développés** : 15 SVG originaux de 24×24 dans docs/interaction-art.js, portes ouvertes/fermées, coffres, quatre états de pièges, Arche/faille, secret révélé et salles de Nhal (atelier, Écho, cache, site résolu). Compatibilité sauvegardes, ASCII, brouillard et fonctionnement hors ligne. [Contrat et recette ART-091C](docs/ART091C_IMPLEMENTATION.md). Validation visuelle sur Android physique encore ouverte. **ART-091D** conclut le cycle graphique sans ajout de nouvelles mécaniques.

**ART-091D — Icônes et concepts de Veyr intégrés** : 5 icônes originales 24×24 pour tous les objets existants (coffre et sac), 3 concepts de PNJ (Gardien du refuge, Forgeron de reliques, Érudite de l'Écho) dans une galerie repliable et clairement non interactive. Aucun acteur ou dialogue ajouté ; ASCII, mécanique, économie, sauvegardes et mode offline conservés. [Contrat et QA ART-091D](docs/ART091D_IMPLEMENTATION.md). **La série ART-091A → ART-091D est techniquement complète**, sous réserve des tests automatisés et de la recette esthétique sur Android réel. Priorité suivante : QA-074 puis DEV-090D (préparation du refuge) ; DEV-089D reste distinct.

## Priorité UI Android — DEV-090

**DEV-090A livré et fusionné (PR #13, 18 novembre 2026)** : le terrain, le pavé directionnel, l'attente et les soins sont regroupés ; quatre raccourcis de navigation sans tour et une légende pliable réduisent le défilement sur Android. CI : **220/220 tests moteur, 16/16 tests Chromium mobile, Chrome Android 13 et APK réussis**. Recette sur appareil physique encore à confirmer.

**DEV-090B livré et fusionné (PR #14, 18 novembre 2026)** : dock de combat à proximité de la carte, cible et intention visibles, PV ennemis, cinq actions sur deux rangées et détails repliables. CI : **221/221 tests moteur, 18/18 Chromium mobile, Android 13 Chrome et APK réussis**. La mécanique du combat et la compatibilité des sauvegardes sont inchangées. **DEV-090C livré et fusionné (PR #15, 18 novembre 2026)** : dock « À portée », coffre/porte/piège/secret/site contextuels, cinquième raccourci gratuit et sac repliable avec jauge et catégories. **222/222 tests moteur, 21/21 Chromium mobile, Chrome Android 13 et APK réussis**. Prochaine proposition : **DEV-090D**, interface de préparation et d'équipement au refuge. **DEV-089D** reste suspendu pour l'instant.

## Exploration profonde de Nhal — GDD v0.9

Le [GDD exploration v0.9](docs/GDD_EXPLORATION_NHAL_V0.9.md) est la référence courante. La [v0.8](docs/GDD_EXPLORATION_NHAL_V0.8.md) reste archivée comme jalon initial. **DEV-080 à DEV-088 sont intégrés à la version Web jouable** (salles/couloirs/portes, visibilité, secrets, pièges, événements, extraction). Ils ont été validés par les suites de tests et le déploiement GitHub Pages ; l'utilisateur a confirmé le fonctionnement de DEV-088 sur Android.

**DEV-089A, DEV-089B et DEV-089C sont fusionnés** le 18 novembre 2026 : nouvelles formes de salles, textures SVG 24×24, graphes de 8 à 12 salles, liaisons transversales et itinéraires de retour validés. Reste **DEV-089D** pour les familles de secteurs ; les impasses facultatives dotées de récompenses spécifiques restent un chantier de design futur.

| Lot | Statut | Livrable |
|---|---|---|
| DOC-079 | GDD v0.8 archivé | Contrats d'exploration, sécurité du retour |
| DEV-080 à DEV-088 | **Livrés** | Donjon profond, secrets, pièges, salles spéciales et rapport d'extraction |
| **DEV-089A** | **Livré — PR #10** | Salles en L, piliers, alcôves et secteurs effondrés avec géométrie réelle |
| **DEV-089B** | **Livré — PR #11** | Direction artistique « ruines de pierre froide », tiles SVG 24 × 24, palette et états lisibles |
| **DEV-089C** | **Livré — PR #12** | Graphe variable de 8 à 12 salles, liaisons et boucles ; deux voies de retour sécurisées |
| **DEV-089D** | À développer | Ruines, galeries, forteresse enfouie et complexe fracturé comme familles architecturales |

**WIP = 1.** Deux trajets de retour indépendants, aucun secret ni piège obligatoire, tests multi-graines, compatibilité des sauvegardes, cohérence ASCII/graphique, consultation du brouillard et recette Android réelle à chaque étape.

## Principes de production

- WIP = 1 : un lot actif, tests automatisés avant déploiement.
- Conserver les sauvegardes existantes, les graphismes originaux, le mode ASCII, les commandes tactiles et le jeu hors ligne.
- La mort déclenche le Rappel ; le sac est perdu, le coffre et la progression restent acquis.
- Inspirations : Darkest Dungeon pour la lecture tactique et la tension, Escape from Tarkov pour le risque d'extraction, roguelikes pour la carte. **Aucune copie visuelle ou mécanique servile.**

## Voie Android native — historique séparé

Le prototype Kotlin/APK de compatibilité reste disponible dans `app/`, mais il n'est **pas** le canal de diffusion prioritaire. Les anciennes étapes Kotlin/ASCII → génération procédurale → classes → boss → graphismes ont été replanifiées et ne représentent plus une séquence de livraison active.
