package com.rogov.game.core

/** Pure Kotlin gameplay. No Android imports, storage API or renderer dependencies. */
class GameEngine(val content: GameData, val state: SessionState = SessionState()) {
    companion object { const val INVENTORY_LIMIT = 8 }

    init {
        require(state.meta.stash.all { (id, count) -> id in content.items && count >= 0 }) {
            "Coffre invalide"
        }
        state.run?.let { run ->
            require(content.map.tileAt(Point(run.x, run.y)) != '#') { "Position de personnage invalide" }
            require(run.carried.all { (id, count) -> id in content.items && count >= 0 }) { "Inventaire invalide" }
        }
    }

    fun startDescent(equipment: List<String>): ActionResult {
        if (state.run != null) return ActionResult("Une descente est déjà en cours.", false)
        if (equipment.size > INVENTORY_LIMIT) return ActionResult("Le sac ne peut pas contenir plus de 8 objets.", false)
        if (equipment.size != equipment.distinct().size) return ActionResult("Équipement répété.", false)
        if (equipment.any { (state.meta.stash[it] ?: 0) < 1 }) {
            return ActionResult("Équipement indisponible dans le coffre.", false)
        }
        val carried = mutableMapOf<String, Int>()
        for (id in equipment) {
            state.meta.stash[id] = state.meta.stash.getValue(id) - 1
            carried[id] = 1
        }
        val start = content.map.start
        state.run = RunState(start.x, start.y, carried = carried)
        state.meta.descents++
        return ActionResult("Descente " + state.meta.descents + " : Nhal vous accueille.")
    }

    fun move(direction: Direction): ActionResult {
        val run = state.run ?: return ActionResult("Vous êtes au refuge.", false)
        val destination = Point(run.x + direction.dx, run.y + direction.dy)
        val tile = content.map.tileAt(destination)
        if (tile == '#') return ActionResult("Un mur bloque le passage.", false)
        run.x = destination.x
        run.y = destination.y
        run.turns++

        if (tile == '^') return die("Une faille engloutit votre corps. Le Rappel vous ramène à Veyr.")
        if (tile == 'E') return extract()
        if (tile == '$' && destination.key() !in run.collected) {
            val itemId = content.map.loot.getValue(destination)
            val carriedUnits = run.carried.values.sum()
            if (carriedUnits >= INVENTORY_LIMIT) {
                return ActionResult("Inventaire plein : l'objet reste sur place.")
            }
            run.carried[itemId] = (run.carried[itemId] ?: 0) + 1
            run.collected += destination.key()
            awardExperience(1)
            return ActionResult("Butin : " + content.items.getValue(itemId).name + ". +1 XP")
        }
        return ActionResult("Vous progressez dans Nhal.")
    }

    /** Only the carried equipment is lost. Character progression and safe stash persist. */
    fun die(reason: String = "Vous êtes mort. Le Rappel vous ramène à Veyr."): ActionResult {
        if (state.run == null) return ActionResult("Aucune expédition à interrompre.", false)
        state.run = null
        state.meta.deaths++
        return ActionResult(reason + " Votre équipement transporté est perdu.")
    }

    /** All carried items (including original equipment) return to the safe stash. */
    private fun extract(): ActionResult {
        val run = state.run ?: return ActionResult("Aucune extraction active.", false)
        for ((id, count) in run.carried) {
            state.meta.stash[id] = (state.meta.stash[id] ?: 0) + count
        }
        state.run = null
        state.meta.extractions++
        awardExperience(2)
        return ActionResult("Extraction réussie ! Butin sécurisé à Veyr. +2 XP")
    }

    private fun awardExperience(amount: Int) {
        val character = state.meta.character
        character.experience += amount
        character.level = 1 + character.experience / 5
    }
}
