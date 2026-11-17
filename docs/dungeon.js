// VAR-077 — deterministic Nhal layout generation. No hidden collapses or one-way locks.
// Every generated floor is checked for independent return paths; movement never
// creates or destroys walls after the hero enters.
import {descentSeed,nextRandom} from "./combat-rules.js";

export const BASE_MAP=Object.freeze([
  "###############",
  "#.............#",
  "#.......$.....#",
  "#....###......#",
  "#........^....#",
  "#.............#",
  "#..$..........#",
  "#S.^..#.....E.#",
  "###############"
]);
export const BASE_LOOT=Object.freeze({
  "3,6":"relic.ashen_fragment","8,2":"consumable.dusk_tonic"
});
const START={x:1,y:7};
const LEGACY_ENEMIES=Object.freeze([
  {id:"nhal-charognard-01",kind:"charognard",x:3,y:2,hp:3},
  {id:"nhal-guardian-01",kind:"guardian",x:11,y:2,hp:5},
  {id:"nhal-rift-larva-01",kind:"rift_larva",x:6,y:2,hp:4}
]);
const HP=Object.freeze({charognard:3,guardian:5,rift_larva:4});
const key=({x,y})=>x+","+y;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
const tile=(map,p)=>map[p.y]?.[p.x]??"#";
const safe=(map,p,blocked=new Set())=>!["#","^"].includes(tile(map,p))&&!blocked.has(key(p));
const clone=(rows)=>rows.map(r=>r.split(""));
const asRows=(grid)=>grid.map(r=>r.join(""));
function stream(index){
  let value=descentSeed(index);
  return (limit)=>{
    const next=nextRandom(value);
    value=next.seed;
    return Math.floor(next.roll/101*limit); // deterministic, decoupled from battle RNG
  };
}
function shuffled(values,rand){
  const copy=values.slice();
  for(let i=copy.length-1;i>0;i--){
    const j=rand(i+1);
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
function neighbors(p){return dirs.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}));}
export function safeRoute(map,from,to,blocked=new Set()){
  if(!safe(map,from,blocked)||!safe(map,to,blocked))return null;
  const queue=[from],prior=new Map([[key(from),null]]),positions=new Map([[key(from),from]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];if(key(p)===key(to)){
      const result=[];let k=key(p);
      while(k!==null){result.push(positions.get(k));k=prior.get(k);}
      return result.reverse();
    }
    for(const neighbor of neighbors(p)){
      const k=key(neighbor);
      if(!prior.has(k)&&safe(map,neighbor,blocked)){
        prior.set(k,key(p));positions.set(k,neighbor);queue.push(neighbor);
      }
    }
  }
  return null;
}
/** No bridge/cut-vertex between a loot point and extraction. A blocked first
 * route cannot be the only return: removing any interior vertex still leaves
 * a safe path, so the player can retreat via a real alternative.
 */
export function twoReturnWays(map,from,to,blocked=new Set()){
  const route=safeRoute(map,from,to,blocked);
  if(!route||route.length<2)return false;
  for(const point of route.slice(1,-1)){
    const occupied=new Set(blocked);occupied.add(key(point));
    if(!safeRoute(map,from,to,occupied))return false;
  }
  return true;
}
function layoutPattern(grid,variant,rand){
  const wall=(x,y)=>{if(x>1&&x<13&&y>1&&y<7)grid[y][x]="#";};
  const lines=[
    [[5,2],[5,3],[5,5],[5,6],[9,2],[9,4],[9,5]],
    [[3,3],[4,3],[6,3],[7,3],[9,5],[10,5],[11,5]],
    [[4,2],[4,3],[7,3],[7,4],[10,4],[10,5],[6,6]],
    [[3,4],[4,4],[6,2],[6,3],[8,5],[9,5],[11,3]]
  ];
  for(const [x,y] of lines[variant])wall(x,y);
  for(let i=0;i<3;i++){
    const x=2+rand(11),y=2+rand(5);
    wall(x,y);
  }
}
function candidates(map){const items=[];
  for(let y=2;y<=6;y++)for(let x=2;x<=12;x++){
    const p={x,y};
    if(tile(map,p)==="." && dist(p,START)>=5 &&
      neighbors(p).filter(n=>safe(map,n)).length>=2)items.push(p);
  }
  return items;
}
function chooseEnemy(kind,choices,loot,occupied,rand,desired){
  const available=shuffled(choices,rand).filter(p=>!occupied.has(key(p)) &&
    dist(p,START)>=4 && dist(p,loot)>=2 && dist(p,loot)<=desired);
  return available[0]??null;
}
function place(index,attempt){
  const rand=stream(index*97+attempt*7919);
  const variant=(index-2+attempt)%4;
  const grid=Array.from({length:9},(_,y)=>Array.from({length:15},(_,x)=>
    x===0||x===14||y===0||y===8?"#":"."));
  layoutPattern(grid,variant,rand);
  grid[START.y][START.x]="S";
  const exits=[{x:12,y:7},{x:12,y:1},{x:13,y:4},{x:13,y:6}];
  const exit=exits[variant];grid[exit.y][exit.x]="E";
  const map=asRows(grid);
  const pool=shuffled(candidates(map),rand);
  const primary=pool.find(p=>twoReturnWays(map,p,exit)&&twoReturnWays(map,START,p));
  if(!primary)return null;
  grid[primary.y][primary.x]="$";
  const mapWithFirst=asRows(grid);
  const secondary=pool.find(p=>key(p)!==key(primary) && dist(p,primary)>=4 &&
    twoReturnWays(mapWithFirst,p,exit)&&twoReturnWays(mapWithFirst,START,p));
  if(!secondary)return null;
  grid[secondary.y][secondary.x]="$";
  const taken=new Set([key(START),key(exit),key(primary),key(secondary)]);
  const open=shuffled(candidates(asRows(grid)),rand);
  const hazards=open.filter(p=>!taken.has(key(p))&&dist(p,primary)>=2);
  const chosenHazards=hazards.slice(0,variant%2===0?2:1);
  for(const p of chosenHazards){grid[p.y][p.x]="^";taken.add(key(p));}
  const current=asRows(grid);
  if(!twoReturnWays(current,START,exit) ||
    !twoReturnWays(current,primary,exit) ||
    !twoReturnWays(current,secondary,exit))return null;
  const available=shuffled(candidates(current),rand);
  const specs=[
    ["charognard",primary,2],
    ["guardian",primary,4],
    ["rift_larva",secondary,5]
  ];
  const enemies=[];
  for(const [kind,around,range] of specs){
    const choice=chooseEnemy(kind,available,around,taken,rand,range);
    if(!choice)return null;
    taken.add(key(choice));
    enemies.push({id:"nhal-"+kind+"-01",kind,x:choice.x,y:choice.y,hp:HP[kind]});
  }
  const blocked=new Set(enemies.map(key));
  // Retreat and extraction remain traversable without requiring combat;
  // choosing dangerous shortcuts remains voluntary and potentially rewarding.
  if(!safeRoute(current,START,exit,blocked) ||
    !safeRoute(current,primary,exit,blocked) ||
    !safeRoute(current,secondary,exit,blocked))return null;
  if(!twoReturnWays(current,START,exit))return null;
  return {
    map:current,
    loot:{[key(primary)]:"relic.ashen_fragment",[key(secondary)]:"consumable.dusk_tonic"},
    enemies,
    layoutId:"nhal-"+index+"-"+variant,
    exit,
    start:{...START}
  };
}
export function generateLayout(index){
  if(!Number.isSafeInteger(index)||index<1)throw new RangeError("Invalid descent number");
  if(index===1)return {
    map:BASE_MAP.slice(),loot:{...BASE_LOOT},
    enemies:LEGACY_ENEMIES.map(e=>({...e})),
    layoutId:"nhal-introduction",exit:{x:12,y:7},start:{...START}
  };
  for(let attempt=0;attempt<80;attempt++){
    const layout=place(index,attempt);
    if(layout)return layout;
  }
  throw new Error("No fair Nhal layout found: generation aborted");
}
export function validateLayout(map,loot){
  if(!Array.isArray(map)||map.length!==9 ||map.some(row=>typeof row!=="string"||
    row.length!==15||/[^#.$^SE]/.test(row)))return false;
  if(map[7]?.[1]!=="S")return false;
  if(map.join("").split("E").length!==2)return false;
  if(map.some((line,y)=>y===0||y===8?line!=="###############":
    line[0]!=="#"||line[14]!=="#"))return false;
  if(!loot||typeof loot!=="object"||Array.isArray(loot))return false;
  const tiles=new Set();
  for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){
    if(map[y][x]==="$")tiles.add(x+","+y);
  }
  if(tiles.size!==Object.keys(loot).length)return false;
  for(const [pos,item] of Object.entries(loot)){
    if(!tiles.has(pos))return false;
    if(!["relic.ashen_fragment","consumable.dusk_tonic"].includes(item))return false;
    const m=/^(\d+),(\d+)$/.exec(pos);
    if(!m||map[Number(m[2])]?.[Number(m[1])]!=="$")return false;
  }
  return true;
}
