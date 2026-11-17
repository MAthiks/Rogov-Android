package com.rogov.game.core

import org.junit.Assert.*
import org.junit.Test

class GameEngineTest {
    private fun engine(): GameEngine {
        val lines = listOf(
            "###############",
            "#.............#",
            "#.......$.....#",
            "#....###......#",
            "#........^....#",
            "#.............#",
            "#..$..........#",
            "#S.^..#.....E.#",
            "###############"
        )
        val items = listOf(
            "weapon.rusty_sword",
            "consumable.bandage",
            "relic.ashen_fragment",
            "consumable.dusk_tonic"
        ).associateWith { ItemDefinition(it, it, "prototype", "") }
        return GameEngine(GameData(MapDefinition(
            "nhal.prototype_01", lines, mapOf(
                Point(3, 6) to "relic.ashen_fragment",
                Point(8, 2) to "consumable.dusk_tonic"
            )), items))
    }

    @Test fun deathLosesAllCarriedEquipmentButPreservesHeroAndStash() {
        val game = engine()
        game.startDescent(listOf("weapon.rusty_sword"))
        assertEquals(0, game.state.meta.stash.getValue("weapon.rusty_sword"))
        game.move(Direction.RIGHT)
        game.move(Direction.RIGHT)
        assertNull(game.state.run)
        assertEquals(1, game.state.meta.deaths)
        assertEquals(0, game.state.meta.stash.getValue("weapon.rusty_sword"))
        assertEquals(2, game.state.meta.stash.getValue("consumable.bandage"))
        assertEquals(1, game.state.meta.character.level)
        assertEquals(0, game.state.meta.character.experience)
        assertTrue(game.startDescent(emptyList()).changed)
    }

    @Test fun extractionSecuresBroughtAndCollectedItemsAndGrantsXp() {
        val game = engine()
        game.startDescent(listOf("weapon.rusty_sword"))
        game.move(Direction.UP)
        game.move(Direction.RIGHT)
        game.move(Direction.RIGHT)
        assertEquals(1, game.state.run!!.carried.getValue("relic.ashen_fragment"))
        assertEquals(1, game.state.meta.character.experience)
        repeat(9) { game.move(Direction.RIGHT) }
        game.move(Direction.DOWN)
        assertNull(game.state.run)
        assertEquals(1, game.state.meta.extractions)
        assertEquals(1, game.state.meta.stash.getValue("weapon.rusty_sword"))
        assertEquals(1, game.state.meta.stash.getValue("relic.ashen_fragment"))
        assertEquals(3, game.state.meta.character.experience)
    }

    @Test fun walkingIntoWallDoesNotConsumeTurn() {
        val game = engine()
        game.startDescent(emptyList())
        assertFalse(game.move(Direction.LEFT).changed)
        assertEquals(0, game.state.run!!.turns)
    }

    @Test fun invalidLoadoutCannotSpendOrCreateItems() {
        val game = engine()
        assertFalse(game.startDescent(listOf("missing.item")).changed)
        assertFalse(game.startDescent(listOf("consumable.bandage", "consumable.bandage")).changed)
        assertNull(game.state.run)
        assertEquals(2, game.state.meta.stash.getValue("consumable.bandage"))
        assertEquals(0, game.state.meta.descents)
    }

    @Test fun reloadedCoreDoesNotRegenerateCommittedEquipment() {
        val game = engine()
        game.startDescent(listOf("weapon.rusty_sword"))
        val resumed = GameEngine(game.content, game.state)
        assertEquals(0, resumed.state.meta.stash.getValue("weapon.rusty_sword"))
        resumed.die()
        assertEquals(0, resumed.state.meta.stash.getValue("weapon.rusty_sword"))
    }

    @Test fun deathPreservesExperienceAlreadyGainedDuringDescent() {
        val game = engine()
        game.startDescent(emptyList())
        game.move(Direction.UP)
        game.move(Direction.RIGHT)
        game.move(Direction.RIGHT)
        assertEquals(1, game.state.meta.character.experience)
        game.die()
        assertEquals(1, game.state.meta.character.experience)
        assertEquals(1, game.state.meta.stash.getValue("weapon.rusty_sword"))
        assertEquals(0, game.state.meta.stash.getOrDefault("relic.ashen_fragment", 0))
    }
}
