package com.rogov.android.data

import android.content.Context
import com.rogov.game.core.GameData
import com.rogov.game.core.ItemDefinition
import com.rogov.game.core.MapDefinition
import com.rogov.game.core.Point
import org.json.JSONObject

object AssetLoader {
    fun load(context: Context): GameData {
        val itemsJson = JSONObject(readAsset(context, "rogov/items.json"))
        val mapJson = JSONObject(readAsset(context, "rogov/map.json"))
        require(itemsJson.getInt("schema_version") == 1 && mapJson.getInt("schema_version") == 1) {
            "Version du pack de contenu non compatible"
        }
        val items = buildMap<String, ItemDefinition> {
            val list = itemsJson.getJSONArray("items")
            for (i in 0 until list.length()) {
                val node = list.getJSONObject(i)
                val item = ItemDefinition(
                    id = node.getString("id"),
                    name = node.getString("name"),
                    kind = node.getString("kind"),
                    description = node.getString("description")
                )
                require(item.id !in this) { "Identifiant d'objet en double" }
                put(item.id, item)
            }
        }
        val rows = mapJson.getJSONArray("tiles")
        val tiles = (0 until rows.length()).map { rows.getString(it) }
        val lootJson = mapJson.getJSONArray("loot")
        val loot = buildMap<Point, String> {
            for (i in 0 until lootJson.length()) {
                val node = lootJson.getJSONObject(i)
                val position = Point(node.getInt("x"), node.getInt("y"))
                require(position !in this) { "Butin en double" }
                put(position, node.getString("item_id"))
            }
        }
        return GameData(MapDefinition(mapJson.getString("map_id"), tiles, loot), items)
    }

    private fun readAsset(context: Context, path: String): String =
        context.assets.open(path).bufferedReader(Charsets.UTF_8).use { it.readText() }
}
