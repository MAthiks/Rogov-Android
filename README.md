# ROGOV Android v0.1.3 — diagnostic de compatibilité

ROGOV est un roguelike d'extraction ASCII pour Android.

## Version de compatibilité (APK debug)

Cette **version de diagnostic** utilise un identifiant distinct : `com.rogov.android.compat`. Elle ne remplace pas les versions précédentes et ne modifie pas leurs sauvegardes.

Différences avec l'APK 0.1.2 :
- Target Android 13 (API 33) plutôt que Android 16 (API 36).
- Signatures APK v1 et v2 explicitement activées.
- Identifiant de paquet `com.rogov.android.compat` et libellé `ROGOV COMPAT`.
- Tests automatisés d'installation, de lancement et de signature sur émulateur Android 13.

**Ce n'est pas encore une application publiée sur le Play Store**, et sa signature debug change potentiellement entre les builds.

Le dépôt GitHub est public. Les droits des ressources originales restent à définir par une licence explicite ; aucune ressource d'un autre jeu n'est fournie.

## Boucle jouable

Refuge de Veyr → Descente → Butin → Extraction ou mort → Retour au refuge.

Le personnage et l'expérience persistent ; les objets transportés sont perdus en cas de mort. Le coffre permanent est protégé. Les données de jeu sont dans `app/src/main/assets/rogov`.

## Installation

Téléchargez le fichier .apk depuis la publication GitHub (Releases) ou l'artifact du workflow GitHub Actions de la version 0.1.3. Le fichier doit garder l'extension .apk et être ouvert depuis un gestionnaire de fichiers avec l'autorisation Android "Installer des applis inconnues".

Si l'installation échoue sur le téléphone malgré l'installation réussie sur émulateur, noter le message exact du Gestionnaire de paquets et vérifier les restrictions Samsung, la place disponible et l'installation d'autres applications externes. Ne pas désactiver Play Protect pour forcer l'installation.
