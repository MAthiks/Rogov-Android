# ROGOV — UI/ART-106F : panneaux secondaires de Nhal

Date : 22 novembre 2026  
Base : UI/ART-106E fusionné (PR #81, commit 790c765)  
Branche : feature/uiart-106f-secondary-panels

## Objectif

Harmoniser les **vrais panneaux existants** avec la direction artistique de Nhal : fer noirci, ardoise, laiton sculpté, écriture ivoire. Pas de fausse fiche ni de nouvelle mécanique.

## Périmètre

- **Volet Android réel** : #ui092-sheet et #ui092-sheet-close sont rehaussés de matériaux forgés. Mesure de hauteur UI092 et décalage UI098B1 conservés au-dessus du D-pad.
- **Inventaire** : #bag-panel, #bag-equipped (quatre emplacements), #bag-items et #bag-meter originaux. Les gestionnaires et coûts des actions d'équipement, d'utilisation et d'abandon restent ceux du moteur.
- **Combat** : véritables cibles visibles, jauge de vie, intention et commandes Attaquer / Frappe de brèche / Esquiver / Parer / Bloquer / Repousser / Reculer, avec palette cuivre et fer.
- **Journal** : #history-details et #journal natifs, avec accent acier froid et vrais événements.
- **Personnage** : une seule fiche #actor-stats-sheet, accessible via Options / #ui099-extras ; vrai portrait, six attributs et valeurs calculées.
- **Rapport et actions à portée** : matériaux cohérents sur les panneaux existants.

## Technique

- docs/uiart106f.css chargé après 106A–E, limité à l'expédition mobile (largeur maximale 730 px).
- docs/ui092.js applique temporairement data-panel au volet pour sélectionner une palette, puis le supprime à la fermeture. Aucune sauvegarde et aucun nouveau contrôle.
- Précache PWA/APK actualisé. Moteur, tiles, IA, RNG, tours, FOV et sauvegardes rogov-web-v1 inchangés.

## Recette

- Tests unitaires pour les vrais IDs, l'absence de doublon de fiche et la conservation de la sauvegarde.
- Captures Chromium des volets à 320x640, 360x800, 393x704, 412x915.
- Combat avec cible existante : sélection, esquive et tour consommé, fermer/réouvrir sans duplication.
- Défilement du journal et de la fiche, contrôles tactiles d'au moins 44 px, panneau au-dessus du D-pad.
- Quatre workflows CI Web / Android 13 Chrome / APK classique / WebView moderne et validation visuelle physique.

## Suite

QA-106G : recette graphique et ergonomique transversale sur téléphone Android réel.

## Clôture et fusion — 22 novembre 2026

- **PR #83 fusionnée dans `main`** : https://github.com/MAthiks/Rogov-Android/pull/83
- **Dernier commit de la branche validé** : `e4ad7b7e28e7555b21318252f715aace3832a31a`
- **Commit squash** : `cc4b7bd348f75f5e5e93a7bdda1e298ed223e5e3`
- **CI complète 4/4 réussie sur le commit validé** : Web/Chromium (run 45069468562), Chrome Android 13 (45069468596), APK classique (45069468584), WebView moderne (45069468552).
- **Captures contrôlées** : artefact GitHub Actions `qa096-chromium-portraits` (ID 14773415373), écrans inventaire, fiche de l'Égaré et journal en 320×640, 360×800, 393×704, 412×915 ; combat ciblé en 360×780. Pas de chevauchement évident des panneaux avec le pavé fixe dans ces images. Le contrôle Chromium ne remplace pas les tests sur téléphone physique.
- **Correctif non-régression 320×640** : vraie position des six raccourcis prise en compte dans le dimensionnement de la carte, plutôt que le bas d'un conteneur incluant des volets secondaires.
- **État : code livré ; GO graphique final non accordé.** Suite : [QA-106G Android](QA106G_ANDROID_FINAL_RECIPE.md). Les essais Android physique, offline et joueurs restent ouverts.
