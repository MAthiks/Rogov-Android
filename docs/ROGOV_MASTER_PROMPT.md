# ROGOV — Master Prompt v1.2 (résumé)

Développer rapidement un roguelike d'extraction tactique en Kotlin, solo et hors ligne, testable et maintenable sur Android.

## Boucle fondamentale
REFUGE DE VEYR → PRÉPARATION → DESCENTE DANS NHAL → BUTIN → EXTRACTION OU MORT → REFUGE.

- Le personnage, son niveau et son expérience sont permanents.
- Les objets pris au refuge rejoignent le sac de descente temporaire.
- La mort provoque le Rappel à Veyr et détruit **tous** les objets transportés, jamais ceux restés au coffre.
- L'extraction transfère tous les objets du sac dans le coffre du refuge.
- Le Rappel est un phénomène mystérieux propre à ROGOV.
- Le moteur est indépendant de l'interface Android ; les contenus ont des identifiants stables dans des JSON.
- Tests reproductibles, sauvegardes versionnées, build APK dans GitHub Actions.
- Une seule tâche en cours : terminer le premier APK testable.
