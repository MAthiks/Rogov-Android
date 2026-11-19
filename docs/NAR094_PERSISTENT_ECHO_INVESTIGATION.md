# NAR-094 — Dossier persistant des Échos de Nhal

**19 novembre 2026 — développement ciblé après NAR-093**  
**Décision :** le joueur doit pouvoir conserver une preuve de son enquête, même si le Rappel lui fait perdre son équipement. La narration n'exige ni nouvelle famille de donjons, ni boss final, ni système fictif de quête.

## Boucle narrative jouable

1. Le joueur s'extrait de Nhal (ou tente une nouvelle descente), et cherche une **Chambre de l'Écho** dans les donjons profonds déjà générés à partir de la deuxième descente.
2. Une fois le lieu réellement **visible et adjacent**, il choisit **Relever l'inscription** ou **Écouter la résonance**. L'interaction coûte **un tour** comme avant et déclenche la réaction des ennemis. Elle est exclusive par salle.
3. Cette interaction conserve un **indice authentique**, indépendamment de la survie ultérieure de l'Égaré. Une Chambre ne peut fournir qu'un seul indice ; il faut chercher une autre Chambre dans une prochaine descente pour progresser.
4. Le **Dossier des Échos** dans le Refuge de Veyr et dans le Rapport d'expédition n'expose **que les indices déjà acquis**. La consultation est gratuite et ne touche pas la sauvegarde.
5. Après trois découvertes, le premier ensemble est complet, **mais la cause du Rappel reste inconnue**. Les interactions suivantes conservent leur XP et leur coût habituels, sans inventer un quatrième indice.

## Indices écrits, dans l'ordre des rencontres

| N° | Indice | Fait ou observation réellement obtenu(e) |
|---|---|---|
| 1 | **La cité enfouie** | Une inscription parle d'une ville sous Nhal ; aucun plan n'indique comment y parvenir |
| 2 | **La voix en avance** | Un Écho répond avant que les paroles soient prononcées ; aucune explication n'est donnée |
| 3 | **La marque du retour** | Un signe est associé au mot « retour » ; **aucune preuve** qu'il explique le Rappel |

Ils forment une **piste narrative**, pas une révélation surnaturelle confirmée. Les textes ne mentionnent pas d'emplacement de salle non découverte ni ne révèlent d'adversaire, de coffre ou de sortie.

## Contrat technique et sauvegarde

- Nouveau champ **optionnel** `meta.echoFindings` : tableau ordonné d'identifiants issus de `buried_city`, `early_voice`, `return_mark`, obligatoirement un **préfixe** de cet ordre. Aucune répétition ni saut d'étape. Une vieille sauvegarde **sans champ** reste valide et n'acquiert pas de preuve rétroactive inventée.
- `SCHEMA_VERSION = 1` et `SAVE_KEY = rogov-web-v1` sont inchangés. Une nouvelle partie démarre avec `echoFindings: []`. `normalizeJournal`, le coffre et les champs `run` restent compatibles.
- Seul `resolveRoomSite` réussissant dans une Chambre de l'Écho écrit une preuve ; il clone déjà la partie avant de résoudre l'interaction. Refus pour salle lointaine, cachée, déjà épuisée, option invalide ou endurance insuffisante = **aucun nouvel indice**.
- Les preuves persistantes résident dans `meta` et survivent aux chemins `recall` et `extract` existants. Le sac transporté reste perdu au Rappel et sécurisé uniquement à l'extraction.
- Une interaction Écho déjà connue conserve **exactement** ses coûts d'Endurance, ses XP, ses réactions ennemies et son RNG ; aucune nouvelle chance de butin ou combat n'a été créée.
- `echoDossier(state)` retourne les seuls enregistrements connus, un nombre / 3 et une proposition de suite explicite sans dévoiler les autres textes.
- Le Service Worker précache `echo-investigation.js` ; l'affichage est compatible avec le mode graphique, l'ASCII, Android portrait et les lecteurs d'écran.

## Recette automatisée

- Tests Node : absence d'indice inventé en partie neuve ou ancienne ; découverte uniquement après choix visible ; caractère non répétable ; trois descentes successives et saturation à 3 ; extraction / Rappel ; validation stricte d'enregistrements corrompus ; non-divulgation des indices futurs ; conformité UI/offline.
- Test Chromium Android portrait : première découverte à l'Écho depuis les vrais boutons, progression 1/3 sauvegardée, Rappel, dossier conservé à Veyr, deuxième descente, choix de la résonance et progression 2/3.
- Les suites transverses garantissent les sauvegardes anciennes, les cartes, les ennemis, la visibilité, la forge, les deux modes de rendu et l'ergonomie du cockpit.

## Limites produit et prochaine étape

**NAR-094 ne termine pas la campagne.** Les indices sont trois petits jalons concrets. La prochaine conception pourra proposer une véritable enquête avec déductions, PNJ et événements conditionnels, **mais uniquement après observation des retours réels** : comprendre ces indices, vouloir en chercher un autre et avoir une raison de recommencer une descente. La certification Alpha 0.8 exige toujours la campagne QA-092 de cinq testeurs × deux descentes.
