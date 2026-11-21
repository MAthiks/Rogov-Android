# UI-102 — Refonte du refuge de Veyr : hub de préparation

## Intention
Mettre Veyr au niveau visuel de Nhal après GAME-101G : un véritable refuge distinct du cockpit de combat, mais avant tout **fonctionnel**. Recomposition de l'écran existant, sans nouveau marchand, quête, lore bloquant ni mécanique.

## Livré
- Panorama pixel original de Veyr conservé ; composition cinématique sombre pierre, bronze, braises et légende « dernier abri ».
- Résumé du **vrai** coffre sécurisé (total d'unités), du **vrai** nombre de Fragments et de la **vraie** profondeur record ; aucune donnée inventée.
- Quatre accès rapides : Préparer, Forge, Échos, Égaré. Chaque raccourci vise le **panneau original**, sans copier ses contrôles. Accents tactiles et états actifs.
- Préparation de départ de 0 à 8 unités, vrais sélecteurs de quantité et d'équipement, barre d'occupation, nouvelle action « Tout désélectionner » limitée aux choix temporaires. Cette action ne retire **rien** du coffre.
- Forge de cendre : même deux recettes, même inventaire, mêmes prix et impossibilité si Fragments insuffisants. Cartes plus lisibles sur Android.
- Fiche originale de l'Égaré déplacée entre refuge/expédition comme avant ; Échos et lexique accessibles en bas d'écran.
- Un seul vrai bouton « DESCENDRE DANS NHAL », affichage de préparation en direct et zone fixe sûre sur smartphone.

## Contrat absolu
- Aucun changement de gameplay dans `docs/game.js`, de génération, de RNG ou de combat.
- Aucun changement à `SCHEMA_VERSION=1` ni à `rogov-web-v1`; `docs/refuge-dashboard.js` fournit uniquement des nombres d'affichage, sans stockage.
- Aucune duplication d'identifiant, de gestionnaire forge, de panneau personnage ou de bouton de départ.
- PWA et WebView Android partagent exactement la même interface et les mêmes sources en cache ; `docs/sw.js` versionné, usage hors ligne.
- Sprite C et sa direction artistique, 11×11, brouillard, inventaire de Nhal, D-pad et ASCII totalement conservés.

## Tests automatiques
- `tests/ui102-veyr-hub.test.mjs` : rendu dérivé pur, sauvegardes, contrôle des ID uniques, navigation et actions historiques, assets PWA.
- `tests/mobile-browser.test.mjs` : portraits 320×640, 360×780, 393×704 sans débordement ni bouton masqué ; navigation tactile, Échos et fiche ouverts, coche d'un objet, désélection sans sauvegarde et départ réel.
- Bloquants : `test-web`, `android-web` Chrome Android 13, `modern-apk` WebView Android 13 hors ligne et `build` APK de compatibilité.

## Recette sur téléphone physique, après CI
1. Ouvrir Veyr via Continuer (sauvegarde existante) et après retour d'expédition. Vérifier l'affichage des trois compteurs.
2. Tester les quatre accès et le défilement. Vérifier la fiche et les Échos sans retour involontaire au titre.
3. Choisir 1–8 unités, choisir une arme, revenir à zéro avec « Tout désélectionner » puis vérifier que le coffre n'a pas perdu d'objet.
4. Sans Fragment : forge indisponible. Avec Fragments : vérifier le prix, la fabrication réelle et les compteurs actualisés.
5. Essayer à 320, 360 et 393 pixels ; clavier Android, paysage, barre système et mode hors ligne. Vérifier le bouton de départ fixé au-dessus du bord bas.
6. Entrer dans Nhal, vérifier sac, déplacement et reprise sauvegardée. Ne pas désinstaller une APK ancienne pour tester la nouvelle.

**La CI valide le fonctionnement automatisé, pas le jugement esthétique ou l'ergonomie sur un appareil physique.** Tester l'impression de refuge « sûr » opposée à Nhal « menaçant » avant de clore l'Alpha.
