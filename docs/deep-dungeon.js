// DEV-080 — deterministic connected rooms and corridors, isolated from v0.7f gameplay.
// No secret or trap is required to escape. Generation is independent of combat RNG.
import {descentSeed,nextRandom} from "./combat-rules.js";

export const DEEP_WIDTH=44;
export const DEEP_HEIGHT=32;
const COLUMNS=4;
const ROWS=3;
const DX=[1,0,-1,0], DY=[0,1,0,-1];
const key=(p)=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const tile=(map,p)=>map[p.y]?.[p.x]??"#";
const traversable=(map,p,blocked)=>tile(map,p)!=="#"&&tile(map,p)!=="^"&&!blocked.has(key(p));

function randomStream(index){
  let seed=descentSeed(index*739+80);
  return (limit)=>{
    const next=nextRandom(seed);
    seed=next.seed;
    return Math.floor(next.roll/101*limit);
  };
}
function neighbors(p){
  return DX.map((dx,i)=>({x:p.x+dx,y:p.y+DY[i]}));
}
export function deepRoute(map,from,to,blocked=new Set()){
  if(!traversable(map,from,blocked)||!traversable(map,to,blocked))return null;
  const queue=[from],seen=new Map([[key(from),null]]),points=new Map([[key(from),from]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i],k=key(p);
    if(k===key(to)){
      const route=[];let cursor=k;
      while(cursor!==null){route.push(points.get(cursor));cursor=seen.get(cursor);}
      return route.reverse();
    }
    for(const next of neighbors(p)){
      const id=key(next);
      if(!seen.has(id)&&traversable(map,next,blocked)){
        seen.set(id,k);points.set(id,next);queue.push(next);
      }
    }
  }
  return null;
}
export function deepTwoReturnWays(map,from,to,blocked=new Set()){
  const first=deepRoute(map,from,to,blocked);
  if(!first||first.length<2)return false;
  for(const cell of first.slice(1,-1)){
    const obstruction=new Set(blocked);obstruction.add(key(cell));
    if(!deepRoute(map,from,to,obstruction))return false;
  }
  return true;
}
const inRoom=(p,r)=>p.x>=r.x&&p.x<r.x+r.width&&p.y>=r.y&&p.y<r.y+r.height;
function roomPoint(room,rand){
  return {x:room.cx+rand(3)-1,y:room.cy+rand(3)-1};
}
function enemyInRoom(room,anchor,occupied,rand,maxDistance=Infinity){
  const candidates=[];
  for(let y=room.y+1;y<room.y+room.height-1;y++)
    for(let x=room.x+1;x<room.x+room.width-1;x++){
      const p={x,y};
      if(!occupied.has(key(p))&&distance(p,anchor)<=maxDistance)candidates.push(p);
    }
  return candidates.length?candidates[rand(candidates.length)]:null;
}
function makePlan(index){
  const rand=randomStream(index);
  const grid=Array.from({length:DEEP_HEIGHT},()=>Array(DEEP_WIDTH).fill("#"));
  const rooms=[];
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLUMNS;col++){
    const cx=6+col*10,cy=5+row*10;
    const width=5+rand(3),height=5+rand(3);
    const x=cx-Math.floor(width/2),y=cy-Math.floor(height/2);
    const id=row*COLUMNS+col;
    const role=id===8?"vestibule":id===3?"extraction":
      id===5?"ruines_occupees":id===10?"atelier_abandonne":
      ["traversee","chambre_echo","ruines","passage_service"][rand(4)];
    const room={id,x,y,width,height,cx,cy,role};
    rooms.push(room);
    for(let yy=y;yy<y+height;yy++)
      for(let xx=x;xx<x+width;xx++)grid[yy][xx]=".";
  }
  const doors=[];
  function connect(a,b){
    if(a.cy===b.cy){
      const y=a.cy+rand(3)-1;
      const left=a.x+a.width-1,right=b.x;
      for(let x=left;x<=right;x++)grid[y][x]=".";
      for(const x of [left,right]){
        grid[y][x]="+";
        doors.push({x,y,open:true});
      }
    }else{
      const x=a.cx+rand(3)-1;
      const top=a.y+a.height-1,bottom=b.y;
      for(let y=top;y<=bottom;y++)grid[y][x]=".";
      for(const y of [top,bottom]){
        grid[y][x]="+";
        doors.push({x,y,open:true});
      }
    }
  }
  // Complete 4×3 room lattice: redundant, ordinary connections, never secret.
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLUMNS;col++){
    const id=row*COLUMNS+col;
    if(col<COLUMNS-1)connect(rooms[id],rooms[id+1]);
    if(row<ROWS-1)connect(rooms[id],rooms[id+COLUMNS]);
  }
  const start={x:rooms[8].cx,y:rooms[8].cy};
  const exit={x:rooms[3].cx,y:rooms[3].cy};
  const valuable=roomPoint(rooms[5],rand);
  const tonic=roomPoint(rooms[10],rand);
  grid[start.y][start.x]="S";
  grid[exit.y][exit.x]="E";
  grid[valuable.y][valuable.x]="$";
  grid[tonic.y][tonic.x]="$";
  const occupied=new Set([key(start),key(exit),key(valuable),key(tonic),...doors.map(key)]);
  const enemySpecs=[
    ["charognard",rooms[5],valuable,2,3],
    ["guardian",rooms[6],{x:rooms[6].cx,y:rooms[6].cy},4,5],
    ["rift_larva",rooms[10],tonic,4,4]
  ];
  const enemies=[];
  for(const [kind,room,anchor,range,hp] of enemySpecs){
    const p=enemyInRoom(room,anchor,occupied,rand,range);
    if(!p)throw new Error("No safe spawn for "+kind);
    occupied.add(key(p));
    enemies.push({id:"nhal-"+kind+"-01",kind,x:p.x,y:p.y,hp});
  }
  return {
    map:grid.map(row=>row.join("")),
    rooms,doors,
    start,exit,
    loot:{[key(valuable)]:"relic.ashen_fragment",[key(tonic)]:"consumable.dusk_tonic"},
    enemies,layoutId:"nhal-deep-"+index
  };
}
export function isDeepMap(map){
  return Array.isArray(map)&&map.length===DEEP_HEIGHT&&
    map.every(row=>typeof row==="string"&&row.length===DEEP_WIDTH);
}
/** Layout validation is intentionally stronger than shape checking. */
export function validateDeepLayout(layout){
  if(!layout||!isDeepMap(layout.map)||layout.map.some(row=>/[^#.+$SE]/.test(row)))return false;
  const {map,rooms,doors,start,exit,loot,enemies}=layout;
  if(map[0]!=="#".repeat(DEEP_WIDTH)||
      map[DEEP_HEIGHT-1]!=="#".repeat(DEEP_WIDTH)||
      map.some(row=>row[0]!=="#"||row[DEEP_WIDTH-1]!=="#"))return false;
  if(!Array.isArray(rooms)||rooms.length!==12||!Array.isArray(doors)||doors.length!==34)return false;
  if(!start||!exit||tile(map,start)!=="S"||tile(map,exit)!=="E")return false;
  if(map.join("").split("S").length!==2||map.join("").split("E").length!==2)return false;
  if(!rooms.every((r,i)=>r?.id===i&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&
      Number.isInteger(r.width)&&Number.isInteger(r.height)&&r.width>=5&&r.width<=7&&
      r.height>=5&&r.height<=7&&inRoom({x:r.cx,y:r.cy},r)))return false;
  const doorKeys=new Set();
  for(const door of doors){
    if(!Number.isInteger(door?.x)||!Number.isInteger(door?.y)||typeof door.open!=="boolean"||
      tile(map,door)!=="+"||doorKeys.has(key(door)))return false;
    doorKeys.add(key(door));
  }
  if(map.join("").split("+").length-1!==doors.length)return false;
  if(!loot||typeof loot!=="object"||Array.isArray(loot)||Object.keys(loot).length!==2)return false;
  const lootKeys=new Set(Object.keys(loot));
  if(map.join("").split("$").length-1!==lootKeys.size)return false;
  if(!Object.entries(loot).every(([pos,id])=>{
    const [x,y]=pos.split(",").map(Number);
    return /^\d+,\d+$/.test(pos)&&tile(map,{x,y})==="$"&&
      ["relic.ashen_fragment","consumable.dusk_tonic"].includes(id);
  }))return false;
  if(!Array.isArray(enemies)||enemies.length!==3||
      new Set(enemies.map(e=>key(e))).size!==3)return false;
  for(const e of enemies){
    if(!["charognard","guardian","rift_larva"].includes(e.kind)||
      !Number.isInteger(e.x)||!Number.isInteger(e.y)||!Number.isInteger(e.hp)||
      tile(map,e)!=="."||distance(e,start)<4)return false;
  }
  if(!deepTwoReturnWays(map,start,exit))return false;
  const blocked=new Set(enemies.map(key));
  if(!deepRoute(map,start,exit,blocked))return false;
  for(const p of lootKeys){
    const [x,y]=p.split(",").map(Number),pos={x,y};
    if(!deepTwoReturnWays(map,pos,exit)||
      !deepRoute(map,pos,exit,blocked)||
      !deepRoute(map,start,pos,blocked))return false;
  }
  return true;
}
export function generateDeepLayout(index){
  if(!Number.isSafeInteger(index)||index<2)throw new RangeError("Invalid deep descent");
  // Deterministic, bounded attempts; stop rather than publish an unfair plan.
  for(let attempt=0;attempt<12;attempt++){
    const layout=makePlan(index+attempt*100003);
    if(validateDeepLayout(layout)){
      layout.layoutId="nhal-deep-"+index+"-"+attempt;
      return layout;
    }
  }
  throw new Error("No fair deep Nhal layout found");
}
