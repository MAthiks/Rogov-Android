package com.rogov.android.ui

import com.rogov.game.core.GameEngine
import com.rogov.game.core.Point

/** Presentation-only projection. Replacing ASCII later won't change gameplay. */
object AsciiRenderer {
    fun render(engine: GameEngine): String {
        val run = engine.state.run ?: return ""
        return engine.content.map.tiles.mapIndexed { y, row ->
            row.mapIndexed { x, tile ->
                when {
                    x == run.x && y == run.y -> '@'
                    tile == 'S' -> '.'
                    tile == '$' && Point(x, y).key() in run.collected -> '.'
                    else -> tile
                }
            }.joinToString("")
        }.joinToString("\n")
    }
}
