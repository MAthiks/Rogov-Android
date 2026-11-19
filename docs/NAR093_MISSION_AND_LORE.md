# NAR-093 — Mission initiale et fondamentaux narratifs de ROGOV

**19 novembre 2026 — lot produit à fusionner.**  
**Origine :** retour terrain QA-092 « Pas d'objectif réel. Le lore est confus. »  
**Lien de décision :** [NAR-093 #25](https://github.com/MAthiks/Rogov-Android/issues/25) / [campagne QA-092 #24](https://github.com/MAthiks/Rogov-Android/issues/24).

## Prémisse jouable actuelle

L'Égaré réapparaît dans le refuge de Veyr lorsque Nhal le tue. Ce phénomène porte le nom de **Rappel**. Le personnage et son expérience survivent, mais **tout son sac transporté est perdu**. Le coffre de Veyr, lui, est sûr.

Dans les ruines mouvantes de **Nhal**, le joueur rapporte des **Fragments de cendre**. Ils ont déjà une utilité effective dans le jeu : **1 Fragment sécurisé** permet de fabriquer **2 bandages** et **2 Fragments sécurisés** permettent de forger une **Lame cendrée**. Une **Arche d'extraction** permet de sécuriser le sac. La mort provoque le Rappel et détruit les objets transportés.

Certaines salles de Nhal comprennent une **Chambre de l'Écho** ; une inscription y fait référence à une cité enfouie. Le mystère narratif à explorer est **pourquoi l'Égaré revient-il à Veyr ?** Une réponse, des chapitres de quête, un boss final et une cinématique **n'existent pas encore** : ils ne doivent donc pas être promis comme des fonctions jouables aujourd'hui.

## Conception de l'objectif immédiat

### Premier passage au refuge

**« Première mission : une preuve pour Veyr »**  
Descends dans Nhal, récupère au moins 1 Fragment de cendre, puis franchis une Arche d'extraction. Seul le butin ramené vivant rejoint le coffre.

Il s'agit d'une **condition réalisable** par les règles existantes. Le statut « succès » n'est pas inventé : le texte de mission s'appuie uniquement sur `meta.extractions`, `meta.stash` et `run.carried`.

### Première descente

- **Sans fragment transporté** : trouve un Fragment, puis cherche l'Arche (aucun combat obligatoire).
- **Avec un fragment transporté** : rejoins une Arche ; le Rappel ferait perdre l'objet.
- **De retour avec des fragments sécurisés** : indique le stock de fragments et leur usage réel à la forge.
- **Après une extraction suivie d'une dépense de fragments** : précise que le coffre ne contient plus de fragments et invite à explorer Nhal pour de nouvelles ressources.
- **Lors d'une descente ultérieure** : explore, rapporte de nouvelles ressources et sois attentif aux Chambres de l'Écho ; leur découverte n'est **pas** présentée comme un objectif de campagne enregistré ni comme une mission déjà achevable.

L'extraction sans fragment ne peut pas déclencher le texte « Fragment sécurisé ». Le Rappel ne sécurise jamais le fragment. Tous les textes restent **calculés, en lecture seule, depuis les données réellement sauvegardées** : aucun nouveau champ de quête, aucune modification de moteur, de progression, de RNG ou de save.

## Glossaire présenté au joueur

| Terme | Une phrase claire |
|---|---|
| **Veyr** | Refuge et coffre sécurisé |
| **Nhal** | Ruines mouvantes et dangers |
| **Fragments de cendre** | Ressource à extraire pour fabriquer arme ou soins |
| **Arche d'extraction** | Retour volontaire qui préserve le sac |
| **Rappel** | Retour après mort, avec perte du sac |
| **Chambre de l'Écho** | Salle avec inscription évoquant une cité enfouie ; le sens reste mystérieux |

La fiction reste sombre et parcellaire, mais le **vocabulaire des mécaniques n'est jamais obscur**. Les mystères sont ceux du monde, pas ceux des règles du joueur.

## Réalisation technique

- `docs/narrative.js` exporte `narrativeObjective(state)` et un glossaire public. Aucune inspection des salles non découvertes, des positions de butin ou du RNG.
- L'écran titre contient une prémisse en moins de 50 mots, sans scène imposée.
- Le Refuge affiche un objectif réalisable, des informations de coffre et un petit glossaire repliable.
- Le cockpit de Nhal montre un **repère compact de mission dans la ligne déjà présente au-dessus de la carte**, sans ajouter de hauteur qui pourrait la masquer sur les écrans 320×640 et 393×704.
- Le `route-hint` existant détaille l'objectif en fonction du sac ; ce texte n'est **pas** une indication de chemin vers une sortie non découverte.
- Le Service Worker précache `narrative.js` et fait évoluer le cache de la PWA.
- Les tests de mission isolée vérifient l'extraction, le Rappel, la forge, la reprise et l'absence de mutation ; un scénario Chromium tactile couvre les mêmes étapes par de vrais boutons.

## Critères de validation humaine (non réalisés par ce lot)

Après deux descentes, demander au joueur sans le guider :

1. « Qui es-tu, et où reviens-tu après ta mort ? »
2. « Pourquoi descends-tu dans Nhal maintenant ? »
3. « Comment réussis-tu ton premier objectif ? »
4. « Quelle est la différence entre une Arche et le Rappel ? »
5. « Que cherches-tu encore à comprendre sur Nhal ? »

**Le lot NAR-093 résout la lisibilité et un premier objectif jouable.** Il **ne remplace pas** la future conception d'une progression narrative persistante : découverte d'indices durables, jalons de campagne, révélations et conclusion feront l'objet d'un GDD distinct une fois ce premier correctif testé.
