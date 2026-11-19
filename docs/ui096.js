// UI-096B — Mirror only information ALREADY filtered for the visible player.
// Render calls this after the combat forecast and visible-hostile count exist.
// No state inspection, fog lookup, turn cost, saves or game actions.
export function syncUi096Threat({get,isRun}){
  const banner=get("ui096-threat-banner");
  const forecast=get("threat-forecast");
  const hostiles=get("threat-state");
  const immediate=Boolean(isRun && forecast && !forecast.hidden &&
    forecast.textContent.trim());
  // The HUD already names visible hostiles; do not repeat that count.
  // Reserve the banner for an actual imminent attack, still from visible-only DOM.
  banner.hidden=!immediate;
  banner.dataset.urgent=String(immediate);
  banner.textContent=immediate?forecast.textContent:"";
}
