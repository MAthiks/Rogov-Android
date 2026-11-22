// UI/ART-106E — Fit the REAL Nhal camera into the available Android viewport.
// This module reads geometry and existing tile count only. It never reads
// enemies, fog, saved game data, RNG, or map tile contents.
export function fitNhalMap106E({availableWidth,mapTop,dockTop,footerHeight,columns,rows,safety=9}){
  if(![availableWidth,mapTop,dockTop,footerHeight,columns,rows,safety]
    .every(Number.isFinite)||availableWidth<=0||columns<1||rows<1||
    footerHeight<0||safety<0)throw new RangeError("Invalid Nhal viewport geometry");
  const vertical=Math.max(0,dockTop-mapTop-footerHeight-safety);
  // Cells remain perfectly square. A 15x9 tutorial can only grow as wide as
  // the phone, while 11x11 Nhal can use the whole available square area.
  return Math.max(0,Math.floor(Math.min(availableWidth,540,vertical*columns/rows)));
}
export function setupUi106E({get,isRun,win=window}){
  const map=get("tile-map"),controls=get("field-controls"),
    section=get("expedition");
  if(!map||!controls||!section)throw new Error("UI/ART-106E: missing existing cockpit");
  let disposed=false;
  const mobile=()=>win.matchMedia("(max-width: 730px)").matches;
  function sync(){
    if(disposed)return;
    if(!isRun()||!mobile()||map.hidden||map.children.length===0){
      map.style.removeProperty("--nhal106e-map-width");
      section.removeAttribute("data-nhal106e-camera");
      return;
    }
    const columnsMatch=map.style.gridTemplateColumns.match(/repeat\((\d+)\s*,/);
    const columns=columnsMatch?Number(columnsMatch[1]):0;
    const count=map.children.length;
    if(!columns||count%columns!==0)return;
    const rows=count/columns,wrap=map.closest(".dungeon-wrap");
    if(!wrap)return;
    // Distinguishes the real 15x9 tutorial from the deep 11x11 dungeon.
    section.dataset.nhal106eCamera=columns>rows?"wide":"square";
    // Clear the previous camera width before measurement, so resizing back
    // to a larger screen never retains a narrower stale viewport.
    map.style.removeProperty("--nhal106e-map-width");
    const mapRect=map.getBoundingClientRect();
    const wrapRect=wrap.getBoundingClientRect();
    const dockRect=controls.getBoundingClientRect();
    const css=win.getComputedStyle(wrap);
    const horizontal=wrapRect.width-parseFloat(css.paddingLeft||"0")-
      parseFloat(css.paddingRight||"0")-parseFloat(css.borderLeftWidth||"0")-
      parseFloat(css.borderRightWidth||"0");
    if(!Number.isFinite(horizontal)||mapRect.top>=dockRect.top)return;
    // The live status line, any known branch hint and the real six-button
    // nav remain in document flow. Their CURRENT height is reserved first.
    const footer=Math.max(0,wrapRect.bottom-mapRect.bottom);
    const width=fitNhalMap106E({
      availableWidth:horizontal,mapTop:mapRect.top,dockTop:dockRect.top,
      footerHeight:footer,columns,rows,safety:8
    });
    // On extremely short screens leave scrolling available rather than
    // shrinking real 44px controls or making the dungeon illegible.
    if(width>=200)map.style.setProperty("--nhal106e-map-width",width+"px");
  }
  win.addEventListener("resize",sync);
  win.visualViewport?.addEventListener("resize",sync);
  const observer=typeof win.ResizeObserver==="function"?
    new win.ResizeObserver(sync):null;
  observer?.observe(controls);
  return Object.freeze({
    sync,dispose(){
      disposed=true;win.removeEventListener("resize",sync);
      win.visualViewport?.removeEventListener("resize",sync);
      observer?.disconnect();
      map.style.removeProperty("--nhal106e-map-width");
      section.removeAttribute("data-nhal106e-camera");
    }
  });
}
