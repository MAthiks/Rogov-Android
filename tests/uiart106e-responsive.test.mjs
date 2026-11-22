import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fitNhalMap106E,setupUi106E} from "../docs/uiart106e.js";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UI/ART-106E: optimize deep 11x11 vs wide 15x9 with square pixels",()=>{
  const basic={availableWidth:372,mapTop:174,dockTop:560,
    footerHeight:60,safety:8};
  assert.equal(fitNhalMap106E({...basic,columns:11,rows:11}),318);
  assert.equal(fitNhalMap106E({...basic,columns:15,rows:9}),372);
  assert.equal(fitNhalMap106E({...basic,columns:11,rows:11,dockTop:460}),218);
  assert.equal(fitNhalMap106E({...basic,columns:15,rows:9,dockTop:460}),363);
  assert.equal(fitNhalMap106E({...basic,dockTop:200,columns:11,rows:11}),0);
  assert.equal(fitNhalMap106E({...basic,availableWidth:600,dockTop:1400,columns:11,rows:11}),540);
  assert.throws(()=>fitNhalMap106E({...basic,columns:0,rows:11}),RangeError);
  assert.throws(()=>fitNhalMap106E({...basic,columns:11,rows:0}),RangeError);
});

function mockFixture(){
  const vars=new Map(),attrs=new Map(),listeners=new Map();
  const style={
    gridTemplateColumns:"repeat(11, minmax(0, 1fr))",
    setProperty(k,v){vars.set(k,v);},
    removeProperty(k){vars.delete(k);}
  };
  const wrap={getBoundingClientRect:()=>({left:4,right:389,width:385,bottom:553})};
  const map={
    style,hidden:false,children:Array(121).fill({}),
    closest:()=>wrap,
    getBoundingClientRect:()=>({left:12,right:344,top:174,bottom:506,width:332,height:332})
  };
  const controls={getBoundingClientRect:()=>({top:572,bottom:704})};
  const section={dataset:{},removeAttribute:k=>{attrs.set(k,"removed");delete section.dataset.nhal106eCamera;}};
  const nodes={"tile-map":map,"field-controls":controls,"expedition":section};
  let run=true,media=true,disconnected=false;
  const win={
    matchMedia:()=>({matches:media}),
    getComputedStyle:()=>({paddingLeft:"4px",paddingRight:"4px",borderLeftWidth:"2px",borderRightWidth:"2px"}),
    addEventListener:(k,fn)=>listeners.set(k,fn),
    removeEventListener:k=>listeners.delete(k),
    ResizeObserver:class {
      observe(){/* dock only */}
      disconnect(){disconnected=true;}
    },
    visualViewport:{
      addEventListener:(k,fn)=>listeners.set("viewport:"+k,fn),
      removeEventListener:k=>listeners.delete("viewport:"+k)
    }
  };
  return {get:id=>nodes[id],isRun:()=>run,win,map,section,vars,listeners,
    flags:{setRun:v=>run=v,setMobile:v=>media=v,isDisconnected:()=>disconnected}};
}

test("UI/ART-106E: geometry-only reflow, resize and teardown are reversible",()=>{
  const f=mockFixture();
  const ui=setupUi106E(f);
  ui.sync();
  assert.equal(f.section.dataset.nhal106eCamera,"square");
  assert.equal(f.vars.get("--nhal106e-map-width"),"347px");
  f.map.style.gridTemplateColumns="repeat(15, minmax(0, 1fr))";
  f.map.children=Array(135).fill({});
  f.listeners.get("resize")();
  assert.equal(f.section.dataset.nhal106eCamera,"wide");
  assert.equal(f.vars.get("--nhal106e-map-width"),"373px");
  f.flags.setMobile(false);ui.sync();
  assert.equal(f.vars.has("--nhal106e-map-width"),false);
  assert.equal(f.section.dataset.nhal106eCamera,undefined);
  f.flags.setMobile(true);f.flags.setRun(false);ui.sync();
  assert.equal(f.vars.has("--nhal106e-map-width"),false);
  f.flags.setRun(true);ui.sync();
  assert.equal(f.vars.has("--nhal106e-map-width"),true);
  ui.dispose();
  assert.equal(f.vars.has("--nhal106e-map-width"),false);
  assert.equal(f.listeners.size,0);
  assert.equal(f.flags.isDisconnected(),true);
});

test("UI/ART-106F: compact 320x640 viewport reserves extra real footer clearance",()=>{
  const f=mockFixture();
  f.win.innerWidth=320;
  f.win.innerHeight=640;
  const ui=setupUi106E(f);
  ui.sync();
  assert.equal(f.section.dataset.nhal106eCamera,"square");
  assert.equal(f.vars.get("--nhal106e-map-width"),"323px");
  // On a taller 360px portrait the map can occupy more space.
  f.win.innerWidth=360;
  f.win.innerHeight=800;
  ui.sync();
  assert.equal(f.vars.get("--nhal106e-map-width"),"347px");
  ui.dispose();
});

test("UI/ART-106E: stylesheet and offline bridge cannot change engine tiles",()=>{
  const html=read("docs/index.html"),css=read("docs/uiart106e.css");
  const app=read("docs/app.js"),sw=read("docs/sw.js");
  assert.ok(html.indexOf('href="./uiart106e.css?v=1"')>
    html.indexOf('href="./art106c-terrain.css?v=1"'));
  assert.match(app,/setupUi106E/);
  assert.match(app,/ui106e\.sync\(\)/);
  assert.match(sw,/uiart106e-responsive/);
  for(const item of ["uiart106e.js","uiart106e.css?v=1","art106e-cavern-bridge.svg"])
    assert.ok(sw.includes('"./'+item+'"'));
  assert.match(css,/--nhal106e-map-width/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(max-width:730px\) and \(max-height:760px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/\.pixel-tile[\s{:.#\[]/);
  assert.doesNotMatch(css,/pointer-events\s*:\s*auto/);
  assert.doesNotMatch(read("docs/art106e-cavern-bridge.svg"),/<(?:image|script|foreignObject)\b|(?:xlink:)?href=/i);
  assert.match(read("docs/game.js"),/rogov-web-v1/);
});
