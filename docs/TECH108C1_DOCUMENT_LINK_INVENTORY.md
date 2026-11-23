# TECH-108C1 — Inventaire documentaire et liens internes (non destructif)

**Base immuable :** \`main@1321bb6375fc25d1ed17041dc6e8ebf889b9dc25\` après fusion TECH-108B4 / PR #96.
**Statut :** audit documentaire en branche isolée ; aucune suppression autorisée.

## Mesures au SHA de départ

L'arbre Git contient **358 fichiers suivis**, dont **141 Markdown** totalisant **817 552 octets**. Dans ces Markdown, **134** sont sous \`docs/\` ; les autres sont à la racine ou dans d'autres dossiers. Ces chiffres correspondent aux blobs Git de référence, non à une taille PWA/APK. Les nouveaux documents et outils de C1 augmentent naturellement ce nombre.

## Méthode

\`node tools/tech108c1-docs.mjs --check\` produit un inventaire JSON déterministe fondé sur \`git ls-files\`. Le script :
- compte les fichiers Markdown et leur poids réel dans Git, regroupés par famille : racine, GDD, QA, checkpoints, technique, production, autres ;
- collecte les **liens Markdown inline littéraux** hors blocs de code et distingue chemins suivis, répertoires suivis, chemins présents non suivis et références non résolues ;
- isole les chemins externes au dépôt, les URL à racine et les encodages douteux dans une catégorie « à examiner » ;
- signale les documents sans référence entrante observée comme **candidats d'investigation**, jamais comme des fichiers inutilisés ;
- protège explicitement README, ROADMAP, GDD exploration v0.9 et les rapports TECH-108A / B4. Le mode \`--check\` échoue si ces références disparaissent ou si le stock documentaire descend sous la baseline.

**Limites volontaires :** liens de type référence, URLs générées, liens depuis CSS/JS/Kotlin, assets de build, ancres de titres et liens externes entrants ne sont pas analysés exhaustivement. Une référence absente de cet inventaire ne prouve rien quant à l'utilisation d'un fichier. Aucun fichier de documentation ou ressource n'est désigné « obsolète » à ce stade.

## CI et décisions suivantes

- Ajouter \`tests/tech108c1-docs.test.mjs\` à \`npm run test:web\` et publier \`tech108c1-doc-links.json\` sur le workflow Web/Chromium.
- Inventorier les éventuelles références non résolues de l'artefact, et les qualifier manuellement ; ne pas classer automatiquement des fichiers comme morts.
- Ne proposer de suppression qu'en **TECH-108C2**, avec preuve des consommateurs absents, référence historique préservée et test avant/après.
- Exiger **les quatre workflows verts sur le HEAD final** pour fusionner C1. L'issue WebView #91 et la recette Android physique restent ouvertes.

**Invariants :** zéro modification de gameplay, carte, brouillard, Sprite C, ressources PWA, clés de sauvegarde \`rogov-web-v1\`, cache et packaging Android.
