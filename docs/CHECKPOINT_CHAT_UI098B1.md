# CHECKPOINT — ROGOV UI-098B1 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`.
**Point de départ :** `main af595bb2bf8354148884f9d6f6f809534d8a27ea`,
**identique** au suivi fourni lors de l'audit GitHub ; aucun commit
supplémentaire sur `main` à cet instant.
**Dernière PR fusionnée au départ :** APK-098A, PR #56.
**Branche de correction :** `fix/ui098b1-android-sheet-clearance`.
**Statut :** contrôles CI 4/4 verts, **GO Android utilisateur reçu le 20 novembre 2026** ; PR #57 autorisée à la fusion.
La présente fiche est le checkpoint pré-fusion ; son statut final est suivi dans la PR #57.

## Résultat du QA physique fourni par l'utilisateur

- L'APK affiche le vrai jeu graphique, les déplacements sont fluides.
- Combat et Sac s'ouvrent, puis se ferment correctement ; le pavé reprend.
- L'application relancée conserve la position et l'état de la partie.
- **P1 :** les boutons de direction fixes **cachent partiellement
  le bas du Sac/Combat** ; « Ton sac est vide » est tronqué.

**Retour de recette UI-098B1 du 20 novembre 2026 : « On est ok ».**
Ce GO suit la demande explicite de vérifier le Sac, Combat, les contrôles,
la fermeture des panneaux et la relance sur Android. Il autorise la fusion
du correctif ergonomique. Il ne valide pas à lui seul la direction artistique
globale, les performances à grande échelle ni la campagne 5 × 2 joueurs.

## Implémentation sur la branche

- `docs/ui098b1.css` chargé après UI/ART-097 : le tiroir se place à
  une distance variable du bas du viewport, au-dessus du vrai dock
  avec 8px d'espacement ; hauteur limitée par l'espace disponible.
- `docs/ui092.js` : calcul depuis `getBoundingClientRect().top` du
  dock, `ResizeObserver` et événement `visualViewport.resize`.
- Seule la zone `#ui092-sheet-body` défile ; titre et **Fermer**
  restent accessibles. Lors de l'ouverture, son scroll revient en haut.
- `docs/sw.js` : cache offline renouvelé ; `:webapp` utilise
  automatiquement le même `docs/index.html` / CSS que la PWA.
- Tests de non-recouvrement, inventaire vide/rempli, action finale
  tactile et combat sur trois portraits Chromium. Mesure d'un dock
  volontairement agrandi incluse.
- Aucun changement de règles, de partie sauvegardée, d'ASCII, d'IA,
  de FOV, de Sprite C ni de module Gradle Android.

## Préparation du test Android physique sans désinstallation

La PR #57 fabrique dans son workflow `modern-apk` un second APK
**`com.rogov.webapk.pr57` — `ROGOV TEST PR 57`**, à partir des mêmes
fichiers `docs/`, sous une signature debug indépendante.
L'artefact dédié est `ROGOV-PR-57-side-by-side-Android` contenant
`rogov-pr57-side-by-side.apk`. La WebView de référence
`com.rogov.webapk` est toujours construite et testée séparément.
Le téléphone peut donc conserver **toutes les installations et
sauvegardes existantes**. L'APK de recette ne reprend pas l'ancienne
partie ; il faut une nouvelle partie de test.

Le test CDP de la WebView Android 13 contrôle désormais **la CSS
UI-098B1, la marge réelle entre le tiroir Sac et le pavé, la cible
Fermer, le texte Sac vide lisible et le défilement intérieur**.
La capture `rogov-webapk-ui098b1-bag.png` est archivée.
**Tests et APK parallèle certifiés par les workflows GitHub Actions de la PR :**
- [Node + Chromium](https://github.com/MAthiks/Rogov-Android/actions/runs/44725604009) : réussi.
- [Chrome Android 13](https://github.com/MAthiks/Rogov-Android/actions/runs/44725603886) : réussi.
- [WebView Android 13 + APK parallèle](https://github.com/MAthiks/Rogov-Android/actions/runs/44725603861) : réussi.
- [APK de compatibilité](https://github.com/MAthiks/Rogov-Android/actions/runs/44725603935) : réussi.

## Bilan de validation et décision de fusion

**GO CI :** les quatre workflows ont réussi ; les éléments WebView et
APK installable en parallèle ont été archivés. **GO utilisateur Android :**
confirmation « On est ok » reçue après les instructions de recette.
**Décision :** intégrer UI-098B1 à `main` via la PR #57 en conservant
le package d'essai isolé et le contrat de sauvegarde existant.

**Reste ouvert après fusion :** revue esthétique et mesures de confort
élargies, essai des 5 testeurs × 2 descentes, signature APK de
publication stable, Godot et portage PC différés. La suite prioritaire
est ART-097C2 (lisibilité sols, murs, silhouettes), sans altérer le
moteur ni l'interface tactile validée.

Voir `docs/UI098B1_ANDROID_SHEET_LAYOUT.md`,
`docs/CHECKPOINT_CHAT_QA097.md` et
`docs/CHECKPOINT_CHAT_APK098A.md`.
