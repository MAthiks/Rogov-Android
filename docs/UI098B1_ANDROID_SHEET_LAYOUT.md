# UI-098B1 — Panneaux tactiques Android : lisibilité sans recouvrement

**Date :** 20 novembre 2026. **Statut :** branche de correction et PR à valider ; aucun GO physique anticipé.

## Défaut physique reproduit par le testeur

Sur le véritable ROGOV Android WebView, les menus **Combat** et **Sac**
s'ouvrent et se ferment, puis les déplacements fonctionnent de nouveau.
Cependant le dock directionnel fixe **masque le bas des panneaux**,
notamment le message « Ton sac est vide ». La persistance à la relance
a été confirmée par l'utilisateur ; elle ne doit pas être altérée.

## Correctif minimal

- Feuille **`docs/ui098b1.css`** chargée après les précédents styles UI/ART.
  Tiroir fixé **8 px au-dessus du haut réel** de `#field-controls`, et
  hauteur plafonnée par l'espace vertical restant ; z-index 78 contre 75
  pour le dock comme filet de sécurité en cas de variation de viewport.
- **`docs/ui092.js`** : le ResizeObserver existant mesure le dock ; la
  marge est désormais calculée depuis **sa position réelle** dans le
  viewport (`innerHeight - rect.top`) plutôt que sa seule hauteur.
  Réajustement lors d'un `resize` de WebView ou `visualViewport`.
- Le titre et **Fermer** restent en tête, hors zone défilante ; **seul**
  `#ui092-sheet-body` défile avec un `min-height:0` flex et
  `-webkit-overflow-scrolling:touch`. L'ouverture repart du haut du
  contenu (`mount.scrollTop=0`), même après un long inventaire.
- Le dock continue de fonctionner dans ses dimensions originales ; aucun
  contrôle de combat, d'équipement, de navigation, d'ASCII ou de FOV n'est
  réimplanté. Les mêmes nœuds DOM et listeners sont conservés.
- Cache PWA renouvelé et stylesheet incluse dans les assets offline ;
  le module Android `:webapp` empaquette toujours les vrais `docs/`.

## Recette automatique et gates

1. Node : contrat CSS/JS, cache offline, sauvegarde `rogov-web-v1`
   et schéma 1 inchangés.
2. Chromium tactile **320×640, 360×780, 393×704** : ouvrir Sac vide,
   puis Sac rempli de 8 types réels, faire défiler jusqu'à une action,
   contrôler ses coordonnées cliquables, la position du bouton Fermer,
   l'absence de collision `sheet.bottom < dock.top`, et l'absence de
   consommation de tour/écriture save.
3. Faire grandir artificiellement le padding du dock pour simuler les
   variations Android de safe-area/taille de police : le panneau se
   repositionne sans recouvrement.
4. Combat : vérifier le tiroir sur une cible visible ; vérifier que les
   actions tactiques défilent et restent accessibles, sans déclencher
   d'action en ouvrant/fermant.
5. Gates GitHub : `test-web`, `android-web`, `modern-apk` et
   `build` sans régression. Le rendu CI n'est pas un test téléphone réel.

## Recette sur téléphone réel après PR

Ouvrir **Combat** puis **Sac**, y compris avec du contenu conséquent.
Faire défiler jusqu'à la dernière ligne, toucher l'action finale si
approprié, vérifier que le pavé ne cache ni texte ni bouton. Fermer,
faire un déplacement, fermer l'APK et relancer sans effacer les données.
Tester si possible format portrait court et configuration avec barres
système Android affichées.

Ne **pas** désinstaller l'APK ni effacer les sauvegardes pour tester.
La séparation PWA/WebView/ancien prototype Kotlin décrite dans
`APK098A_CURRENT_PWA_ANDROID.md` demeure. GO artistique/5×2 ouvert,
Godot/PC reporté.


## Distribution de la recette sans risquer la partie existante

La PR #57 produit désormais **deux builds Android distincts** :
la WebView de référence `com.rogov.webapk` (utilisée uniquement pour
la recette de non-régression Android 13) et un APK de test
**installable à côté** de l'application déjà en service,
`com.rogov.webapk.pr57`, avec l'intitulé **ROGOV TEST PR 57**.

Le nouvel APK de recette a son **propre stockage privé WebView**.
Il ne remplace pas l'APK existant, ne lit pas sa sauvegarde, et ne permet
**aucune migration automatique**. Cette séparation est volontaire :
les APK debug GitHub Actions peuvent ne pas avoir la même signature
d'une exécution à l'autre. **Ne pas désinstaller l'application actuelle
pour contourner un refus de mise à jour de signature.**

### Installation et recette physique

1. Dans la [PR #57](https://github.com/MAthiks/Rogov-Android/pull/57),
   ouvrir **Checks** puis la dernière exécution **modern-apk** réussie.
   Dans **Artifacts**, récupérer
   `ROGOV-PR-57-side-by-side-Android`, extraire
   `rogov-pr57-side-by-side.apk` et installer cette application
   distincte. L'artéfact GitHub est conservé 30 jours.
2. Démarrer une **nouvelle partie de recette** dans **ROGOV TEST PR 57** ;
   ne pas compter sur la récupération de la partie de la PWA ou de
   `com.rogov.webapk`.
3. Ouvrir **Sac** vide puis rempli, déplier les options, faire défiler
   jusqu'à la dernière action ; vérifier qu'aucun texte/bouton ne passe
   derrière les flèches.
4. Ouvrir **Combat**, choisir une cible si possible, faire défiler
   jusqu'à la dernière commande ; refermer avec **Fermer** puis déplacer
   le personnage.
5. Fermer et relancer seulement l'application de test ; vérifier que
   la nouvelle sauvegarde de recette persiste. L'APK/PWA habituels
   doivent rester installés et inchangés.

### Preuves émulateur supplémentaires

Le workflow `modern-apk` contrôle dorénavant dans la **véritable
WebView Android 13** que la CSS UI-098B1 est chargée, que la bordure
inférieure du panneau reste au-dessus du dock fixe, que **Fermer**
reste touchable et que « Ton sac est vide » est entièrement lisible.
Une capture native `rogov-webapk-ui098b1-bag.png` accompagne l'APK.
La preuve automatique ne remplace pas l'essai du vrai téléphone.
