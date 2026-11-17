package com.rogov.android

import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.rogov.android.data.AssetLoader
import com.rogov.android.data.LocalSaveStore
import com.rogov.android.ui.AsciiRenderer
import com.rogov.game.core.ActionResult
import com.rogov.game.core.Direction
import com.rogov.game.core.GameEngine
import com.rogov.game.core.SessionState

class MainActivity : Activity() {
    private val backgroundColor = Color.rgb(13, 19, 26)
    private val foregroundColor = Color.rgb(234, 237, 228)
    private val accentColor = Color.rgb(119, 173, 137)
    private val mutedColor = Color.rgb(165, 177, 176)
    private lateinit var game: GameEngine
    private lateinit var saves: LocalSaveStore
    private val prepared = mutableSetOf<String>()
    private var report = "Préparez votre descente à Nhal."

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = backgroundColor
        window.navigationBarColor = backgroundColor
        try {
            saves = LocalSaveStore(this)
            game = GameEngine(AssetLoader.load(this), saves.load() ?: SessionState())
            render()
        } catch (error: Exception) {
            val failure = TextView(this).apply {
                text = "ROGOV — Démarrage impossible.\n\n" + (error.message ?: "Erreur inconnue")
                textSize = 18f
                setTextColor(Color.WHITE)
                setBackgroundColor(backgroundColor)
                setPadding(30, 70, 25, 30)
            }
            setContentView(failure)
        }
    }

    private fun perform(action: () -> ActionResult) {
        try {
            val result = action()
            report = result.message
            if (result.changed && !saves.save(game.state)) {
                report += "\nATTENTION : la sauvegarde a échoué."
            }
            if (game.state.run == null) prepared.clear()
            render()
        } catch (error: Exception) {
            Toast.makeText(this, error.message ?: "Erreur de jeu", Toast.LENGTH_LONG).show()
        }
    }

    private fun render() {
        val scroll = ScrollView(this).apply {
            setBackgroundColor(backgroundColor)
            isFillViewport = true
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(32), dp(16), dp(24))
        }
        scroll.addView(root)
        setContentView(scroll)
        root.addView(label("ROGOV", 29f, accentColor, true))
        root.addView(label("VEYR / NHAL", 12f, mutedColor))
        spacer(root, 15)
        if (game.state.run == null) showRefuge(root) else showDescent(root)
        spacer(root, 15)
        root.addView(label("JOURNAL", 14f, accentColor, true))
        root.addView(label(report, 14f, foregroundColor))
        spacer(root, 16)
        root.addView(label("Prototype v0.1.1 · Hors ligne", 11f, mutedColor))
    }

    private fun showRefuge(root: LinearLayout) {
        val meta = game.state.meta
        root.addView(label("REFUGE DE VEYR", 20f, foregroundColor, true))
        spacer(root, 10)
        root.addView(label("L'ÉGARÉ · Niveau " + meta.character.level + " · " + meta.character.experience + " XP", 17f, accentColor))
        root.addView(label("Descentes " + meta.descents + " · Extractions " + meta.extractions + " · Rappels " + meta.deaths, 12f, mutedColor))
        spacer(root, 15)
        root.addView(label("COFFRE SÉCURISÉ", 17f, foregroundColor, true))
        root.addView(label("Coche les objets à emporter. En cas de mort, ils sont perdus.", 13f, mutedColor))
        val items = meta.stash.filter { it.value > 0 }.toSortedMap()
        if (items.isEmpty()) root.addView(label("Coffre vide. Tu peux partir sans équipement.", 14f, mutedColor))
        for ((id, count) in items) {
            val name = game.content.items.getValue(id).name
            val check = CheckBox(this).apply {
                text = name + " ×" + count
                textSize = 15f
                setTextColor(foregroundColor)
                buttonTintList = ColorStateList.valueOf(accentColor)
                isChecked = id in prepared
                setOnCheckedChangeListener { _, checked ->
                    if (checked) prepared.add(id) else prepared.remove(id)
                }
            }
            root.addView(check)
        }
        spacer(root, 16)
        root.addView(button("COMMENCER UNE DESCENTE") { perform { game.startDescent(prepared.toList()) } })
        spacer(root, 12)
        root.addView(label("Le personnage et l'XP persistent. Seul le butin extrait rejoint le coffre.", 13f, mutedColor))
    }

    private fun showDescent(root: LinearLayout) {
        val run = game.state.run ?: return
        root.addView(label("NHAL · DESCENTE " + game.state.meta.descents, 19f, foregroundColor, true))
        root.addView(label("PV " + run.hp + "/12  ·  Tours " + run.turns + "  ·  Sac " + run.carried.values.sum() + "/8", 15f, accentColor))
        spacer(root, 12)
        val mapLabel = label(AsciiRenderer.render(game), 17f, foregroundColor)
        mapLabel.typeface = Typeface.MONOSPACE
        root.addView(mapLabel)
        spacer(root, 8)
        root.addView(label("@ héros  ·  $ butin  ·  ^ mort  ·  E extraction", 12f, mutedColor))
        spacer(root, 15)
        val upper = LinearLayout(this).apply { gravity = Gravity.CENTER }
        upper.addView(button("↑", compact = true) { perform { game.move(Direction.UP) } })
        root.addView(upper)
        val lower = LinearLayout(this).apply { gravity = Gravity.CENTER }
        lower.addView(button("←", compact = true) { perform { game.move(Direction.LEFT) } })
        lower.addView(button("↓", compact = true) { perform { game.move(Direction.DOWN) } })
        lower.addView(button("→", compact = true) { perform { game.move(Direction.RIGHT) } })
        root.addView(lower)
        spacer(root, 12)
        root.addView(label("SAC DE DESCENTE", 16f, foregroundColor, true))
        if (run.carried.isEmpty()) root.addView(label("Vide", 14f, mutedColor))
        for ((id, count) in run.carried.toSortedMap()) {
            root.addView(label(game.content.items.getValue(id).name + " ×" + count, 14f, foregroundColor))
        }
        spacer(root, 8)
        root.addView(label("Atteins E pour extraire. Évite ^ : le Rappel te renvoie à Veyr sans équipement.", 13f, mutedColor))
    }

    private fun label(value: String, size: Float, color: Int, bold: Boolean = false): TextView =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            if (bold) setTypeface(typeface, Typeface.BOLD)
        }

    private fun button(value: String, compact: Boolean = false, action: () -> Unit): Button =
        Button(this).apply {
            text = value
            textSize = if (compact) 22f else 14f
            isAllCaps = false
            setTextColor(foregroundColor)
            backgroundTintList = ColorStateList.valueOf(Color.rgb(47, 62, 73))
            minHeight = dp(50)
            if (compact) {
                layoutParams = LinearLayout.LayoutParams(dp(72), dp(55)).apply {
                    setMargins(dp(2), dp(2), dp(2), dp(2))
                }
            }
            setOnClickListener { action() }
        }

    private fun spacer(root: LinearLayout, size: Int) {
        root.addView(View(this), LinearLayout.LayoutParams(1, dp(size)))
    }

    private fun dp(size: Int): Int = (size * resources.displayMetrics.density).toInt()
}
