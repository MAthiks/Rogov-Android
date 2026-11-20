// UI/ART-099 — compact mobile exploration without duplicating game DOM.
// The original action handlers and their nodes remain the only interactive
// controls; Fiche, inspection, legend and minimap move under the real Menu.
// No gameplay import, localStorage, RNG, enemy inspection or timer.
export const UI099_INFO_IDS=Object.freeze([
  "actor-stats-sheet","route-hint","inspect-panel",
  "exploration-map-panel","map-legend-details"
]);
export function setupUi099({get,isRun,win=window,doc=document}){
  const extras=get("ui099-extras"),slot=get("ui099-info-slot");
  const status=get("ui099-status"),inspection=get("ui099-inspect");
  if(!extras||!slot||!status||!inspection)
    throw new Error("UI-099 missing presentation anchors");
  const records=UI099_INFO_IDS.map(id=>{
    const node=get(id),home=doc.createComment("UI-099: original "+id);
    if(!node)throw new Error("UI-099 missing existing "+id);
    node.before(home);
    return {id,node,home};
  });
  const mobile=()=>win.matchMedia("(max-width: 730px)").matches;
  function sync(){
    const active=Boolean(isRun()&&mobile());
    extras.hidden=!active;
    if(active){
      for(const item of records)if(item.node.parentNode!==slot)slot.append(item.node);
      // Mirror ONLY the already rendered, public action label. This creates
      // no new game, visibility or save state and keeps feedback near the map.
      status.textContent=get("latest-message").textContent.trim()||"Explore Nhal.";
    }else{
      for(const item of records){
        // UI-096C alone owns the character panel while in the refuge.
        if(item.id==="actor-stats-sheet"&&!isRun())continue;
        if(item.home.parentNode && item.home.nextSibling!==item.node)
          item.home.after(item.node);
      }
    }
  }
  function noteInspection(cell){
    if(!isRun()||!mobile())return;
    if(cell?.dataset.knowledge!=="visible"){
      inspection.textContent="Zone inexplorée";
      return;
    }
    // Called AFTER the existing inspect() handler updates its two labels.
    inspection.textContent=get("inspect-title").textContent.trim();
  }
  win.addEventListener("resize",sync);
  return Object.freeze({sync,noteInspection});
}
