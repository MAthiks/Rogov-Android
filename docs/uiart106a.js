// UI/ART-106A — mirror only existing LIVE HUD elements; never game state.
// Touch menu proxies click the original registered buttons instead of
// introducing new mechanics, events or duplicate combat handlers.
export function setupUi106A({get,doc=document,isRun}){
  const trigger=get("nhal106-actions"),menu=get("nhal106-action-menu");
  if(!trigger||!menu)throw new Error("UI/ART-106A: missing action selector");
  const proxies=[...menu.querySelectorAll("[data-nhal106-proxy]")];
  const close=()=>{
    menu.hidden=true;
    trigger.setAttribute("aria-expanded","false");
  };
  trigger.addEventListener("click",()=>{
    if(!isRun())return;
    menu.hidden=!menu.hidden;
    trigger.setAttribute("aria-expanded",String(!menu.hidden));
  });
  for(const button of proxies){
    const id=button.dataset.nhal106Proxy;
    const target=get(id);
    if(!target)throw new Error("UI/ART-106A: missing real action "+id);
    button.addEventListener("click",()=>{
      if(button.disabled||target.disabled||!isRun())return;
      close();
      target.click();
    });
  }
  doc.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!menu.hidden){
      event.preventDefault();close();trigger.focus?.();
    }
  });
  doc.addEventListener("click",event=>{
    if(!menu.hidden&&!menu.contains(event.target)&&event.target!==trigger&&!trigger.contains(event.target))close();
  });
  function sync(){
    if(!isRun()){close();return;}
    // These are all updated by render() before this presentation sync.
    const copy=(destination,source)=>{
      get(destination).textContent=get(source).textContent.trim();
    };
    copy("nhal106-hp","hp");
    copy("nhal106-end","endurance-state");
    copy("nhal106-bag","bag-count");
    copy("nhal106-turn","turns");
    // Only the engine-owned floor badge is authoritative. A tutorial run
    // without a floorDepth deliberately says '—', never invents a level.
    get("nhal106-depth").textContent=get("floor-hud").hidden
      ?"—":get("floor-depth").textContent.trim();
    // The 106A resource plates now contain the ORIGINAL #health-meter and
    // #endurance-meter updated by app.js. No duplicate progress controls.
    for(const button of proxies){
      const target=get(button.dataset.nhal106Proxy);
      button.disabled=Boolean(target.disabled);
      button.setAttribute("aria-disabled",String(button.disabled));
    }
  }
  return Object.freeze({sync,close});
}
