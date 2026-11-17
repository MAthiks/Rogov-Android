package com.rogov.game.core

data class Point(val x: Int, val y: Int) {
    fun key(): String = "$x:$y"
}

data class ItemDefinition(
    val id: String,
    val name: String,
    val kind: String,
    val description: String
)

data class MapDefinition(
    val id: String,
    val tiles: List<String>,
    val loot: Map<Point, String>
) {
    init {
        require(tiles.isNotEmpty() && tiles[0].isNotEmpty()) { "Carte vide" }
        require(tiles.all { it.length == tiles[0].length }) { "Lignes de longueurs différentes" }
        require(tiles.sumOf { line -> line.count { it == 'S' } } == 1) { "Une case S est requise" }
        require(tiles.any { it.contains('E') }) { "Une extraction E est requise" }
        require(tiles.all { line -> line.all { it in "#.S$^E" } }) { "Tuile inconnue" }
        val lootTiles = tiles.indices.flatMap { y -> tiles[y].indices.filter { x -> tiles[y][x] == '$' }.map { x -> Point(x, y) } }.toSet()
        require(lootTiles == loot.keys) { "Les marqueurs $ doivent correspondre aux coordonnées des objets" }
    }

    val start: Point by lazy {
        val y = tiles.indexOfFirst { it.contains('S') }
        Point(tiles[y].indexOf('S'), y)
    }

    fun tileAt(point: Point): Char = tiles.getOrNull(point.y)?.getOrNull(point.x) ?: '#'
}

data class GameData(val map: MapDefinition, val items: Map<String, ItemDefinition>) {
    init {
        require(map.loot.values.all { it in items }) { "Objet de butin absent des données" }
        require(listOf("weapon.rusty_sword", "consumable.bandage").all { it in items }) {
            "Les objets initiaux sont absents du pack"
        }
    }
}

data class CharacterState(
    val id: String = "character.first_wanderer",
    var level: Int = 1,
    var experience: Int = 0
)

data class MetaState(
    val character: CharacterState = CharacterState(),
    val stash: MutableMap<String, Int> = mutableMapOf(
        "weapon.rusty_sword" to 1,
        "consumable.bandage" to 2
    ),
    var descents: Int = 0,
    var extractions: Int = 0,
    var deaths: Int = 0
)

data class RunState(
    var x: Int,
    var y: Int,
    var hp: Int = 12,
    var turns: Int = 0,
    val carried: MutableMap<String, Int> = mutableMapOf(),
    val collected: MutableSet<String> = mutableSetOf()
)

data class SessionState(
    val meta: MetaState = MetaState(),
    var run: RunState? = null
)

enum class Direction(val dx: Int, val dy: Int) {
    UP(0, -1), DOWN(0, 1), LEFT(-1, 0), RIGHT(1, 0)
}

data class ActionResult(val message: String, val changed: Boolean = true)
