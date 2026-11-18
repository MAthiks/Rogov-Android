# ROGOV — Maquette d'interface v2 (checkpoint de conception)

**Date :** 18 novembre 2026.
**Statut :** proposition de maquette retenue comme référence de travail, **non développée**.
**Référence visuelle :** image « Proposition de nouvelle interface — Direction UI v2 (Sprite C) », générée dans la conversation du projet *Rogue first build* et remise séparément au format PNG (1536 × 1024). L'image bitmap n'est **pas** encore importée dans ce dépôt ; ce document consigne les décisions et permet de reprendre le chantier.
**Dépendances graphiques existantes :** ART-091A à ART-091D (Sprite C, personnages, monstres, interactifs, icônes) ; conserver leur identité.

## Vision

Passer de l'interface Web à longs panneaux verticaux à une interface de **jeu Android portrait à écrans spécialisés**, sombre et immersive, conçue pour une lecture immédiate et un pilotage tactile. Une navigation simple sépare préparation au refuge, descente dans Nhal, inventaire et personnage. La carte et ses commandes doivent devenir prioritaires pendant le jeu.

**Direction visuelle :** dark fantasy / ruines de Nhal, fond anthracite, pierre et métal patinés, accents violets désaturés et ambre ponctuel, contours lisibles, icônes pixel art originales 24×24 agrandies nettes, textes français sobres. Préserver contrastes tactiques (danger, PV, cible, statut) avant tout embellissement. Rester compatible avec l'esthétique Sprite C existante.

## Les quatre écrans proposés

### 1. Refuge de Veyr — hub de préparation

- Écran d'accueil de partie avec identité de Veyr et un visuel d'ambiance.
- Raccourci primaire **Préparer une descente**.
- Accès clair au **coffre sécurisé**, à la **forge existante**, aux **archives/encyclopédie** seulement si elles sont implémentées, et aux **options**.
- La section « Parler aux habitants » de la maquette est une **piste de développement future**, pas une affirmation que les PNJ ART-091D sont actifs.
- Aucun équipement porté ne doit être confondu avec le butin sécurisé.

### 2. Nhal — écran de jeu principal (priorité de réalisation)

- **Carte graphique dominante** dans la zone centrale ; brouillard et niveau réellement connus par le joueur uniquement.
- Barre d'état condensée et persistante : **PV, endurance, compteur de consommables** ; tours et menace selon contexte.
- **Pavé directionnel tactile ancré en bas**, actions contextualisées et au moins une action d'attente/soins identifiable.
- Les actions de combat réellement existantes (attaquer, esquiver, parer, bloquer, reculer), les portes, pièges, coffres et secrets restent accessibles sans longs déplacements de page.
- Inventaire, journal, carte/minicarte et rapport peuvent être ouverts en panneaux ou écrans secondaires, sans fermer ni perdre une descente.
- En portrait 360×780, ne pas décaler la carte hors écran ni masquer des contrôles essentiels par un HUD décoratif.

### 3. Inventaire — écran de gestion des objets

- Liste ou grille d'objets avec leurs **icônes ART-091D**, noms, catégories et quantités.
- Filtres possibles par type ; **utiliser seulement les catégories et objets existants**.
- Distinguer explicitement **coffre sécurisé au refuge** et **sac de descente exposé à la perte**.
- Conserver la limite réelle de **8 objets transportés**, les états de sélection, la forge et les effets des consommables.
- Boutons « Utiliser » ou « Équiper » **uniquement** lorsque les actions et règles existantes le permettent : aucun nouveau système de vente, suppression ou transfert implicite.

### 4. Personnage — fiche lisible

- Portrait du **PJ capuchonné Sprite C**, niveau/XP, PV/endurance, statistiques et équipement réellement calculés.
- Sections claires et repliables pour les attributs, défense active, arme et probabilités.
- Ne pas afficher de slots, ressources ou statistiques fictifs comme s'ils étaient jouables.
- Les nouveaux objets et classes non implémentés ne font pas partie de cette sauvegarde.

## Composants communs

- Navigation explicite et peu profonde entre les écrans ; retour vers la partie en cours sans réinitialisation.
- Grandes surfaces tactiles, lisibilité Android, compatibilité viewport 360×780 ou plus petit si possible.
- Commandes touch et clavier préservées ; mode ASCII toujours accessible.
- Images locales/offline et versionnement Service Worker PWA ; aucun asset distant obligatoire.
- En-têtes, icônes et typographie cohérents sans surcharger la zone tactique.

## Contraintes de compatibilité non négociables

- **Aucun changement du moteur de jeu sans lot distinct** : tour par tour, portée, cible, défense active, esquive/parade/blocage, RNG, pathfinding, extraction, retour et mort.
- **Conserver les sauvegardes existantes** : clé `rogov-web-v1`, schéma 1, refuge et descentes en cours.
- Brouillard de guerre sécurisé : ni DOM ni légende ne doivent révéler des entités, pièges ou secrets inconnus.
- Équipement, économie de cendre, limite du sac, forge, PNG/SVG originaux et logique ASCII préservés.
- **L'illustration est conceptuelle** : les chiffres, armures, potions, clés, quêtes, capacité « 14/20 », statistiques « 34/40 », noms ou boutons de la planche ne correspondent pas nécessairement à la v0.7f. Ils ne sont pas des fonctionnalités approuvées.

## Plan de réalisation proposé, non commencé

1. **UI-092A — Descente et HUD** : vraie vue mobile presque plein écran, carte prioritaire, contrôles bas, actions/contextes dans tiroirs ; garder les actions réelles et les tours.
2. **UI-092B — Refuge** : hub compact, accès préparation, forge et coffre, sans inventer de PNJ actifs.
3. **UI-092C — Inventaire** : coffre/sac distincts, filtres et pictogrammes, sélection et quantité intactes.
4. **UI-092D — Personnage / navigation** : fiche existante, cohérence des barres, navigation, réglages ASCII et accessibilité.
5. **QA UI v2** : Node, Chromium tactile, Android Chrome 13, install APK, PWA offline et contrôle sur téléphone physique.

**Règle de production :** une étape isolée, tests automatisés et revue de la lisibilité, puis fusion. Cette sauvegarde **n'implémente pas** la nouvelle interface : elle fige seulement sa direction de travail, pas un cahier des charges verrouillé au pixel près.

## Traçabilité

- Dépôt : `MAthiks/Rogov-Android`
- Référence ART : [Direction Sprite C](ART_DIRECTION_SPRITE_C_V1.md)
- Interface en production : [DEV-090A](DEV090A_ANDROID_UI.md), [DEV-090B](DEV090B_TACTICAL_UI.md), [DEV-090C](DEV090C_CONTEXT_BAG.md)
- État précédent : ART-091D fusionné, GitHub Pages et APK vérifiés.
