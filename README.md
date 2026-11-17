# ROGOV v0.1.1 — Android First Build

Jeu original d'extraction roguelike au tour par tour en ASCII, solo et hors ligne.

## Boucle jouable

1. Préparer le matériel à Veyr (coffre permanent).
2. Entrer dans Nhal sur une carte ASCII tactile.
3. Récupérer `$` (butin, +1 XP par objet).
4. Atteindre `E` pour extraire : tout le sac retourne au coffre, +2 XP.
5. Entrer sur `^` provoque le Rappel : retour vivant à Veyr, perte totale du sac et du matériel emporté ; personnage et XP conservés.

Légende : `@` joueur · `#` mur · `$` butin · `^` danger mortel · `E` extraction.

## Compiler l'APK

Depuis le dépôt **public** GitHub `MAthiks/Rogov-Android`, ouvrir **Actions → Android APK — ROGOV**. Le push sur `main` déclenche le build ; l'action peut aussi être lancée manuellement via `Run workflow`.

Quand le build réussit, télécharger l'artifact **ROGOV-0.1.1-debug-apk**, extraire le ZIP et installer `app-debug.apk` sur Android.

La CI utilise Java 17, Gradle 8.13, AGP 8.13.2, Kotlin 2.3.21 et Android SDK 36. Le projet n'inclut pas de wrapper Gradle binaire ; la CI installe Gradle. L'APK n'est pas encore garanti compilable ni testé sur appareil.

## Modifier les données

Les objets et la carte se trouvent dans `app/src/main/assets/rogov/*.json`. Les règles du jeu sont dans `app/src/main/java/com/rogov/game/core`, indépendantes d'Android. Les sauvegardes locales versionnées sont gérées dans `android/data`. Les données restent embarquées dans l'APK : leur mise à jour nécessite une nouvelle version.

## Développement et droits

Le dépôt est public. Cela ne signifie pas que le code est librement réutilisable ni qu'il est exempt de droits ; aucune licence open source n'est accordée pour l'instant. Tous les éléments du jeu doivent rester originaux et éviter la reprise de ressources protégées d'autres jeux. Choisir explicitement une licence avant diffusion open source.

## Tests

`gradle :app:testDebugUnitTest` (dans un environnement Android/Gradle) vérifie extraction, mort, coffre, XP et collisions. Lire `KNOWN_BUGS.md` avant la distribution.
