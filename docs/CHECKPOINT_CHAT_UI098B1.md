# CHECKPOINT — ROGOV UI-098B1 (20 novembre 2026)

**Dépôt :** `MAthiks/Rogov-Android`.
**Point de départ :** `main af595bb2bf8354148884f9d6f6f809534d8a27ea`,
**identique** au suivi fourni lors de l'audit GitHub ; aucun commit
supplémentaire sur `main` à cet instant.
**Dernière PR fusionnée au départ :** APK-098A, PR #56.
**Branche de correction :** `fix/ui098b1-android-sheet-clearance`.
**Statut :** développement et revue automatique, **non fusionné** ;
en attente de validation sur téléphone réel.

## Résultat du QA physique fourni par l'utilisateur

- L'APK affiche le vrai jeu graphique, les déplacements sont fluides.
- Combat et Sac s'ouvrent, puis se ferment correctement ; le pavé reprend.
- L'application relancée conserve la position et l'état de la partie.
- **P1 :** les boutons de direction fixes **cachent partiellement
  le bas du Sac/Combat** ; « Ton sac est vide » est tronqué.

Aucune nouvelle vérification sur un téléphone réel n'a encore été faite
sur les fichiers UI-098B1.

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
Les tests et la construction de l'APK parallèle doivent être validés
par la CI avant de proposer le téléchargement au testeur.

## Avant fusion

1. Vérifier les tests `test-web`, `android-web`, `modern-apk`,
   `build` et capturer toute régression.
2. Validation du correctif sur vrai téléphone Android par l'utilisateur :
   Sac vide, sac rempli/long, Combat, toutes les actions, Fermer,
   déplacement, fermeture/relance, barres système visibles.
3. Fusionner uniquement après ces gates. La campagne humaine 5×2 et
   le GO artistique global restent ouverts, tout comme la signature de
   distribution stable APK-098A et le portage PC/Godot reporté.

Voir `docs/UI098B1_ANDROID_SHEET_LAYOUT.md`,
`docs/CHECKPOINT_CHAT_QA097.md` et
`docs/CHECKPOINT_CHAT_APK098A.md`.
