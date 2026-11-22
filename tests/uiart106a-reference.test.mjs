import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {setupUi106A} from "../docs/uiart106a.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

function fixture(){
  const nodes=new Map(),events={};
  const make=(id,{text="",value=0,max=1,hidden=false,disabled=false}={})=>{
    const node={
      id,textContent:text,value,max,hidden,disabled,dataset:{},handlers:{},
      attrs:new Map(),clicks:0,
      addEventListener(name,fn){this.handlers[name]=fn;},
      setAttribute(name,value){this.attrs.set(name,String(value));},
      contains(target){return target===this;},
      focus(){this.focused=true;},
      click(){this.clicks++;this.handlers.click?.({target:this});}
    };
    nodes.set(id,node);return node;
  };
  const original={
    hp:make("hp",{text:"9 / 12"}),
    "endurance-state":make("endurance-state",{text:"10 / 20"}),
    "bag-count":make("bag-count",{text:"5 / 8"}),
    turns:make("turns",{text:"48"}),
    "floor-hud":make("floor-hud"),
    "floor-depth":make("floor-depth",{text:"2 / 3"}),
    "health-meter":make("health-meter",{value:9,max:12}),
    "endurance-meter":make("endurance-meter",{value:10,max:20})
  };
  for(const id of ["nhal106-hp","nhal106-end","nhal106-bag","nhal106-turn",
    "nhal106-depth"])make(id);
  let run=true;
  const targetIds=["jump-combat","jump-action","listen-btn","jump-menu"];
  const proxies=targetIds.map(id=>{
    make(id);
    const b=make("proxy-"+id);
    b.dataset.nhal106Proxy=id;
    return b;
  });
  const button=make("nhal106-actions");
  const menu=make("nhal106-action-menu",{hidden:true});
  menu.querySelectorAll=()=>proxies;
  const ui=setupUi106A({
    get:id=>nodes.get(id),doc:{addEventListener(name,fn){events[name]=fn;}},
    isRun:()=>run
  });
  return {ui,nodes,original,events,button,menu,proxies,setRun:v=>run=v};
}

test("UI/ART-106A: screenshot-like layout is wired to the real expedition",()=>{
  const html=read("docs/index.html"),css=read("docs/uiart106a.css");
  const sw=read("docs/sw.js"),app=read("docs/app.js");
  for(const id of ["nhal106-depth","nhal106-turn","nhal106-hp","nhal106-end",
    "nhal106-bag","nhal106-actions","nhal106-action-menu",
    "health-meter","endurance-meter"])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.ok(html.indexOf('href="./uiart106a.css?v=1"')>
    html.indexOf('href="./art103d.css?v=1"'));
  assert.equal((html.match(/id="health-meter"/g)||[]).length,1);
  assert.equal((html.match(/id="endurance-meter"/g)||[]).length,1);
  assert.match(app,/setupUi106A/);
  assert.match(app,/ui106a\.sync\(\)/);
  assert.match(sw,/\.\/uiart106a.css\?v=1/);
  assert.match(sw,/\.\/uiart106a.js/);
  assert.match(css,/\.dungeon-wrap::before/);
  assert.match(css,/\.nhal106-vitals/);
  assert.match(css,/#nhal106-actions/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/https?:\/\//);
  assert.match(read("docs/game.js"),/rogov-web-v1/);
});

test("UI/ART-106A: decorative HUD exactly mirrors existing state after each render",()=>{
  const f=fixture();
  f.ui.sync();
  for(const [dst,expected] of [
    ["nhal106-hp","9 / 12"],["nhal106-end","10 / 20"],
    ["nhal106-bag","5 / 8"],["nhal106-turn","48"],["nhal106-depth","2 / 3"]
  ])assert.equal(f.nodes.get(dst).textContent,expected);
  assert.equal(f.nodes.get("health-meter").value,9);
  assert.equal(f.nodes.get("health-meter").max,12);
  assert.equal(f.nodes.get("endurance-meter").value,10);
  assert.equal(f.nodes.get("endurance-meter").max,20);
  f.original["floor-hud"].hidden=true;
  f.ui.sync();
  assert.equal(f.nodes.get("nhal106-depth").textContent,"—");
  f.original["hp"].textContent="2 / 12";
  f.original["health-meter"].value=2;
  f.ui.sync();
  assert.equal(f.nodes.get("nhal106-hp").textContent,"2 / 12");
  assert.equal(f.nodes.get("health-meter").value,2);
});

test("UI/ART-106A: Actions uses existing buttons, respects disabled and closes without game turns",()=>{
  const f=fixture();
  f.ui.sync();
  f.button.click();
  assert.equal(f.menu.hidden,false);
  assert.equal(f.button.attrs.get("aria-expanded"),"true");
  f.proxies[0].click();
  assert.equal(f.nodes.get("jump-combat").clicks,1);
  assert.equal(f.menu.hidden,true);
  assert.equal(f.button.attrs.get("aria-expanded"),"false");
  f.nodes.get("jump-action").disabled=true;
  f.ui.sync();
  assert.equal(f.proxies[1].disabled,true);
  f.proxies[1].click();
  assert.equal(f.nodes.get("jump-action").clicks,0);
  f.button.click();
  f.events.keydown({key:"Escape",preventDefault(){}});
  assert.equal(f.menu.hidden,true);
  f.button.click();
  f.setRun(false);
  f.ui.sync();
  assert.equal(f.menu.hidden,true);
  f.proxies[3].click();
  assert.equal(f.nodes.get("jump-menu").clicks,0);
});
