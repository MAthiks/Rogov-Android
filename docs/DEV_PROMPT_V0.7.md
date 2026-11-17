# ROGOV — Prompt d'implémentation du combat hybride v0.7

**Statut : prêt pour développement, non exécuté.** Référence fonctionnelle : docs/COMBAT_DESIGN_V0.7.md.

## Mission

Agir comme une équipe de programmation web/mobile, conception tactique, UX Android et QA. Remplacer le système « collision avec ennemi = attaque automatique » par un **combat hybride** : exploration continue sur la carte et panneau tactique contextuel, avec cible, distances, intentions ennemies et défenses actives. Inspiration limitée aux principes de lisibilité/pression tactique de Darkest Dungeon. Ne copier aucun graphique, animation, code ou disposition propriétaire.

## Contraintes absolues

- Plateforme jouable : HTML5/CSS/JavaScript natif sous GitHub Pages (PWA Android), sans nouveau framework ni APK obligatoire.
- Univers Veyr/Nhal, esthétique sombre lovecraftienne originale et sprites de docs/VISUAL_BIBLE_V0.6.md.
- Héros unique ; boucle d'extraction et Rappel identique.
- Mort : perdre **tout** le sac de descente, mais conserver héros, XP/niveau et coffre sécurisé.
- Ne jamais effacer ni écraser une sauvegarde existante de manière incompatible. Si un nouveau champ devient nécessaire, prévoir un normaliseur/migration documenté et testé.
- Conserver contrôles tactiles, clavier, rendu graphique/ASCII, journal, soin, attente et disponibilité hors ligne.
- Un lot actif à la fois, commits petits et tests automatiques à chaque modification.

## Étape 1 — Contrat métier et tests

1. Définir les règles CONTACT / PROCHE / LOIN à partir de la carte orthogonale.
2. Distinguer inspection, sélection de cible, déplacement et attaque **explicite**.
3. Définir les états d'intention ennemie et de défense du héros de manière sérialisable.
4. Rendre le moteur indépendant de la DOM, avec événements structurés et calculs reproductibles.
5. Écrire des tests de cible, portée, obstacle, tour valide/invalide et sauvegarde v0.6.1.

## Étape 2 — Panneau contextuel Android

1. Toucher un ennemi : le sélectionner sans consommer de tour et sans déclencher de dégâts.
2. Afficher nom, PV, distance, intention et action disponible.
3. Ajouter quatre commandes visibles : Attaquer, Esquiver, Parer/Bloquer (choix secondaire), Reculer.
4. Maintenir la carte visible ; panneau repliable, zones tactiles adaptées au téléphone.
5. Garder le journal d'action, les informations de PV et les avertissements.

## Étape 3 — Résolution des actions

1. Remplacer le coup automatique de la fonction de déplacement par le ciblage.
2. Faire consommer un tour aux attaques, soins, défenses et replis **valides**.
3. Esquive, parade et blocage doivent avoir des effets distincts et testables.
4. Une action impossible ne modifie ni PV, ni position, ni tour.
5. Préserver les anciennes récompenses XP et le système d'extraction.

## Étape 4 — Intentions ennemies

1. Charognard : attaque courte, menace mobile.
2. Gardien : préparation d'une attaque lourde, puis résolution annoncée.
3. Larve : impulsion surnaturelle en ligne droite à deux cases et selon son rythme, visible en avance.
4. Tester le repli, les obstacles, les combats multiples et les défenses face aux différents types d'attaques.

## Étape 5 — Contrôle et déploiement

- Exécuter npm run check:web et npm run test:web.
- Vérifier les anciennes sauvegardes, le journal, le mode ASCII, les sprites et la PWA.
- Tester sur Android portrait : lisibilité, interaction à une main, absence de défilement pénible et pas de clic d'attaque involontaire.
- Mettre à jour le cache du service worker, README, CHANGELOG et guide de test.
- Publier uniquement après succès des tests et du déploiement GitHub Pages.

## Critères de validation

Le joueur voit la menace, comprend sa portée, choisit une action et en observe le résultat. Le combat reste sur la carte, sans scène séparée, et le risque d'équipement propre à ROGOV demeure central.

**Ne pas marquer la v0.7 « publiée » tant que le nouveau moteur, l'UI et les tests ne le confirment pas.**
