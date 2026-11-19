# GAME-095D2 — Riposte défensive et décisions de butin

**Objectif du studio :** répondre aux chiffres de GAME-095D1 sans gonfler les dégâts ennemis ni agrandir gratuitement l'inventaire. Android est le canal actif ; Godot/PC reste hors chantier.

## 1. Récompenser l'anticipation des coups annoncés

L'audit D1 (100 expéditions générées, 300 cartes, duels isolés avec vraies règles) montrait que la stratégie « esquiver le coup lourd annoncé » perdait plus souvent que « frapper sans réfléchir » face au Gardien. L'esquive coûtait une action et 2 END, sans contribuer à terminer le combat.

**GAME-095D2 — Riposte d'esquive :**

- Uniquement lorsqu'une **esquive est préparée au tour où arrive une attaque physique annoncée** : le **coup lourd du Gardien** ou la **charge du Charognard**.
- Si l'esquive **réussit**, les dégâts sont annulés comme avant et l'Égaré peut riposter **immédiatement**, sans tour supplémentaire. Si l'ennemi **manque naturellement son attaque**, une esquive préparée peut également exploiter l'ouverture. L'esquive ainsi exploitée est consommée une seule fois.
- Une vraie **arme de mêlée équipée** est indispensable ; l'arme, les caractéristiques du personnage, les jets de précision/critique, l'armure adverse et la graine RNG enregistrée règlent la riposte. **Aucun coup garanti ni dégâts ajoutés arbitrairement** ; la riposte peut manquer.
- Une **esquive ratée** ne riposte pas. Esquiver un coup ordinaire ou une onde de Faille n'offre pas cette ouverture. **Parade** et **blocage** gardent leurs règles et coûts actuels.
- Une riposte sur le Gardien brise sa haute garde, sans détruire son aptitude à préparer un autre coup. Une riposte mortelle accorde son XP normale une seule fois et retire la cible.
- Le danger d'une esquive ratée subsiste ; sortir de l'axe ou interrompre une charge reste une autre réponse valable.

**Compatibilité :** `run.defense` conserve les mêmes valeurs, `SCHEMA_VERSION=1` et `SAVE_KEY="rogov-web-v1"` inchangés ; aucune nouvelle variable d'état durable. Toutes les actions restent à résolution déterministe à état et graine identiques. La riposte modifie logiquement le nombre de jets d'une défense qui rencontre l'ouverture : il ne faut donc pas prétendre que les suites de RNG au-delà de cet événement restent identiques.

## 2. Inventaire : échanger au coffre au lieu de deux tours

Sur trois étages, un joueur qui conserverait l'épée et ramasserait neuf objets dépasserait systématiquement les **huit places**. Agrandir le sac supprimerait le choix et modifierait l'équilibre de la mort permanente.

**GAME-095D2 — Échange au coffre :**

- Si le sac contient **exactement huit objets**, un coffre profond voisin propose une **liste d'objets transportés que le joueur peut volontairement abandonner**. L'objet équipé en dernier exemplaire n'est pas proposé.
- Le joueur valide explicitement le sacrifice ; le **contenu du coffre reste inconnu** avant cette confirmation. L'option n'apparaît pas hors d'une rencontre de coffre accessible.
- La transaction coûte **un seul tour** : 1 ancien objet retiré, 1 récompense prise, coffre ouvert, +1 XP habituelle, récupération d'1 END habituelle et **une** réaction ennemie. Le sac reste à huit ; le mécanisme n'ajoute pas de neufième place.
- Le même coffre ne peut jamais être repris, même après un rechargement. Un objet échangé est définitivement perdu, sans sécurisation clandestine à Veyr. Le Rappel efface toujours tout le sac ; l'extraction sécurise ce qui reste transporté.
- Si le sac n'est **pas plein**, l'action normale **Ouvrir le coffre** reste inchangée. L'échange n'est pas une autre façon de contourner une limitation d'inventaire.

**Compatibilité :** utilise les champs existants `run.carried`, `run.collected`, `run.turns` et `run.endurance`. Pas de changement de limite, de format ou de génération des coffres.

## 3. Validation, mesures et seuils

- Tests moteur réels : 130 graines d'esquive contre Gardien, séquences de riposte, équipement absent, défense ratée, XP unique, retour à Veyr, transactions de coffre, équipement protégé et tentatives invalides sans tour ni mutation.
- Tests UI : bouton d'échange dans le panneau d'interactions Android, choix explicite et confirmation native, **aucune divulgation du contenu du coffre**, état enregistré et rechargé sur Chromium portrait et Chrome Android 13.
- Réexécuter le laboratoire **100 expéditions/300 cartes**, comparer exactement les mêmes stratégies `attack` et `telegraph_dodge` du rapport D1. Observer PV perdus, fréquence de rappel, tours et Endurance, **sans appeler cela des taux de victoire humains**.
- Tous les checks GitHub de validation Web, Android 13 et APK doivent être verts avant fusion.
- **Recette humaine encore ouverte :** comportement ressenti des Gardiens, visibilité de la riposte, acceptabilité de l'échange à l'aveugle, risque de surpuissance avec certaines armes et tests sur téléphone physique.

**Hors périmètre :** inventaire empilable ou plus grand, nouvel ennemi, nouvelles classes, microtransactions, téléportation, nouveau moteur et portage PC.

**Suite :** GAME-095D3, mesurer le résultat des combinaisons de ressources sur de vrais trajets joués et approfondir la progression façon roguelike.
