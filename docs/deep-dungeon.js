// DEV-080 — deterministic connected rooms and corridors, isolated from v0.7f gameplay.
// No secret or trap is required to escape. Generation is independent of combat RNG.
import {descentSeed,nextRandom} from "./combat-rules.js";
import {planDeepChestLoot,EQUIPMENT_LOOT_POOL,CONSUMABLE_LOOT_POOL} from "./loot.js";
import {placeOptionalSecret} from "./secrets.js";
import {placeOptionalTraps,validTraps} from "./traps.js";
import {specialRoomPlan,placeRoomSites,validRoomSites} from "./room-events.js";
import {GRAPH_VERSION,CORE_SLOTS,topologyEdges,planDeepTopology} from "./deep-topology.js";

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
// Equivalent to testing the removal of every internal tile of a route,
// but linear in traversable cells. Articulation vertices on the DFS chain
// from 'from' to 'to' are the only tiles that can break their connection.
// DEV-086: 200-seed generation must remain practical on Android CPUs.
export function deepTwoReturnWays(map,from,to,blocked=new Set()){
  const source=key(from),target=key(to);
  if(source===target||!traversable(map,from,blocked)||
      !traversable(map,to,blocked))return false;
  const discovered=new Map(),low=new Map();
  const parent=new Map();
  let clock=0,critical=false;
  function visit(p){
    const current=key(p);
    discovered.set(current,++clock);
    low.set(current,clock);
    let containsTarget=current===target;
    for(const q of neighbors(p)){
      if(!traversable(map,q,blocked))continue;
      const adjacent=key(q);
      if(!discovered.has(adjacent)){
        parent.set(adjacent,current);
        const childHasTarget=visit(q);
        low.set(current,Math.min(low.get(current),low.get(adjacent)));
        if(childHasTarget&&current!==source&&current!==target&&
            low.get(adjacent)>=discovered.get(current))critical=true;
        containsTarget=containsTarget||childHasTarget;
      }else if(adjacent!==parent.get(current)){
        low.set(current,Math.min(low.get(current),discovered.get(adjacent)));
      }
    }
    return containsTarget;
  }
  return visit(from)&&!critical;
}
const inRoom=(p,r)=>p.x>=r.x&&p.x<r.x+r.width&&p.y>=r.y&&p.y<r.y+r.height;

// DEV-089A: actual blocked masonry inside rooms, not decorative sprites.
// Keep the 4×3 graph through DEV-089A; DEV-089C will change connectivity.
export const ROOM_SHAPES=Object.freeze(["rectangle","l","pillar","collapsed","alcove"]);
export const ROOM_GEOMETRY_VERSION=1;
const SHAPE_ROOMS=Object.freeze([1,2,4,7,9]);
function roomShapePlan(index){
  const offset=index%SHAPE_ROOMS.length;
  return new Map([
    [index%2===0?0:11,"l"],
    [SHAPE_ROOMS[offset],"pillar"],
    [SHAPE_ROOMS[(offset+2)%SHAPE_ROOMS.length],"collapsed"],
    [SHAPE_ROOMS[(offset+4)%SHAPE_ROOMS.length],"alcove"]
  ]);
}
function roomObstacles(room){
  const {x,y,width,height,cx,cy,shape,id}=room;
  const corner=room.slot??id;
  if(shape==="l"){
    // The L cut faces the outer map boundary: no public threshold on
    // these sides. All other directions remain independently traversable.
    const ox=corner===0?x+1:x+width-3,oy=corner===0?y+1:y+height-3;
    return [{x:ox,y:oy},{x:ox+1,y:oy},
      {x:ox,y:oy+1},{x:ox+1,y:oy+1}];
  }
  if(shape==="pillar")return [{x:cx,y:cy}];
  if(shape==="collapsed")return [{x:cx-1,y:cy+1},{x:cx,y:cy+1}];
  if(shape==="alcove")return [{x:cx-1,y:cy-1},{x:cx+1,y:cy-1}];
  return [];
}

function roomPoint(room,rand,map=null){
  const choices=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const p={x:room.cx+dx,y:room.cy+dy};
    if(!map||tile(map,p)===".")choices.push(p);
  }
  if(!choices.length)throw new Error("No safe loot tile");
  return choices[rand(choices.length)];
}
function enemyInRoom(room,anchor,occupied,rand,maxDistance=Infinity,map=null){
  const candidates=[];
  for(let y=room.y+1;y<room.y+room.height-1;y++)
    for(let x=room.x+1;x<room.x+room.width-1;x++){
      const p={x,y};
      if((!map||tile(map,p)===".")&&!occupied.has(key(p))&&
          distance(p,anchor)<=maxDistance)candidates.push(p);
    }
  return candidates.length?candidates[rand(candidates.length)]:null;
}
function makePlan(index){
  const rand=randomStream(index);
  const plan=planDeepTopology(index,rand);
  const grid=Array.from({length:DEEP_HEIGHT},()=>Array(DEEP_WIDTH).fill("#"));
  const rooms=[];
  const xOffset=Array.from({length:COLUMNS},()=>rand(2));
  const yOffset=Array.from({length:ROWS},()=>rand(2));
  for(const slot of plan.slots){
    const col=slot%COLUMNS,row=Math.floor(slot/COLUMNS);
    const cx=6+col*10+xOffset[col],cy=5+row*10+yOffset[row];
    const width=slot===8?9:7+rand(3);
    const height=slot===8?9:7+rand(3);
    const x=cx-Math.floor(width/2),y=cy-Math.floor(height/2);
    const role=slot===plan.roleSlots.entry?"vestibule":
      slot===plan.roleSlots.exit?"extraction":
      slot===plan.roleSlots.atelier?"atelier_abandonne":
      slot===plan.roleSlots.echo?"chambre_echo":
      slot===plan.roleSlots.cache?"cache_scellee":
      slot===plan.roleSlots.valuable?"ruines_occupees":
      ["traversee","ruines","passage_service"][rand(3)];
    const room={id:rooms.length,slot,x,y,width,height,cx,cy,role,
      shape:plan.shapes.get(slot)||"rectangle"};
    rooms.push(room);
    for(let yy=y+1;yy<y+height-1;yy++)
      for(let xx=x+1;xx<x+width-1;xx++){
        if(grid[yy]?.[xx]!== "#" )throw new Error("Overlapping rooms");
        grid[yy][xx]=".";
      }
  }
  const bySlot=new Map(rooms.map(r=>[r.slot,r]));
  const entry=bySlot.get(plan.roleSlots.entry);
  const extraction=bySlot.get(plan.roleSlots.exit);
  const valuableRoom=bySlot.get(plan.roleSlots.valuable);
  const tonicRoom=bySlot.get(plan.roleSlots.atelier);
  const guardianRoom=bySlot.get(plan.roleSlots.guardian);
  const doors=[],connections=[];

  // A connector crosses the center of exactly one wall on each room.
  // Non-adjacent rooms may be linked through an empty skipped slot, but
  // the corridor never traverses another chamber.
  function connect(a,b){
    if(a.cx!==b.cx&&a.cy!==b.cy)
      throw new Error("Non-cardinal corridor in variable graph");
    let first,second;
    if(a.cy!==b.cy){
      const upper=a.cy<b.cy?a:b,lower=upper===a?b:a;
      const min=Math.max(upper.x+2,lower.x+2);
      const max=Math.min(upper.x+upper.width-3,lower.x+lower.width-3);
      if(min>max)throw new Error("No aligned vertical doorway");
      const x=min+rand(max-min+1);
      const u={x,y:upper.y+upper.height-1},l={x,y:lower.y};
      if(u.y>=l.y)throw new Error("Overlapping corridor walls");
      for(let y=u.y;y<=l.y;y++)grid[y][x]=".";
      first=upper===a?u:l;second=upper===a?l:u;
    }else{
      const left=a.cx<b.cx?a:b,right=left===a?b:a;
      const min=Math.max(left.y+2,right.y+2);
      const max=Math.min(left.y+left.height-3,right.y+right.height-3);
      if(min>max)throw new Error("No aligned horizontal doorway");
      const y=min+rand(max-min+1);
      const l={x:left.x+left.width-1,y},r={x:right.x,y};
      if(l.x>=r.x)throw new Error("Overlapping corridor walls");
      for(let x=l.x;x<=r.x;x++)grid[y][x]=".";
      first=left===a?l:r;second=left===a?r:l;
    }
    connections.push({a:a.id,b:b.id,first,second});
  }
  for(const link of plan.edges)
    connect(bySlot.get(link.a),bySlot.get(link.b));

  // Retain six framed, optional, reversible doors; exactly two belong
  // to the vestibule. No room receives more than two actual door leaves.
  const order=connections.map((_,i)=>i);
  for(let i=order.length-1;i>0;i--){
    const j=rand(i+1);[order[i],order[j]]=[order[j],order[i]];
  }
  const roomDoorCount=Array(rooms.length).fill(0);
  for(const link of connections.filter(c=>c.a===entry.id||c.b===entry.id)){
    const p=link.a===entry.id?link.first:link.second;
    grid[p.y][p.x]="+";
    doors.push({...p,open:true});roomDoorCount[entry.id]++;
  }
  if(doors.length!==2)throw new Error("Entry needs two independent doors");
  for(const i of order){
    if(doors.length>=6)break;
    const link=connections[i];
    if(link.a===entry.id||link.b===entry.id)continue;
    const candidates=rand(2)===0
      ? [{room:link.a,point:link.first},{room:link.b,point:link.second}]
      : [{room:link.b,point:link.second},{room:link.a,point:link.first}];
    const available=candidates.find(v=>roomDoorCount[v.room]<2);
    if(!available)continue;
    const {x,y}=available.point;
    if(grid[y][x]!==".")continue;
    grid[y][x]="+";
    doors.push({x,y,open:true});roomDoorCount[available.room]++;
  }
  if(doors.length!==6)throw new Error("No balanced door placement");

  // Shape cutouts are actual blocking stones, never a hidden wall sprite.
  for(const room of rooms){
    room.obstacles=roomObstacles(room);
    for(const p of room.obstacles){
      if(grid[p.y]?.[p.x]!==".")
        throw new Error("Room obstacle overlaps passage");
      grid[p.y][p.x]="#";
    }
  }
  const start={x:entry.cx,y:entry.cy};
  const exit={x:extraction.cx,y:extraction.cy};
  const valuable=roomPoint(valuableRoom,rand,grid);
  const tonic=roomPoint(tonicRoom,rand,grid);
  const entryOptions=[];
  for(let y=entry.y;y<entry.y+entry.height;y++)
    for(let x=entry.x;x<entry.x+entry.width;x++)
      if(grid[y][x]==="."&&distance({x,y},start)>=2&&
        distance({x,y},start)<=3&&!doors.some(d=>d.x===x&&d.y===y))
        entryOptions.push({x,y});
  if(!entryOptions.length)throw new Error("No visible tutorial chest");
  const entryChest=entryOptions[rand(entryOptions.length)];
  grid[start.y][start.x]="S";grid[exit.y][exit.x]="E";
  for(const p of [valuable,tonic,entryChest])grid[p.y][p.x]="$";
  const loot={
    [key(valuable)]:"relic.ashen_fragment",
    [key(tonic)]:"consumable.dusk_tonic",
    [key(entryChest)]:"consumable.bandage"
  };
  const occupied=new Set([key(start),key(exit),...Object.keys(loot),...doors.map(key)]);
  const enemySpecs=[
    ["charognard",valuableRoom,valuable,2,3],
    ["guardian",guardianRoom,{x:guardianRoom.cx,y:guardianRoom.cy},4,5],
    ["rift_larva",tonicRoom,tonic,4,4]
  ];
  const enemies=[];
  for(const [kind,room,anchor,range,hp] of enemySpecs){
    const p=enemyInRoom(room,anchor,occupied,rand,range,grid);
    if(!p)throw new Error("No safe spawn for "+kind);
    occupied.add(key(p));
    enemies.push({id:"nhal-"+kind+"-01",kind,x:p.x,y:p.y,hp});
  }
  const scouts=[];
  for(let y=entry.y;y<entry.y+entry.height;y++)
    for(let x=entry.x;x<entry.x+entry.width;x++){
      const p={x,y},d=distance(p,start);
      if(x>entry.x&&x<entry.x+entry.width-1&&
          y>entry.y&&y<entry.y+entry.height-1&&
          grid[y][x]==="."&&!occupied.has(key(p))&&d>=4&&d<=5)
        scouts.push(p);
    }
  if(!scouts.length)throw new Error("No visible tutorial enemy");
  const scout=scouts[rand(scouts.length)];
  enemies.push({id:"nhal-charognard-scout-01",kind:"charognard",
    x:scout.x,y:scout.y,hp:3});
  occupied.add(key(scout));
  function publicRoutesSafe(){
    const map=grid.map(row=>row.join(""));
    const blocked=new Set(enemies.map(key));
    if(!deepTwoReturnWays(map,start,exit)||!deepRoute(map,start,exit,blocked))
      return false;
    return Object.keys(loot).every(pos=>{
      const [x,y]=pos.split(",").map(Number),p={x,y};
      return deepTwoReturnWays(map,p,exit)&&deepRoute(map,p,exit,blocked)&&
        deepRoute(map,start,p,blocked);
    });
  }
  function placeCrack(room,nearEntry){
    const candidates=[];
    for(let y=room.y+1;y<room.y+room.height-1;y++)
      for(let x=room.x+1;x<room.x+room.width-1;x++){
        const p={x,y},d=distance(p,start);
        if(grid[y][x]!=="."||occupied.has(key(p))||
            distance(p,exit)<4||
            Object.keys(loot).some(k=>{
              const [lx,ly]=k.split(",").map(Number);
              return distance(p,{x:lx,y:ly})<2;
            })||enemies.some(e=>distance(p,e)<2)||
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
  const deepCrack=placeCrack(valuableRoom,false)||
    placeCrack(bySlot.get(11),false)||placeCrack(guardianRoom,false);
  return {
    map:grid.map(row=>row.join("")),
    rooms,doors,doorPlanVersion:1,geometryVersion:ROOM_GEOMETRY_VERSION,
    topologyVersion:GRAPH_VERSION,links:connections.map(c=>({a:c.a,b:c.b})),
    networkKind:plan.networkKind,
    start,exit,loot,enemies,layoutId:"nhal-graph-"+index,
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
  // GAME-095A3: only newly generated descents opt into expanded loot IDs.
  // Old saved maps have no lootPlanVersion and retain their original validator.
  if(layout.lootPlanVersion!==undefined&&layout.lootPlanVersion!==1)return false;
  const legacyLoot=layout.lootPlanVersion===undefined;
  const legacy=layout.doorPlanVersion===undefined;
  const graph=layout.topologyVersion===GRAPH_VERSION;
  if(layout.topologyVersion!==undefined&&!graph)return false;
  if(layout.branchPlanVersion!==undefined&&
      (layout.branchPlanVersion!==1||!graph))return false;
  if(graph&&(legacy||layout.geometryVersion!==ROOM_GEOMETRY_VERSION))return false;
  if(!graph&&Array.isArray(rooms)&&
      rooms.some(r=>Object.hasOwn(r||{},"slot")))return false;
  if(layout.doorPlanVersion!==undefined&&layout.doorPlanVersion!==1)return false;
  if(layout.geometryVersion!==undefined&&
      layout.geometryVersion!==ROOM_GEOMETRY_VERSION)return false;
  if(!Array.isArray(rooms)||!Array.isArray(doors)||
      (graph?(rooms.length<8||rooms.length>12||doors.length!==6):
        (rooms.length!==12||(legacy?doors.length!==34:doors.length!==6))))return false;
  if(!start||!exit||tile(map,start)!=="S"||tile(map,exit)!=="E")return false;
  if(map.join("").split("S").length!==2||map.join("").split("E").length!==2)return false;
  if(!rooms.every((r,i)=>r?.id===i&&Number.isInteger(r.x)&&Number.isInteger(r.y)&&
      Number.isInteger(r.width)&&Number.isInteger(r.height)&&
      r.width>=(legacy?5:7)&&r.width<=(legacy?7:9)&&
      r.height>=(legacy?5:7)&&r.height<=(legacy?7:9)&&
      inRoom({x:r.cx,y:r.cy},r)))return false;
  if(graph){
    if(!Array.isArray(layout.links)||typeof layout.networkKind!=="string"||
        !Array.isArray(rooms)||rooms.some(r=>!Number.isInteger(r.slot)||
          r.slot<0||r.slot>11))return false;
    const slots=rooms.map(r=>r.slot);
    if(new Set(slots).size!==slots.length||
        CORE_SLOTS.some(slot=>!slots.includes(slot))||
        !slots.every((slot,i)=>i===0||slot>slots[i-1]))return false;
    const canonical=(a,b)=>Math.min(a,b)+","+Math.max(a,b);
    const actual=layout.links.map(l=>l&&Number.isInteger(l.a)&&
      Number.isInteger(l.b)&&rooms[l.a]&&rooms[l.b]&&l.a!==l.b?
      canonical(rooms[l.a].slot,rooms[l.b].slot):null);
    const expected=topologyEdges(slots).map(l=>canonical(l.a,l.b));
    if(actual.length!==expected.length||new Set(actual).size!==actual.length||
        actual.some(key=>!key||!expected.includes(key)))return false;
    const entry=rooms.find(r=>r.slot===8),extraction=rooms.find(r=>r.slot===3);
    if(!entry||!extraction||entry.role!=="vestibule"||
        extraction.role!=="extraction"||
        rooms.find(r=>r.slot===10)?.role!=="atelier_abandonne"||
        start.x!==entry.cx||start.y!==entry.cy||
        exit.x!==extraction.cx||exit.y!==extraction.cy)return false;
    if(layout.branchPlanVersion===1&&
        rooms.find(r=>r.slot===4)?.role!=="cache_scellee")return false;
    if(rooms.filter(r=>r.role==="chambre_echo").length!==1||
        rooms.filter(r=>r.role==="cache_scellee").length!==1)return false;
  }
  if(layout.geometryVersion===ROOM_GEOMETRY_VERSION){
    const validShapes=new Set(ROOM_SHAPES);
    for(const kind of ["l","pillar","collapsed","alcove"])
      if(rooms.filter(r=>r.shape===kind).length!==1)return false;
    for(const room of rooms){
      if(!validShapes.has(room.shape)||!Array.isArray(room.obstacles))return false;
      const expected=roomObstacles(room);
      if(JSON.stringify(expected)!==JSON.stringify(room.obstacles)||
          room.obstacles.some(p=>!inRoom(p,room)||tile(map,p)!=="#"))return false;
      for(const p of room.obstacles){
        // Check actual doorway approaches, never hypothetical doors
        // on the two deliberately solid outer sides of the L chamber.
        const mouths=[
          [p.x===room.x+1,{x:room.x,y:p.y}],
          [p.x===room.x+room.width-2,{x:room.x+room.width-1,y:p.y}],
          [p.y===room.y+1,{x:p.x,y:room.y}],
          [p.y===room.y+room.height-2,{x:p.x,y:room.y+room.height-1}]
        ];
        if(mouths.some(([adjacent,mouth])=>adjacent&&
            ["+","."].includes(tile(map,mouth))))return false;
      }
    }
  }
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
  const optionalIds=new Set([...EQUIPMENT_LOOT_POOL,...CONSUMABLE_LOOT_POOL]
    .map(entry=>entry.id));
  const acceptedLootIds=legacyLoot
    ?new Set(["relic.ashen_fragment","consumable.dusk_tonic","consumable.bandage"])
    :new Set(["relic.ashen_fragment","consumable.bandage",...optionalIds]);
  if(!Object.entries(loot).every(([pos,id])=>{
    const [x,y]=pos.split(",").map(Number);
    return /^\d+,\d+$/.test(pos)&&tile(map,{x,y})==="$"&&
      acceptedLootIds.has(id);
  }))return false;
  // A complete chest record always holds one of each reward role.
  // Live saves with already removed chest records remain backward compatible.
  if(!legacyLoot&&(!live||Object.keys(loot).length===3)){
    const ids=Object.values(loot);
    if(ids.filter(id=>id==="relic.ashen_fragment").length!==1||
       ids.filter(id=>id==="consumable.bandage").length!==1||
       ids.filter(id=>optionalIds.has(id)).length!==1)return false;
  }
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
    if(!(graph?rooms.some(r=>r.slot===8):rooms[8])||
        !map.some((row,y)=>[...row].some((ch,x)=>
      ch==="^"&&distance({x,y},start)>=2&&distance({x,y},start)<=4)))return false;
  }
  if(!deepTwoReturnWays(map,start,exit))return false;
  if(!validRoomSites(layout))return false;
  if(layout.traps!==undefined){
    if(!validTraps(layout))return false;
    const trapped=new Set(layout.traps.map(key));
    const withoutFoes=new Set([...trapped,...enemies.map(key)]);
    if(!deepTwoReturnWays(map,start,exit,trapped)||
       !deepRoute(map,start,exit,withoutFoes))return false;
    for(const pos of Object.keys(loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      if(!deepTwoReturnWays(map,p,exit,trapped)||
         !deepRoute(map,p,exit,withoutFoes)||
         !deepRoute(map,start,p,withoutFoes))return false;
    }
  }
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
    let layout;
    try{
      layout=makePlan(index+attempt*100003);
    }catch(error){
      // A rare incompatible alignment is rejected rather than published.
      // The attempt budget is deterministic and bounded for Android CPUs.
      if(error instanceof Error&&!/Invalid deep|Maximum call stack/.test(error.message))
        continue;
      throw error;
    }
    if(validateDeepLayout(layout)){
      layout.layoutId="nhal-deep-"+index+"-"+attempt;
      layout.secrets=placeOptionalSecret(layout,index,deepRoute);
      // The two optional traps are generated only AFTER architecture, rifts,
      // enemies, loot and secrets have passed their independent safety checks.
      try{
        layout.traps=placeOptionalTraps(layout,index,deepRoute,deepTwoReturnWays);
      }catch(error){
        if(error?.message!=="No safe DEV-086 corridor and chest trap pair")throw error;
        continue; // Reject unsafe seeds; never force a mandatory trap.
      }
      if(!validateDeepLayout(layout))continue;
      // GAME-101B is opt-in per newly generated layout: old saved room
      // placements and the existing 3-site schema are left intact.
      layout.branchPlanVersion=1;
      // DEV-087 arrives after loot, enemies, doors, hazards, secrets and traps.
      // An unsafe or unreachable site rejects this seed without touching saves.
      try{
        layout.sites=placeRoomSites(layout,index,deepRoute);
      }catch(error){
        if(error?.message!=="No safe DEV-087 room site")throw error;
        continue;
      }
      if(!validateDeepLayout(layout))continue;
      // Reward is selected independently of dungeon geometry and combat RNG.
      // Preserve the entry bandage and valuable Fragment. Only the third,
      // previously tonic-only chest changes. Reward IDs are stored once.
      const preview=planDeepChestLoot(index);
      const optionalChest=Object.keys(layout.loot).find(pos=>
        layout.loot[pos]==="consumable.dusk_tonic");
      if(!optionalChest)continue;
      layout.loot[optionalChest]=preview.optional;
      layout.lootPlanVersion=1;
      if(!validateDeepLayout(layout))continue;
      return layout;
    }
  }
  throw new Error("No fair deep Nhal layout found");
}
