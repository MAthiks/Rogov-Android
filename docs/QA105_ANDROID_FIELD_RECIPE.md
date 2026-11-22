# ROGOV — QA-105 : recette terrain Android après refonte des quatre écrans

**Base contrôlée :** `main`, commit `72eb028a1122b0035b1ce2a0354945568b44fe1b`, PR #74 fusionnée. GitHub Actions sur ce commit : Web/GitHub Pages, APK classique et WebView Android 13 **réussis**. Ce n'est pas une certification sur un téléphone personnel.

## Accès à la version à essayer

**PWA / Chrome Android (recommandé pour ce premier contrôle) :** [https://mathiks.github.io/Rogov-Android/](https://mathiks.github.io/Rogov-Android/). Utiliser un onglet classique Chrome, sans vider les données du site si une partie existe déjà.

**APK graphique** : le paquet `com.rogov.webapk` est proposé parmi les artefacts du workflow **APK-098A — Current PWA WebView Android** [GitHub Actions](https://github.com/MAthiks/Rogov-Android/actions). C'est un APK **debug de test**, et ses données ne sont pas automatiquement partagées avec la PWA ou Chrome. **Ne pas désinstaller une version qui détient une sauvegarde sans copie/export confirmé.**

## Session pratique : 8 à 12 minutes, sans prérequis narratif

**Avant le test.** Noter l'appareil, la version Android, le navigateur (ou l'APK) et si le jeu est déjà installé ; prendre une capture avant toute mise à jour. Ne pas vider le cache manuellement. Préserver une éventuelle partie.

| Étape | Geste à réaliser | Critère d'acceptation |
| --- | --- | --- |
| 1. Démarrage | Ouvrir la PWA en portrait puis « Nouvelle partie » (ou « Continuer » si sauvegarde existante) | Le titre ne recouvre pas le refuge ; aucune erreur blanche, aucun retour intempestif |
| 2. Veyr | Faire défiler l'accueil du refuge, appuyer sur Préparer, Forge, Échos, Égaré | Les quatre boutons mènent au panneau souhaité ; le bouton **DESCENDRE DANS NHAL** ne masque pas le dernier panneau une fois le défilement terminé |
| 3. Personnage | Ouvrir la fiche, dérouler « Détails et équipement », puis refermer | Portrait encapuchonné visible, six caractéristiques, six aptitudes et valeurs exactes, ouverture sans perte de position ni changement de sauvegarde |
| 4. Descente | Lancer une nouvelle descente | Carte et PJ lisibles ; texte de mission au-dessus de la carte ; pavé et soins disponibles au doigt ; aucune case visible artificiellement à travers le brouillard |
| 5. Combat / déplacement | Faire quelques déplacements, ouvrir/fermer Combat, observer une menace si présente | Les boutons répondent à une pression et le combat ne se déclenche pas seul ; les tours n'avancent que lors d'actions de jeu |
| 6. Sac | Ouvrir Sac, lire le matériel et refermer | Quatre emplacements réels et quantités lisibles ; la croix ferme le tiroir ; aucune commande de déplacement bloquée après fermeture |
| 7. Reprise | Recharger l'onglet ou fermer/réouvrir l'application, puis « Continuer » | La carte, le tour, les objets et la position sont les mêmes ; pas de nouvelle partie imposée |
| 8. Hors réseau | Après avoir chargé le jeu et enregistré une partie, activer temporairement le mode avion, recharger | Les ressources déjà mises en cache permettent au jeu installé/PWA de fonctionner hors ligne ; aucune sauvegarde perdue |

**Avertissements :** le mode avion peut interrompre les communications ordinaires du téléphone : désactiver après le test. Si une sauvegarde vaut la peine d'être conservée, ne pas entreprendre une réinstallation ni une suppression des données du site pour « tester la reprise ». La PWA et l'APK sont deux environnements de stockage indépendants.

## Captures utiles à transmettre

À 360–412 CSS px (et, si possible, avec l'échelle de texte Android habituelle) :
- **Nhal :** écran montrant carte, HUD et pavé.
- **Veyr :** panorama et quatre boutons de navigation, puis bas de la page avec le bouton de départ.
- **Sac :** tiroir ouvert, en restant à l'écart des données personnelles.
- **Personnage :** portrait, aptitudes et accordéon.

Pour un bug, noter simplement : écran, geste effectué, résultat attendu, résultat constaté, orientation et si la partie a été reprise d'une ancienne sauvegarde. Une capture est plus utile qu'un avis « ça marche » si l'élément chevauche une commande.

## Contrôles automatiques QA-105

Le test Playwright du navigateur couvre désormais les formats **360×800** et **412×915** (en plus des formats 320×640, 360×780 et 393×704 déjà testés) : clic réel sur Veyr et Égaré, visibilité des panneaux, grille de caméra conforme aux dimensions réelles fournies par le moteur (sans imposer 11×11), zone tactile du bouton d'attente et de fermeture du Sac, absence de débordement horizontal, reprise du jeu sans modification du nombre de tours.

Ces tests **imitent des dimensions Android**, mais ne peuvent pas certifier la luminosité de l'écran, les gestes sur une dalle tactile réelle, le comportement du bouton Retour système, l'accès aux fichiers, les performances de la batterie ou les réglages d'accessibilité propres au téléphone.

## Portée

Aucun changement de moteur `docs/game.js`, d'état des sauvegardes `rogov-web-v1`, de sprite, de brouillard, de prix, de tour ni de difficulté. Les résultats sur appareil physique ne doivent être déclarés **validés** qu'après retour explicite du testeur. Le portage PC/Godot reste reporté.
