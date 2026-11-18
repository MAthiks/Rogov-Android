# DEV-085 — Implantation architecturale des portes et seuils de Nhal

**Statut : expérimental, branche `dev/dev-085-architectural-doors`.** Conçu d'après la capture de référence *Top-Down Roguelike* transmise par le joueur le 18 novembre 2026. La référence est utilisée **pour la structure spatiale**, non pour copier ses sprites ou son identité visuelle.

## Problème observé

L'ancien générateur DEV-080 plaçait mécaniquement **34 portes sur 17 connexions** (une à chaque extrémité du couloir). Les salles étaient dessinées comme des rectangles entièrement praticables, avec des portes posées directement sur un bord sans véritable mur d'encadrement. L'effet était répétitif et peu crédible architecturalement.

## Contrat de génération, premier lot implémenté

- Carte profonde **44 × 32**, **12 salles** sur une grille de 4 colonnes × 3 lignes ; chaque salle mesure désormais **7 à 9 cases de côté** (vestibule toujours 9 × 9). L'intérieur est praticable ; un **anneau de maçonnerie d'une case** définit ses murs.
- Réseau public : **17 connexions** orthogonales salle-couloir-salle. Les couloirs se raccordent aux murs par des **bouches d'une case**, avec une case murale de chaque côté.
- Chaque liaison possède deux seuils physiques, mais **au plus une porte fonctionnelle**. Les autres seuils sont des passages ouverts (`.`), jamais des portes invisibles.
- **Six portes** distribuées aléatoirement de manière déterministe parmi les 17 liaisons, dont les deux seuils du vestibule pour rendre lisible le choix initial ; **deux portes maximum par salle**.
- Position sur les parois à proximité du centre (`centre ± 1`), **au moins deux cases des coins** ; chaque porte est latéralement encadrée de deux vrais murs `#`. Aucun doublet ni porte isolée dans un couloir.
- Seules les **portes ordinaires** déjà implémentées sont concernées ; ouverture/fermeture **explicite en un tour**, état mémorisé. Pas de nouvelles grilles verrouillées, barrières obligatoires ou exigences de clefs introduites.
- Les **passages secrets restent entièrement facultatifs**. Les portes sont toutes ouvertes à la création ; les deux routes de retour, l'accès aux coffres et l'extraction ne nécessitent ni secret, ni combat, ni piège imposé.
- Placement des **quatre ennemis, trois coffres et deux failles** issu du correctif QA-084 conservé, en particulier la visibilité d'au moins un de chaque dans le vestibule.
- Génération déterministe : le plan et les choix de portes sont intégralement enregistrés lors d'une descente, **jamais régénérés au chargement**.

## Sauvegardes et compatibilité

`doorPlanVersion: 1` marque uniquement les **nouvelles grandes descentes** à murs cadrés et six portes. Le champ est conservé par le moteur lors de `beginRun`. La validation vérifie les nouveaux seuils à l'aide de cette information.

Les **anciennes descentes profondes** sans ce champ restent acceptées avec leur topologie initiale (34 portes, salles de 5 à 7 cases). Elles ne sont **ni converties ni remplacées**, même si le joueur reprend une descente en cours. Les sauvegardes de l'introduction VAR-077 et de Veyr restent inchangées.

## Tests et critères d'acceptation

- Au moins **240 graines** déterministes et distinctes ; pour chaque carte, 12 salles, 17 connexions, 34 bouches encadrées, seulement 6 portes valides et 2 max par salle.
- Position des portes : pas d'angle, mur de chaque côté sur l'axe transversal, pas de porte côté couloir-couloir ; chaque porte est sur la bordure d'une vraie salle.
- Rappel, extraction et coffre toujours atteignables avec **deux itinéraires indépendants**, même en considérant les créatures comme obstacles pour au moins un chemin.
- IA, coffre, failles et passages secrets conservés, et premier écran Android toujours occupé par un charognard, un coffre et une faille visibles.
- Portes manipulables avec les boutons tactiles : inspection gratuite, fermer/ouvrir en un tour, déplacement bloqué sans tour si fermées, fonctionnement après sauvegarde/rechargement.
- Un état de sauvegarde **historique de 34 portes** est validé et reste lisible ; l'état 6 portes est lui aussi sauvegardé sans perte.
- Test Chrome Android réel indispensable avant fusion ; les seuls tests CI/émulateur ne le remplacent pas.

## Déroulé recommandé sur Android réel

1. Tester une **nouvelle deuxième descente** (pas une partie profonde déjà sauvegardée).
2. Voir une salle avec des murs pleins, deux sorties encadrées ; les couloirs rejoignent les salles par un seuil d'une case.
3. Vérifier les passages ouverts, les portes ordinaires aux endroits cohérents ; fermer puis rouvrir une porte, sauvegarder/recharger.
4. Parcourir des salles distinctes, rencontrer les entités QA-084, récupérer un coffre et extraire sans passer par un secret.
5. Vérifier un ancien état de descente après mise à jour : carte et portes **inchangées**.

Pour un essai isolé Termux (ne pas écraser les autres copies) :

```sh
pkg install -y git nodejs python
git clone --depth 1 --branch dev/dev-085-architectural-doors https://github.com/MAthiks/Rogov-Android.git rogov-dev085
cd rogov-dev085
node tools/make-icons.mjs
python -m http.server 8769 --bind 127.0.0.1 --directory docs
```

Ouvrir **http://127.0.0.1:8769/** dans Chrome Android, sur un port propre qui conserve les sauvegardes des autres versions.

**Déploiement** : cette branche est empilée sur la PR #4. Les PR #1 à #4 demeurent en brouillon ; `main` v0.7f n'est pas modifiée et ne doit pas être fusionnée sans accord explicite.
