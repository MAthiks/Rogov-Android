# ROGOV — Bilan de studio et objectif qualité 8/10

**Date du bilan : 17 novembre 2026.**  
**Statut : décision de production conservée dans le dépôt.**  
**Note actuelle estimative : 6/10 (jugement qualitatif du studio, pas mesure utilisateur).**  
**Cible : une Alpha qui atteint réellement 8/10 selon des critères vérifiables.**

## Ce que nous devons retenir du bilan

| Domaine | Note actuelle | Diagnostic |
|---|---:|---|
| Concept et identité | 8/10 | Boucle Veyr/Nhal/Rappel et atmosphère prometteuses |
| Gameplay | 4/10 | Combat basique, carte fixe, faible rejouabilité, décisions limitées |
| Technique | 6/10 | PWA publique et tests utiles ; compatibilité mobile/ergonomie à vérifier réellement |
| Direction artistique | 5/10 | Atmosphère convaincante, lisibilité et cohérence incomplètes |
| Production | 5/10 | Livraisons rapides mais versions annoncées parfois trop tôt |

**Message central : arrêter de simplement ajouter des fonctionnalités ; prouver que les descentes sont intéressantes à rejouer.**

## Erreurs de méthode constatées

1. Les mécaniques ont été ajoutées avant de mesurer leur intérêt ludique.
2. Le combat a d'abord été implémenté en collision automatique sans vraie décision tactique.
3. Les tests automatisés ont parfois été assimilés à tort à une validation sur Samsung (le défaut responsive du menu titre l'a démontré).
4. Le butin et la progression ne donnent pas encore suffisamment de motivation à s'extraire.
5. Nous avons multiplié les versions plutôt que stabilisé une expérience complète.

## Critères de réussite avant de parler de 8/10

**La note de 8/10 n'est pas attribuée automatiquement à la sortie d'une version.**

### A. Combat tactique (indispensable)

- Sélectionner une cible ne consomme ni tour ni PV.
- Plus aucune attaque accidentelle en heurtant un ennemi.
- Au moins deux choix défensifs avec un résultat différent et compréhensible.
- L'intention de chaque famille ennemie est lisible **avant** l'action.
- Reculer, esquiver ou éviter l'engagement représente une alternative utile.
- Journal court, précis et cohérent ; pas de messages trompeurs.

### B. Boucle complète et récompense (indispensable)

- Une descente comporte au moins trois décisions intéressantes : quoi emporter, quel danger affronter et quand s'extraire.
- Le joueur peut expliquer pourquoi conserver une ressource au refuge a de la valeur.
- L'échec au combat/aux pièges respecte le Rappel, avec perte de tout le sac porté.
- Les runs varient assez pour qu'une deuxième tentative ne soit pas mécaniquement identique à la première.

### C. Fiabilité et expérience mobile (indispensable)

- Tous les tests du moteur sont verts et les scénarios d'extraction, de Rappel et de migration de sauvegarde ont une couverture.
- Aucun effacement de sauvegarde lors d'une mise à jour.
- Deux sessions de test réelles en portrait Android : titre, refuge, descente, combat, extraction, reprise après fermeture.
- Aucun blocage empêchant de terminer une descente.
- Lisibilité du joueur, des trois ennemis, du butin et de l'extraction sans devoir deviner un symbole.

### D. Validation humaine (indispensable)

- Au moins **5 testeurs** réalisent chacun **2 descentes** sans aide du développeur.
- Récolter pour chaque testeur : compréhension du combat, clarté du risque, envie de rejouer, frustration, bug bloquant.
- Objectif : au moins **4/5 testeurs** déclarent vouloir faire une troisième descente.
- Aucun problème bloquant de sauvegarde ou de Rappel non résolu.

## Garde-fous de production

- **WIP = 1** : un seul lot de développement actif à la fois.
- Chaque version comporte un objectif testable ; ne pas utiliser la numérotation comme indicateur de qualité.
- Distinguer trois niveaux : **conçu**, **tests automatiques verts**, **validé sur téléphone avec testeurs**.
- Priorité : combat hybride v0.7 → test de la boucle → valeur du butin → variété de descente. Pas de nouvelles créatures/classes avant le premier test complet.
- Garder l'accès PWA et les sauvegardes de la v0.6.1 fonctionnels pendant les étapes de refonte.

## Tableau de suivi à actualiser

| Critère | État initial | Condition de validation |
|---|---|---|
| Combat décisionnel | À faire | Combat hybride jouable et testé |
| Rejouabilité | À faire | Au moins 2 descentes distinctes et testées |
| Valeur de l'extraction | À approfondir | Usage clair du butin dans le refuge |
| Lisibilité Android | Partiellement validée | Vérification manuelle sur appareil |
| Sauvegardes | Tests présents | Migration et sessions réelles confirmées |
| Validation utilisateurs | Non réalisée | 5 testeurs × 2 descentes, 4/5 veulent rejouer |

**Décision de studio : rester lucides et mesurer le plaisir de jouer, pas seulement le nombre de tests réussis.**

## Campagne QA-074 du 17 novembre 2026 — verdict provisoire

L'audit de la v0.7d figure dans [QA074_ALPHA_8_ASSESSMENT.md](QA074_ALPHA_8_ASSESSMENT.md). **129 tests automatisés réussis**, mais la cible 8/10 **n'est pas atteinte** : trois descentes ont reproduit une route d'extraction identique, sans dégâts, avec un Fragment de cendre supplémentaire à chaque fois. Le terrain est fixe, le fragment n'a pas encore d'utilité jouable, et les deux sessions Android ainsi que les 5 testeurs × 2 runs manquent.

**Estimation éditoriale actuelle : environ 6,6/10, non certifiée.** Les critères A/B/C/D ci-dessus restent obligatoires ; la quantité de tests ne saurait les remplacer.
