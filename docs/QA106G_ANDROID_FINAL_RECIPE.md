# ROGOV — QA-106G : recette graphique et ergonomique finale Android

**Ouverture :** 22 novembre 2026  
**Base de recette :** `main`, UI/ART-106F fusionné via PR #83 — `cc4b7bd348f75f5e5e93a7bdda1e298ed223e5e3`  
**État :** protocole prêt ; **validation sur Android physique NON réalisée**.  
**Objectif :** décider du GO graphique Android, puis redonner la priorité aux mécaniques de dungeon crawler et à l'exploration.

## 1. Périmètre impératif

- Vrais écrans, non maquettes : Veyr (refuge), Nhal (carte, combat et six raccourcis), sac/équipement, fiche de l'Égaré, journal, interactions, rapport.
- Sprite C encapuchonné en quatre directions ; sprites d'ennemis, coffres, pièges, Arche et Faille identifiables sans cadres artificiels.
- Grilles du moteur : **15×9 pour le tutoriel** et **11×11 pour Nhal profond**. La caméra peut varier, pas les règles ni la géométrie.
- Brouillard de guerre, états visibles/mémorisés/cachés, IA, RNG, tours, PV/END, butin et extraction authentiques.
- Compatibilité de la sauvegarde **`rogov-web-v1`**, reprise d'une partie antérieure, PWA hors ligne, Chrome Android et deux APK WebView.
- Aucun écran statique de substitution ni nouvelle mécanique ajoutée dans QA-106G.

## 2. Prérequis déjà vérifiés (automatique ; 22/11/2026)

**Commit d'entrée :** `e4ad7b7e28e7555b21318252f715aace3832a31a` sur PR #83. **Fusion :** `cc4b7bd348f75f5e5e93a7bdda1e298ed223e5e3`.

| Workflow | Résultat | Exécution |
| --- | --- | --- |
| Web / Chromium | succès | https://github.com/MAthiks/Rogov-Android/actions/runs/45069468562 |
| Chrome Android 13 | succès | https://github.com/MAthiks/Rogov-Android/actions/runs/45069468596 |
| APK Android classique | succès | https://github.com/MAthiks/Rogov-Android/actions/runs/45069468584 |
| APK WebView moderne | succès | https://github.com/MAthiks/Rogov-Android/actions/runs/45069468552 |

Artefact Chromium `qa096-chromium-portraits` (ID 14773415373) : captures UI/ART-106F du sac, de la fiche (via Options), du journal en **320×640, 360×800, 393×704, 412×915**, et du combat **360×780**. Contrôle visuel initial : panneaux au-dessus du pavé tactile ; aucun chevauchement évident des raccourcis et du pavé à 320×640. **Ce contrôle n'est pas une approbation sur appareil réel.**

## 3. Matrice et scénarios de recette

| Environnement | Format / scénario | Résultat attendu |
| --- | --- | --- |
| Chromium automatisé | 320×640, 360×800, 393×704, 412×915 | Sans débordement horizontal ; six raccourcis, D-pad et Actions atteignables ; tailles tactiles au moins 44px |
| Chrome sur téléphone Android | petit format et format nominal | Taps réels, scroll des volets, retour au jeu et clavier virtuel sans dysfonctionnement |
| PWA Android installée | en ligne puis hors ligne | Cache à jour, chargement et reprise identiques |
| APK Android classique | ouvrir, jouer, quitter, relancer | Aucune régression de rendu, déplacement ou sauvegarde |
| APK WebView moderne | ouvrir, jouer, quitter, relancer | Même contrat, notamment après fermeture forcée |
| Tutoriel | grille 15×9 | Tour, zoom, brouillard, gestes, transitions et raccourcis corrects |
| Profondeurs | grille 11×11, plusieurs salles et étages | Déplacements, combat, FOV, objets et transitions corrects |

### Scénarios obligatoires (consigner appareil, OS, version, captures et résultat)

1. **Écran Nhal** : bannière, PV/END/sac dynamiques, carte dominante, danger issu d'ennemis visibles seulement, six destinations fonctionnelles, D-pad et Actions sans chevauchement, notamment en 320×640.
2. **Personnage et lecture des sprites** : Sprite C (N/S/E/O), quatre familles de reliefs, silhouettes des ennemis, coffres, pièges, Arche et Faille ; distinguer les états sans ouvrir un panneau.
3. **Inventaire et personnage** : ouvrir, défiler, équiper/retirer/utiliser lorsque possible ; actions payantes consommant exactement leurs tours ; une seule fiche `#actor-stats-sheet` avec valeurs authentiques.
4. **Combat** : sélectionner une cible visible sans dépenser de tour, vérifier PV/intention, attaquer, esquiver/parer/bloquer, fermer puis rouvrir le volet sans duplication ; lire les commandes même en écran court.
5. **Journal, interactions et rapport** : scroller jusqu'en bas, vérifier données réelles, fermer, retrouver la carte et déplacer le héros ; aucun scroll capté par le contrôleur de mouvement.
6. **Brouillard, tours et reprise** : ne jamais montrer de menaces derrière les murs, conserver l'état des tuiles ; enregistrer, recharger, relancer et comparer position, tour, inventaire, ennemis et progression.
7. **Hors ligne** : passage avion après installation de la PWA et des APK, poursuite de l'expédition, retour en ligne sans perte ou corruption.
8. **Refuge de Veyr** : coffre sécurisé, forge, Échos, personnage, départ en expédition, extraction/Rappel ; aucune perte d'objets ou ressources au simple changement d'écran.
9. **Fatigue ergonomique** : jeu au pouce sur petit et grand écran, lisibilité contraste/tailles, action principale et boutons de fermeture accessibles sans zoom imprévu.

## 4. Comparaison artistique avec la référence

Comparer les captures réelles à l'image de référence transmise le 22/11/2026 : proportions (carte prioritaire), matériaux fer noirci/pierre/bronze, profondeur des murs, lisibilité Sprite C, palette nocturne, panneaux et zone tactile. Photographier ou capturer **le jeu exécuté sur Android**. La référence originale n'est pas encore versionnée dans le dépôt : ne pas prétendre à une mesure de correspondance pixel à pixel tant qu'elle n'y figure pas.

## 5. Défauts, décision et sortie

- **P0** : crash, sauvegarde perdue, commandes inaccessibles, erreur de combat/tour, carte bloquée, révélation du brouillard, impossibilité de reprendre. **Bloquant.**
- **P1** : panneau important illisible, overlap tactile, action masquée, contraste très insuffisant, réplication régulière du défaut sur Android. **Bloquant pour GO graphique.**
- **P2** : finition mineure ne compromettant ni la lecture ni le gameplay ; consigner et prioriser.
- **GO QA-106G** uniquement avec P0=0, P1=0, les quatre CI vertes sur la version candidate, parcours physique validés et non-régression `rogov-web-v1`.
- **Essais humains à planifier** : cinq joueurs, deux descentes chacun ; journaliser incompréhensions, choix de risque/récompense et envie de rejouer (cible indicative : 4/5). Ne pas confondre ces essais avec des bots/simulations.
- Une fois le GO graphique obtenu, reprendre **GAME-107** (cadrage à définir) : intérêt du combat, étages, exploration, variété des décisions et rejouabilité, dans l'esprit de Shattered Pixel Dungeon, sans copier son contenu.

## 6. Suivi

| Champ | Valeur actuelle |
| --- | --- |
| Code UI/ART-106F fusionné | oui, PR #83 |
| Tests CI sur dernier commit de PR | 4/4 réussis |
| Captures Chromium contrôlées | oui, 4 formats + combat |
| Tests Chrome Android physique | à faire |
| Tests PWA hors ligne physique | à faire |
| Tests APK classique / moderne physiques | à faire |
| Validation comparative screenshot référence | à faire |
| Tests 5 joueurs × 2 descentes | à faire |
| GO graphique Android | **non accordé** |

## 7. Actualisation après ART-107A — 23 novembre 2026

La **PR #84** a été fusionnée dans `main`, commit `751cac1609d6f7be5862f1335c677e5858e25d19`, après **4/4 CI réussies** sur `ddf717cd2ca3ae611313924db9418cb626e5b74f` (Web/Chromium, Chrome Android 13, APK classique, WebView moderne). [Checkpoint technique](ART107A_NHAL_WORLD_POLISH.md).

**Contrôles complémentaires requis sur téléphone physique :**
- Comparer la lisibilité des six sols, des différents murs et du pilier isolé en déplacement réel, avec lumière ambre et obscurité.
- Vérifier Sprite C dans les **quatre directions** à taille native sur 320×640 et 360×800, sans contour ajouté ; identifier les trois espèces ennemies sans lire leur nom.
- Identifier sans hésiter coffre fermé/ouvert, porte, Arche cyan et Faille verte ; comparer la visibilité des pièges *révélés* à celle des indices encore cachés.
- Contrôler que les nouveaux détails ne réduisent ni la perception des menaces, ni la lecture du brouillard et des salles mémorisées.
- Capturer un vrai écran Nhal en jeu, comparer à la référence graphique du projet et consigner les écarts de volume, d'échelle et de contraste.

Les captures Chromium du run Web PR #84 (artefact `qa096-chromium-portraits`, ID 14777849662) montrent le jeu complet, **pas** un protocole de comparaison avant/après de chacun des nouveaux sprites. Les tests automatiques et une première revue des captures sont rassurants, mais ne justifient pas un GO graphique. **Statut inchangé : recette Android physique et essai joueurs encore à faire.**


## 8. Actualisation après ART-107B — 23 novembre 2026

**PR #85 fusionnée** : `0e4f3beac0c63f89cb4343c7f505821f4cbb3b10`. Les quatre validations sont réussies sur le dernier SHA de branche `13db08ec3d9bbd4a98c299776ea03e26a40402b7`. Voir [checkpoint ART-107B](ART107B_NHAL_TILESET_CHECKPOINT.md).

### Points de recette physique supplémentaires

1. **Huit dalles de sol** : vérifier qu'elles se distinguent sans transformer des fissures naturelles en faux indices de piège. Comparer à la référence : la répétition de motifs demeure visible sur les captures automatiques.
2. **48 combinaisons de murs** : tester angles, couloirs et pilier isolé ; ne pas déduire de passages non découverts du raccord des murs.
3. **Objets et torches** : distinguer portes, coffres ouverts/fermés, Arche cyan, Faille verte, pièges révélés et appliques visibles en déplacement, brouillard partiel et éclairage.
4. **Personnages** : mesurer la lisibilité à taille Android du Sprite C encapuchonné quatre directions et des trois ennemis, sans cadres artificiels.
5. **WebView moderne hors ligne — P1 à surveiller** : répéter plusieurs cycles jeu → sauvegarde → fermeture forcée → reprise → mode avion → rechargement. Un premier essai automatisé du run PR #85 a perdu le processus WebView au moment du rechargement hors ligne (échec de `adb shell pidof`). La relance GitHub a réussi, mais la cause n'a pas été démontrée ni corrigée dans le moteur. Tout échec reproductible doit bloquer le GO QA-106G.
6. **Ergonomie** : contrôler l'absence de chevauchement des six raccourcis et du D-pad à 320×640, puis l'intégralité de l'interaction en 360×800, 393×704 et 412×915.

**Statut :** CI verte 4/4 sur le code fusionné, captures Chromium du véritable jeu examinées, **recette physique et GO graphique toujours non réalisés**.

## 9. Actualisation après ART-107B3/B4 — 23 novembre 2026

**PR #86 fusionnée** (commit `1128ad2796446f3d7b7e359bf4ebcb8ae0233c07`), avec **4/4 workflows GitHub verts** sur `94878a3b0af9faaaedc396f16fc3ea0823894a31`. Voir [checkpoint ART-107B3/B4](ART107B34_FLOOR_RHYTHM_CHECKPOINT.md).

### Scénarios de recette restants

- **Répétition du terrain** : inspecter des salles ouvertes et des couloirs pendant deux descentes, avec les 8 matériaux et leurs quatre rythmes. Les captures Chromium de la PR #86 confirment un changement subtil ; les mêmes grandes lignes de maçonnerie reviennent souvent. Noter l'intérêt d'un futur changement **structurel des formes de dalles**.
- **Acteurs et sites** : vérifier que Sprite C est identifiable en quatre directions sans cadre ajouté, ainsi que Gardien, Charognard et Larve ; ouvrir réellement les huit sites/passages connus et vérifier qu'aucun élément caché ou piège non révélé ne reçoit un sprite.
- **Navigateur/PWA** : 320×640, 360×800, 393×704 et 412×915 : écran Nhal 11×11, commandes utilisables, aucun recouvrement ou dépassement horizontal ; vérifier aussi le tutoriel 15×9.
- **WebView moderne — P1** : effectuer **trois cycles sur téléphone physique** : démarrer Nhal, laisser la sauvegarde s'écrire, fermer/relancer l'APK, reprendre la descente, activer le mode avion puis recharger/revenir. Contrôler les 121 cases et le même tour / contenu de sac, les menus et l'absence d'écran noir. Pendant CI PR #86, deux tentatives WebView ont perdu la connexion CDP après relance ; le dernier commit est vert. La cause n'a pas été démontrée et le problème n'est **pas considéré résolu sur matériel**.
- **Décision artistique** : comparer une capture du vrai téléphone avec la référence dark fantasy ; différencier la fidélité de composition (qui reste à améliorer) de la fonctionnalité (CI verte). N'accorder le GO graphique que sur observation réelle des scènes et bonne lisibilité.

**Statut :** volet technique ART-107B3/B4 terminé ; **QA-106G et GO graphique Android restent ouverts.**


## 10. Actualisation après ART-107C — 23 novembre 2026

**PR #87 fusionnée** : `317b0ae751e42caca775cd0a6f3e01b6f57f9837` ; **4/4 CI réussies** sur `f2cbaf9e1166f430f34ce17beb5ef90cb1231c83`. [Checkpoint de livraison](ART107C_NHAL_FLAGSTONE_GEOMETRY.md).

### Vérifications physiques supplémentaires

- **Quatre véritables géométries de pierre** : comparer les grands blocs, assises décalées, pierres allongées et maçonnerie cassée, de nuit en jeu. Vérifier que les jointures n'évoquent pas artificiellement un piège ou une Faille ; confirmer que l'Égaré et les trois ennemis restent lisibles sur les contrastes les plus clairs et sombres.
- **Écrans / appareils** : reproduire Nhal 11×11 à 320×640, 360×800, 393×704 et 412×915, ainsi que tutoriel 15×9 ; tester vraie pression sur six raccourcis, Attendre, déplacement, Actions, Bandage et Tonique. La QA Chromium de PR #87 montre 121 cases, aucune fuite d'ennemi ou de lumière, aucun overflow horizontal aux tailles mesurées, mais ne remplace pas un téléphone.
- **WebView hors ligne — P1 toujours ouverte** : répéter au minimum trois cycles sauvegarde → fermeture forcée → réouverture → reprise → mode avion → rechargement. Une première exécution ART-107C a échoué à retrouver le PID de l'application après rechargement hors ligne ; le run suivant est vert. Les journaux de diagnostic ont été ajoutés au test pour les prochaines récurrences, sans contourner une défaillance native réelle.
- **Fidélité artistique** : le nouveau motif réduit la monotonie des dalles, mais les grandes masses et l'échelle des personnages restent moins élaborées que la référence illustrée. Valider le contraste et la perception des chemins sur écran physique avant de décider s'il faut encore poursuivre la DA ou revenir au gameplay.

**Statut : ART-107C techniquement fusionné, recette graphique Android physique et GO final toujours non accordés.**
