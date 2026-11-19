// UI-096C: reuse the existing character details between Veyr and Nhal.
// This controller only moves a single DOM node and scrolls to existing panels.
// No save writes, gameplay actions, RNG or duplicated interactive controls.
export const REFUGE_DESTINATIONS=Object.freeze({
  prepare:"refuge-preparation",
  forge:"veyr-forge",
  echoes:"echo-dossier-refuge",
  character:"refuge-character-slot"
});
export function setupUi096C({get,isRun}){
  const sheet=get("actor-stats-sheet");
  const refugeSlot=get("refuge-character-slot");
  const expeditionAnchor=document.createComment("UI-096C: original expedition character position");
  sheet.before(expeditionAnchor);
  const navigation=get("refuge-quick-nav");
  const targets=Object.freeze({...REFUGE_DESTINATIONS});
  const buttons=[...navigation.querySelectorAll("button[data-refuge-go]")];
  function activate(button){
    if(isRun())return;
    const destination=button.dataset.refugeGo;
    if(!Object.hasOwn(targets,destination))return;
    const target=get(targets[destination]);
    if(!target)return;
    if(destination==="echoes"||destination==="character"){
      const details=destination==="character"?sheet:target;
      details.open=true;
    }
    for(const entry of buttons){
      entry.setAttribute("aria-pressed",String(entry===button));
    }
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    target.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
  }
  for(const button of buttons)button.addEventListener("click",()=>activate(button));
  return Object.freeze({
    sync(){
      const refuge=!isRun();
      get("game-shell").classList.toggle("is-refuge",refuge);
      // The exact existing <details> retains its state, IDs and children.
      const parent=refuge?refugeSlot:expeditionAnchor.parentNode;
      if(sheet.parentNode!==parent){
        if(refuge)refugeSlot.append(sheet);
        else expeditionAnchor.after(sheet);
      }
      if(!refuge)for(const button of buttons)button.setAttribute("aria-pressed","false");
    }
  });
}
