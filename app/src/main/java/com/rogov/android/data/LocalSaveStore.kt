package com.rogov.android.data

import android.content.Context
import com.rogov.game.core.CharacterState
import com.rogov.game.core.MetaState
import com.rogov.game.core.RunState
import com.rogov.game.core.SessionState
import org.json.JSONArray
import org.json.JSONObject

/** Single committed snapshot: a restart cannot restore equipment spent in an ongoing descent. */
class LocalSaveStore(context: Context) {
    companion object {
        const val SCHEMA_VERSION = 1
        private const val SAVE_KEY = "session_v1"
    }

    private val prefs = context.getSharedPreferences("rogov_local_save", Context.MODE_PRIVATE)

    fun load(): SessionState? {
        val raw = prefs.getString(SAVE_KEY, null) ?: return null
        val json = JSONObject(raw)
        require(json.getInt("schema_version") == SCHEMA_VERSION) {
            "Sauvegarde créée avec une version incompatible. Aucune donnée n'a été écrasée."
        }
        val metaNode = json.getJSONObject("meta")
        val hero = metaNode.getJSONObject("character")
        val character = CharacterState(
            hero.getString("id"),
            hero.getInt("level"),
            hero.getInt("experience")
        )
        val meta = MetaState(
            character,
            metaNode.getJSONObject("stash").toCounts(),
            metaNode.getInt("descents"),
            metaNode.getInt("extractions"),
            metaNode.getInt("deaths")
        )
        val runNode = json.optJSONObject("run")
        val run = if (runNode == null) null else {
            val collected = runNode.getJSONArray("collected")
            RunState(
                runNode.getInt("x"),
                runNode.getInt("y"),
                runNode.getInt("hp"),
                runNode.getInt("turns"),
                runNode.getJSONObject("carried").toCounts(),
                (0 until collected.length()).map { collected.getString(it) }.toMutableSet()
            )
        }
        return SessionState(meta, run)
    }

    fun save(state: SessionState): Boolean {
        val character = state.meta.character
        val meta = JSONObject()
            .put("character", JSONObject().put("id", character.id)
                .put("level", character.level).put("experience", character.experience))
            .put("stash", state.meta.stash.asJson())
            .put("descents", state.meta.descents)
            .put("extractions", state.meta.extractions)
            .put("deaths", state.meta.deaths)

        val snapshot = JSONObject().put("schema_version", SCHEMA_VERSION).put("meta", meta)
        val run = state.run
        if (run == null) {
            snapshot.put("run", JSONObject.NULL)
        } else {
            snapshot.put("run", JSONObject()
                .put("x", run.x).put("y", run.y)
                .put("hp", run.hp).put("turns", run.turns)
                .put("carried", run.carried.asJson())
                .put("collected", JSONArray(run.collected.toList())))
        }
        return prefs.edit().putString(SAVE_KEY, snapshot.toString()).commit()
    }

    private fun JSONObject.toCounts(): MutableMap<String, Int> = buildMap<String, Int> {
        for (key in keys()) put(key, getInt(key))
    }.toMutableMap()

    private fun Map<String, Int>.asJson(): JSONObject = JSONObject().also { json ->
        forEach { (key, value) -> json.put(key, value) }
    }
}
