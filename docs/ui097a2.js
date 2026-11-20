// UI-097A2 — Mobile-only reflow of the LIVE map navigation and warning.
// Reuse original DOM nodes, IDs and registered listeners. No game state,
// turns, RNG, hidden enemy inspection or save changes.
export function setupUi097A2({get,win=window,doc=document}){
  const nav=get("expedition-shortcuts");
  const warning=get("ui096-threat-banner");
  const ascii=get("dungeon-map");
  if(!nav||!warning||!ascii)throw new Error("UI-097A2 requires the existing cockpit nodes");
  const navHome=doc.createComment("UI-097A2: original shortcut position");
  const warningHome=doc.createComment("UI-097A2: original warning position");
  nav.before(navHome);
  warning.before(warningHome);
  let mounted=false;
  const mobile=()=>win.matchMedia("(max-width: 730px)").matches;

  function sync(){
    if(mobile()&&!mounted){
      // Warning first when imminent, then six real navigation actions.
      // The ASCII <pre> stays immediately before both, whether visible or not.
      ascii.after(warning,nav);
      mounted=true;
    }else if(!mobile()&&mounted){
      // Restore the original desktop DOM order and keyboard tab order.
      navHome.after(nav);
      warningHome.after(warning);
      mounted=false;
    }
  }
  sync();
  win.addEventListener("resize",sync);
  return Object.freeze({
    sync,
    isMounted:()=>mounted,
    dispose(){
      win.removeEventListener("resize",sync);
      if(mounted){
        navHome.after(nav);
        warningHome.after(warning);
        mounted=false;
      }
      navHome.remove();
      warningHome.remove();
    }
  });
}
