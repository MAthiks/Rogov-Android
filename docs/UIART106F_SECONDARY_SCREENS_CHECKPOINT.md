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
