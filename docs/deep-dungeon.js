// DEV-080 — deterministic connected rooms and corridors, isolated from v0.7f gameplay.
// No secret or trap is required to escape. Generation is independent of combat RNG.
import {descentSeed,nextRandom} from "./combat-rules.js";
import {placeOptionalSecret} from "./secrets.js";

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
    const id=row*COLUMNS+col;
    const cx=6+col*10,cy=5+row*10;
    // Full-size rooms gain a one-cell masonry border; the entrance is ample.
    const width=id===8?9:7+rand(3),height=id===8?9:7+rand(3);
    const x=cx-Math.floor(width/2),y=cy-Math.floor(height/2);
    const role=id===8?"vestibule":id===3?"extraction":
      id===5?"ruines_occupees":id===10?"atelier_abandonne":
      ["traversee","chambre_echo","ruines","passage_service"][rand(4)];
    const room={id,x,y,width,height,cx,cy,role};
    rooms.push(room);
    // Only the room interior is floor. The perimeter remains solid stone,
    // pierced solely by deliberate one-tile passage mouths.
    for(let yy=y+1;yy<y+height-1;yy++)
      for(let xx=x+1;xx<x+width-1;xx++)grid[yy][xx]=".";
  }
  const doors=[],connections=[];
  function connect(a,b){
    let first,second;
    if(a.cy===b.cy){
      const y=a.cy+rand(3)-1;
      first={x:a.x+a.width-1,y};
      second={x:b.x,y};
      for(let x=first.x;x<=second.x;x++)grid[y][x]=".";
    }else{
      const x=a.cx+rand(3)-1;
      first={x,y:a.y+a.height-1};
      second={x,y:b.y};
      for(let y=first.y;y<=second.y;y++)grid[y][x]=".";
    }
    // One framed threshold on each room wall, never paired mandatory doors.
    connections.push({a:a.id,b:b.id,first,second});
  }
  // The 4×3 lattice preserves two independent, ordinary escape routes.
  for(let row=0;row<ROWS;row++)for(let col=0;col<COLUMNS;col++){
    const id=row*COLUMNS+col;
    if(col<COLUMNS-1)connect(rooms[id],rooms[id+1]);
    if(row<ROWS-1)connect(rooms[id],rooms[id+COLUMNS]);
  }
  // Six doors among 17 links, each on one side of its connection.
  // Other openings are unobstructed; max two doors in the same room.
  const order=connections.map((_,i)=>i);
  for(let i=order.length-1;i>0;i--){
    const j=rand(i+1);
    [order[i],order[j]]=[order[j],order[i]];
  }
  const roomDoorCount=Array(rooms.length).fill(0);
  for(const i of order){
    if(doors.length>=6)break;
    const link=connections[i];
    const candidates=rand(2)===0
      ? [{room:link.a,point:link.first},{room:link.b,point:link.second}]
      : [{room:link.b,point:link.second},{room:link.a,point:link.first}];
    const available=candidates.find(p=>roomDoorCount[p.room]<2);
    if(!available)continue;
    const {x,y}=available.point;
    grid[y][x]="+";
    doors.push({x,y,open:true});
    roomDoorCount[available.room]++;
  }
  if(doors.length!==6)throw new Error("No balanced door placement");
  const start={x:rooms[8].cx,y:rooms[8].cy};
  const exit={x:rooms[3].cx,y:rooms[3].cy};
  const valuable=roomPoint(rooms[5],rand);
  const tonic=roomPoint(rooms[10],rand);
  // QA-084: a real chest is immediately discoverable in the entry chamber.
  // Normal loot coordinates are retained, so old saves need no migration.
  const entry=rooms[8],entryOptions=[];
  for(let y=entry.y;y<entry.y+entry.height;y++)
    for(let x=entry.x;x<entry.x+entry.width;x++)
      if(grid[y][x]==="."&&distance({x,y},start)>=2&&distance({x,y},start)<=3&&
          !doors.some(d=>d.x===x&&d.y===y))entryOptions.push({x,y});
  if(!entryOptions.length)throw new Error("Entry chamber has no chest tile");
  const entryChest=entryOptions[rand(entryOptions.length)];
  grid[start.y][start.x]="S";
  grid[exit.y][exit.x]="E";
  for(const p of [valuable,tonic,entryChest])grid[p.y][p.x]="$";
  const loot={
    [key(valuable)]:"relic.ashen_fragment",
    [key(tonic)]:"consumable.dusk_tonic",
    [key(entryChest)]:"consumable.bandage"
  };
  const occupied=new Set([key(start),key(exit),...Object.keys(loot),...doors.map(key)]);
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
  // A first visible encounter is optional: place it on a perimeter tile
  // four or five steps from the entry, never in the mandatory return route.
  const scouts=[];
  for(let y=entry.y;y<entry.y+entry.height;y++)
    for(let x=entry.x;x<entry.x+entry.width;x++){
      const p={x,y},d=distance(p,start);
      if(grid[y][x]==="."&&!occupied.has(key(p))&&d>=4&&d<=5)
        scouts.push(p);
    }
  if(!scouts.length)throw new Error("Entry chamber has no safe enemy tile");
  const scout=scouts[rand(scouts.length)];
  enemies.push({id:"nhal-charognard-scout-01",kind:"charognard",
    x:scout.x,y:scout.y,hp:3});
  occupied.add(key(scout));

  function publicRoutesSafe(){
    const map=grid.map(row=>row.join(""));
    const blocked=new Set(enemies.map(key));
    if(!deepTwoReturnWays(map,start,exit)||!deepRoute(map,start,exit,blocked))return false;
    return Object.keys(loot).every(pos=>{
      const [x,y]=pos.split(",").map(Number),p={x,y};
      return deepTwoReturnWays(map,p,exit)&&
        deepRoute(map,p,exit,blocked)&&deepRoute(map,start,p,blocked);
    });
  }
  // First crack inside the entry LOS, second deeper in Nhal. Candidate
  // acceptance explicitly proves two safe ordinary return routes; no
  // hazard blocks the last path or spawns under a hero, foe or chest.
  function placeCrack(room,nearEntry){
    const candidates=[];
    for(let y=room.y;y<room.y+room.height;y++)
      for(let x=room.x;x<room.x+room.width;x++){
        const p={x,y},d=distance(p,start);
        if(grid[y][x]!=="."||occupied.has(key(p))||
          distance(p,exit)<4||
          Object.keys(loot).some(k=>{
            const [lx,ly]=k.split(",").map(Number);
            return distance(p,{x:lx,y:ly})<2;
          })||
          enemies.some(e=>distance(p,e)<2)||
          doors.some(door=>distance(p,door)<2))continue;
        if(nearEntry&&(d<2||d>4))continue;
        candidates.push(p);
      }
    const offset=rand(Math.max(1,candidates.length));
    for(let n=0;n<candidates.length;n++){
      const p=candidates[(offset+n)%candidates.length];
      grid[p.y][p.x]="^";
      if(publicRoutesSafe()){occupied.add(key(p));return true;}
      grid[p.y][p.x]=".";
    }
    return false;
  }
  const entryCrack=placeCrack(entry,true);
  const deepCrack=placeCrack(rooms[5],false)||placeCrack(rooms[9],false)||
    placeCrack(rooms[6],false);
  return {
    map:grid.map(row=>row.join("")),
    rooms,doors,doorPlanVersion:1,
    start,exit,loot,
    enemies,layoutId:"nhal-deep-"+index,
    // Rejected by strict new-layout validation if a fair location was absent.
    hazardsComplete:entryCrack&&deepCrack
  };
}
export function isDeepMap(map){
  return Array.isArray(map)&&map.length===DEEP_HEIGHT&&
    map.every(row=>typeof row==="string"&&row.length===DEEP_WIDTH);
}
/** Layout validation is intentionally stronger than shape checking. */
export function validateDeepLayout(layout,live=false){
  if(!layout||!isDeepMap(layout.map)||layout.map.some(row=>/[^#.+$SE^]/.test(row)))return false;
  const {map,rooms,doors,start,exit,loot,enemies}=layout;
  if(map[0]!=="#".repeat(DEEP_WIDTH)||
      map[DEEP_HEIGHT-1]!=="#".repeat(DEEP_WIDTH)||
      map.some(row=>row[0]!=="#"||row[DEEP_WIDTH-1]!=="#"))return false;
  const legacy=layout.doorPlanVersion===undefined;
  if(layout.doorPlanVersion!==undefined&&layout.doorPlanVersion!==1)return false;
  if(!Array.isArray(rooms)||rooms.length!==12||!Array.isArray(doors)||
      (legacy?doors.length!==34:doors.length!==6))return false;
  if(!start||!exit||tile(map,start)!=="S"||tile(map,exit)!=="E")return false;
  if(map.join("").split("S").length!==2||map.join("").split("E").length!==2)return false;
  if(!rooms.every((r,i)=>r?.id===i&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&
      Number.isInteger(r.width)&&Number.isInteger(r.height)&&
      r.width>=(legacy?5:7)&&r.width<=(legacy?7:9)&&
      r.height>=(legacy?5:7)&&r.height<=(legacy?7:9)&&
      inRoom({x:r.cx,y:r.cy},r)))return false;
  const doorKeys=new Set();
  for(const door of doors){
    if(!Number.isInteger(door?.x)||!Number.isInteger(door?.y)||typeof door.open!=="boolean"||
      tile(map,door)!=="+"||doorKeys.has(key(door)))return false;
    doorKeys.add(key(door));
  }
  if(map.join("").split("+").length-1!==doors.length)return false;
  if(!legacy){
    const caps=Array(rooms.length).fill(0),doorSet=new Set(doors.map(key));
    // Each door belongs to exactly one framed, non-corner room threshold;
    // its two flanking wall cells stay solid. Old runs keep their old scheme.
    for(const d of doors){
      const r=rooms.find(r=>d.x>=r.x&&d.x<r.x+r.width&&
        d.y>=r.y&&d.y<r.y+r.height);
      if(!r)return false;
      const vertical=d.x===r.x||d.x===r.x+r.width-1;
      const horizontal=d.y===r.y||d.y===r.y+r.height-1;
      if(vertical===horizontal)return false;
      if(vertical){
        if(d.y<r.y+2||d.y>r.y+r.height-3||
          tile(map,{x:d.x,y:d.y-1})!=="#"||
          tile(map,{x:d.x,y:d.y+1})!=="#")return false;
      }else if(d.x<r.x+2||d.x>r.x+r.width-3||
        tile(map,{x:d.x-1,y:d.y})!=="#"||
        tile(map,{x:d.x+1,y:d.y})!=="#")return false;
      if(++caps[r.id]>2)return false;
    }
    if(doorSet.size!==6)return false;
  }
  if(!loot||typeof loot!=="object"||Array.isArray(loot)||
      (!live&&Object.keys(loot).length!==3)||
      (live&&(Object.keys(loot).length<2||Object.keys(loot).length>3)))return false;
  const hazardCount=map.join("").split("^").length-1;
  if(!live&&(hazardCount!==2||layout.hazardsComplete!==true))return false;
  if(live&&hazardCount>2)return false;
  const lootKeys=new Set(Object.keys(loot));
  if(map.join("").split("$").length-1!==lootKeys.size)return false;
  if(!Object.entries(loot).every(([pos,id])=>{
    const [x,y]=pos.split(",").map(Number);
    return /^\d+,\d+$/.test(pos)&&tile(map,{x,y})==="$"&&
      ["relic.ashen_fragment","consumable.dusk_tonic","consumable.bandage"].includes(id);
  }))return false;
  if(!Array.isArray(enemies)||(!live&&enemies.length!==4)||enemies.length>4||
      new Set(enemies.map(e=>key(e))).size!==enemies.length)return false;
  for(const e of enemies){
    if(!["charognard","guardian","rift_larva"].includes(e.kind)||
      !Number.isInteger(e.x)||!Number.isInteger(e.y)||!Number.isInteger(e.hp)||
      !(tile(map,e)==="."||(live&&(tile(map,e)==="S"||
      (tile(map,e)==="+"&&doors.some(d=>d.x===e.x&&d.y===e.y&&d.open)))))||
      (!live&&distance(e,start)<4))return false;
  }
  if(!live){
    if(!Object.entries(loot).some(([pos,id])=>id==="consumable.bandage"&&
      (()=>{const [x,y]=pos.split(",").map(Number);return distance({x,y},start)<=3;})()))
      return false;
    if(!enemies.some(e=>distance(e,start)>=4&&distance(e,start)<=5))return false;
    if(!rooms[8]||!map.some((row,y)=>[...row].some((ch,x)=>
      ch==="^"&&distance({x,y},start)>=2&&distance({x,y},start)<=4)))return false;
  }
  if(!deepTwoReturnWays(map,start,exit))return false;
  const blocked=new Set(enemies.map(key));
  if(!live&&!deepRoute(map,start,exit,blocked))return false;
  for(const p of lootKeys){
    const [x,y]=p.split(",").map(Number),pos={x,y};
    if(!deepTwoReturnWays(map,pos,exit)||
      (!live&&!deepRoute(map,pos,exit,blocked))||
      (!live&&!deepRoute(map,start,pos,blocked)))return false;
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
      layout.secrets=placeOptionalSecret(layout,index,deepRoute);
      return layout;
    }
  }
  throw new Error("No fair deep Nhal layout found");
}
