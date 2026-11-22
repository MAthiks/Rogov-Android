// UI-092A — Presentation-only Android dungeon cockpit.
// Move existing interactive panels into a temporary bottom sheet. Preserve
// their DOM nodes, IDs and listeners: no game action, turn, RNG or save writes.
const PANEL_IDS=Object.freeze({
  "jump-combat":"combat-dock",
  "jump-action":"interaction-dock",
  "jump-report":"expedition-report",
  "jump-bag":"bag-panel",
  "jump-journal":"history-details",
  "jump-menu":"options-panel"
});
const LABELS=Object.freeze({
  "jump-combat":"COMBAT TACTIQUE",
  "jump-action":"ACTIONS À PORTÉE",
  "jump-report":"RAPPORT DE DESCENTE",
  "jump-bag":"SAC DE DESCENTE",
  "jump-journal":"JOURNAL",
  "jump-menu":"OPTIONS ET TITRE"
});
export const UI092_PANEL_IDS=PANEL_IDS;

/** Mount only after the DOM is ready. A new session starts with NO sheet open.
 * User navigation is free and entirely separate from game mechanics.
 */
export function setupUi092({get,isRun,isAscii}){
  const sheet=get("ui092-sheet"),mount=get("ui092-sheet-body");
  const title=get("ui092-sheet-title"),closeButton=get("ui092-sheet-close");
  const controls=get("field-controls");
  const navigation=get("expedition-shortcuts");
  let activeId=null,activeNode=null,placeholder=null;

  const mobile=()=>window.matchMedia("(max-width: 730px)").matches;
  function scrollToNode(node){
    const prefersReduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    node?.scrollIntoView({behavior:prefersReduced?"auto":"smooth",block:"start"});
  }
  function restore(){
    if(activeNode&&placeholder?.parentNode){
      placeholder.replaceWith(activeNode);
    }
    placeholder=null;activeNode=null;activeId=null;
    sheet.hidden=true;
    delete sheet.dataset.panel; // UI/ART-106F — presentation-only material tint
    for(const button of [...navigation.querySelectorAll("button"),get("jump-menu")]){
      button.setAttribute("aria-expanded","false");
      button.classList.remove("is-active");
    }
  }
  function open(id){
    if(!isRun())return;
    if(id==="jump-map"){
      restore();
      scrollToNode(isAscii()?get("dungeon-map"):get("tile-map"));
      return;
    }
    const node=get(PANEL_IDS[id]);
    if(!node||node.hidden){
      restore();
      if(!mobile())scrollToNode(isAscii()?get("dungeon-map"):get("tile-map"));
      return;
    }
    // The existing report and bag are real <details> components, not copies.
    if(id==="jump-bag"||id==="jump-report"||id==="jump-journal")node.open=true;
    if(!mobile()){
      restore();
      scrollToNode(node);
      return;
    }
    if(id===activeId){
      restore();
      return;
    }
    restore();
    placeholder=document.createComment("UI-092A: restore "+PANEL_IDS[id]);
    node.before(placeholder);
    mount.append(node);
    activeNode=node;activeId=id;title.textContent=LABELS[id];
    sheet.dataset.panel=id; // Existing UI092 panel ID, never a game-state field.
    sheet.hidden=false;
    measure(); // Reconcile the actual fixed dock edge before exposing content.
    const button=get(id);
    button?.setAttribute("aria-expanded","true");
    button?.classList.add("is-active");
    mount.scrollTop=0;
  }
  for(const id of ["jump-map",...Object.keys(PANEL_IDS)]){
    get(id)?.addEventListener("click",()=>open(id));
  }
  closeButton.addEventListener("click",()=>restore());
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!sheet.hidden){
      event.preventDefault();restore();
      get("jump-map")?.focus({preventScroll:true});
    }
  });

  // Height of the fixed field controls depends on viewport/safe-area. Use
  // measured pixels so the drawer never covers a healing/movement button.
  function measure(){
    if(!isRun()||!mobile())return;
    const dock=controls.getBoundingClientRect();
    const h=Math.ceil(dock.height);
    if(h<=0)return;
    const shell=get("game-shell");
    shell.style.setProperty("--ui092-dock-height",h+"px");
    // Height alone is insufficient when Android changes its visual viewport:
    // measure the dock's true top edge and reserve an 8px separation.
    const clearance=Math.max(h,Math.ceil(window.innerHeight-dock.top))+8;
    shell.style.setProperty("--ui098b1-sheet-bottom",clearance+"px");
  }
  if("ResizeObserver" in window)new ResizeObserver(measure).observe(controls);
  window.visualViewport?.addEventListener("resize",measure);
  window.addEventListener("resize",()=>{
    if(!mobile())restore();
    measure();
  });
  return Object.freeze({
    sync(){
      if(!isRun()||!mobile()||(activeNode&&activeNode.hidden))restore();
      for(const [id,target] of Object.entries(PANEL_IDS)){
        get(id).dataset.available=String(!get(target).hidden);
      }
      if(isRun())measure();
    },
    close:restore,
    current:()=>activeId
  });
}
