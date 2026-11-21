# ROGOV — ART-103D : portrait de Sprite C et fiche de l'Égaré

**Référence :** maquette quatre écrans UI-096 v3 communiquée par l'utilisateur.
**Statut :** lot graphique empilé sur ART-103C (PR #72), lui-même dépendant des PR #71, #70 et #69.

## Vision

La fiche du personnage doit évoquer le quatrième volet de la maquette : **portrait encapuchonné**, bloc de progression, attributs sculptés dans la pierre et aptitudes lisibles. Elle reste la fiche existante de ROGOV, réutilisée à Veyr et en expédition par UI-096C ; aucun nouvel écran parallèle ne duplique la logique.

## Intégration

| Source | Fonction |
| --- | --- |
| `docs/art103d-sprite-c-portrait.svg` | Portrait original 96×112 en pixel art géométrique, capuche aubergine/noir et cape usée. Palette et silhouette cohérentes avec `HERO_SVGS.down` ; pas de confusion avec un ennemi ou un objet. |
| `docs/character-art103d.js` | Données d'affichage pures : titre du héros, niveau, XP **modulo 5** conformément au moteur, localisation réelle, PV et END en descente, six aptitudes de combat issues de `heroDerivedStats`. |
| `docs/index.html` | Enrichit **le même** `#actor-stats-sheet` : portrait, progression, zone de condition, titre des attributs et grille de six aptitudes. |
| `docs/app.js` | Mise à jour des éléments existants lors de `renderActorStats` ; aucune écriture de sauvegarde, aucun changement des handlers. |
| `docs/art103d.css` | Matériaux fer/bronze/ivoire, cadre de portrait, barre XP et grilles responsives. |
| `docs/sw.js` | Précache de l'image, de la feuille de style et de l'assistant pur pour l'usage hors ligne en PWA et WebView Android. |
| `tests/art103d-character-sheet.test.mjs` | Vérification des valeurs réelles, absence de mutations, unicité des IDs, contenu local/inert et compatibilité hors ligne. |
| `tests/mobile-browser.test.mjs` | Captures et mesures Android des 320×640, 360×780, 393×704, ouverture de la vraie fiche, départ, reprise de sauvegarde. |

## Valeurs réelles uniquement

- Six attributs : FOR, AGI, CON, PER, VOL, INT.
- Six aptitudes calculées : endurance maximale, critique, esquive, parade, blocage et armure.
- Niveau et expérience du personnage sauvegardé, **5 XP par niveau** conformément à `gainXp` et `validateSave`.
- **Pendant une descente :** PV réels sur `MAX_HP`, endurance réelle sur endurance maximale. À Veyr, ces deux jauges affichent « Hors expédition » : elles ne représentent pas une santé persistante inventée.
- **Santé mentale :** contrairement aux chiffres illustrés sur la maquette, il n'existe pas de mécanique mentale active dans le moteur courant. Le panneau le dit explicitement, sans simuler un « Stable » ou « 82/100 ».
- **Archétype :** préserve la ligne actuelle, sans donner un rôle non choisi.
- Portrait purement illustratif : aucun sprite 24×24 d'exploration n'est modifié.

## Contrat de sécurité et ergonomie

- `rogov-web-v1` et `SCHEMA_VERSION=1` inchangés.
- Aucun nouvel état enregistré ; `characterPresentation` reçoit l'état et les stats, sans le muter.
- Une **seule fiche** partagée, le contrôleur UI-096C l'affiche aux deux endroits : pas de doublons ni d'actions accidentelles.
- Surface de jeu Nhal, brouillard, boutons de combat, pavé de déplacement et bottom sheet inventaire inchangés.
- Vérifications des trois formats portrait Android ; résumé cliquable ≥44 px, portrait nettement visible, absence de débordement horizontal ; rechargement de partie identique.
- Image et styles disponibles hors connexion, aucune API ou police distante.

## QA artistique

Comparer une capture de Veyr et une d'expédition sur Android à la maquette : capuche immédiatement lisible, titre hiérarchisé, chiffres non coupés, cadre dans le vocabulaire fer/bronze, contraste suffisant et espace de jeu non diminué. Les captures de la CI (dossier `qa096-screenshots/art103d-character-{320,360,393}.png`) sont un support de revue, **pas** une preuve automatique d'une fidélité graphique parfaite.

**Ordre de fusion :** #69 → #70 → #71 → #72 → ART-103D. Ne pas fusionner un lot au-dessus d'une dépendance non fusionnée sans réexamen des CI de la branche de destination.
