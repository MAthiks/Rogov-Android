# ROGOV — DEV-089B : Refonte visuelle du terrain et des tiles

**Statut : développé sur `dev/dev-089b-terrain-art`, sans fusion dans `main`.**  
**Dépendance :** DEV-089A ([PR #10](https://github.com/MAthiks/Rogov-Android/pull/10)) ; cette branche inclut ses salles aux formes variées.  
**Référence :** [GDD Exploration profonde de Nhal v0.9](GDD_EXPLORATION_NHAL_V0.9.md), §12 et §14.

## Direction artistique retenue

**Ruines de pierre froide :** pixel art stylisé 24 × 24 px, murs massifs gris bleuté, sols ardoise aux joints discrets, fissures parcimonieuses, traces de poussière, de mousse et d'altération sombre. **Horreur cosmique rare, sobriété et lisibilité prioritaires.** Conservation de la [bible visuelle v0.6](VISUAL_BIBLE_V0.6.md) : rouge des failles, turquoise de l'Arche, ivoire du héros et silhouettes originales des trois ennemis.

## Périmètre exact du premier pack DEV-089B

| Élément | Réalisation |
|---|---|
| Sols | **6 variantes** visuelles : pierre ordinaire, fendue, usée, poussiéreuse, humide et noircie |
| Murs | **16 configurations de bordures** en fonction du voisinage cardinal, avec 3 variantes de matériau (48 sprites) |
| Portes | Deux silhouettes distinctes : passage réellement ouvert entre jambages, porte pleine fermée |
| Transparence du monde | Respect du brouillard : aucun voisin inconnu n'influence le contour graphique d'un mur découvert |
| Décor | Palette du GDD, textures peu contrastées qui laissent les héros, ennemis, coffres et pièges prioritaires |
| Assets | SVG **originaux**, 24 × 24 px, sans dépendance réseau ni appel à des images tierces |

Tous les terrains sont générés **une seule fois au chargement du module**, dans `docs/terrain-art.js`, puis réutilisés sous forme d'URI SVG précalculées. Aucun asset n'est téléchargé. L'attribution de la variante de sol/mur dépend exclusivement du **layoutId + coordonnées** via un hash déterministe ; elle ne touche pas à la graine de combat, aux sauvegardes ni au compteur de tours. Les bords de mur sont calculés uniquement d'après les cases **visibles ou déjà explorées** ; une ouverture encore inconnue ne se devine donc pas par ses ornements.

La carte logique est inchangée : obstacle `#`, franchissabilité, portes `+`, coffre `$`, Arche `E`, faille `^`, pièges et événements DEV-087 conservent exactement leur comportement. Le mode ASCII reste la référence des informations connues.

## Critères d'acceptation

- Vérifier **54 variantes** de terrain préfabriquées et leur caractère original/offline.
- Même layoutId et mêmes coordonnées = même texture après rechargement et sur plusieurs téléphones.
- Aucune information cachée ne doit arriver dans le fond SVG ni dans le DOM d'une case inconnue ; l'autotiling ne considère **jamais les voisins non découverts**.
- Au format Android portrait, les sols restent moins contrastés que les murs et les silhouettes d'ennemis ; aucune confusion entre porte ouverte/fermée, Arche/faille ou coffre/sol.
- Tests Node (catalogue, déterminisme, brouillard, non-mutation du moteur) ; scénarios Playwright mobile (textures, absence de spoilers, responsive, sauvegardes), Chrome Android 13 et PWA hors ligne.
- Les styles de secteurs distincts, reliefs avancés et grands tilesets de mobilier restent planifiés **DEV-089D** : ils ne doivent pas retarder ce premier lot.

## Procédure pour tester sur le téléphone (prototype séparé)

Dans Termux :

```sh
pkg install -y git python
git clone --depth 1 --branch dev/dev-089b-terrain-art https://github.com/MAthiks/Rogov-Android.git rogov-qa-089b
cd rogov-qa-089b
python -m http.server 8790 --bind 127.0.0.1 --directory docs
```

Ouvrir `http://127.0.0.1:8790/` dans Chrome, puis démarrer une **nouvelle deuxième descente**. Observer la différence visuelle avec le site officiel : sols fissurés/usés, contours des murs contre le sol, portes ouvertes vs fermées et piliers DEV-089A. Découvrir de nouvelles pièces, revenir en arrière et vérifier que les matériaux restent stables. Essayer ASCII, un coffre, un piège et l'extraction. Enfin, actualiser Chrome : aucune corruption de sauvegarde.

Le port 8790 isole les données locales du site public et des autres prototypes.

**Pas de fusion ni publication publique sans validation des tests et demande de fusion.**
