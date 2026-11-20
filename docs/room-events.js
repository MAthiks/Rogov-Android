// DEV-087 — Optional, deterministic and persistent interactive room sites.
// No DOM, no combat RNG, no spoilers through unexplored or remembered fog.
import {visibleCells,visionKey} from "./exploration-visibility.js";

export const ROOM_SITES=Object.freeze({
  atelier:Object.freeze({
    name:"Atelier abandonné",symbol:"a",sprite:"site_atelier",
    description:"Un établi fendu conserve quelques outils. Il reste assez de matière pour une seule récupération.",
    options:Object.freeze({
      fragment:Object.freeze({label:"Récupérer un Fragment de cendre · 1 tour",
        item:"relic.ashen_fragment",xp:1,endurance:0,
        text:"ATELIER — Un fragment intact survit sous la poussière."}),
      bandage:Object.freeze({label:"Confectionner un bandage · 1 tour",
        item:"consumable.bandage",xp:1,endurance:0,
        text:"ATELIER — Tu rassembles un nécessaire de soin rudimentaire."}),
      // GAME-101C: opt-in on newly generated deep descents only.
      cartographie:Object.freeze({label:"Relever un plan de repli · 1 tour, 2 END",
        item:null,xp:1,endurance:2,
        text:"ATELIER — Un vieux croquis indique un chemin vers l’Arche. Il n’indique ni ennemis, ni pièges, ni butin."})
    })
  }),
  echo:Object.freeze({
    name:"Chambre de l'Écho",symbol:"e",sprite:"site_echo",
    description:"Des voix sans source glissent sur la pierre. Les signes semblent changer lorsque tu détournes le regard.",
    options:Object.freeze({
      inscription:Object.freeze({label:"Relever l'inscription · 1 tour, +1 XP",
        item:null,xp:1,endurance:0,
        text:"CHAMBRE DE L'ÉCHO — Les signes parlent d'une ville enfouie sous Nhal. Tu en retiens quelques fragments."}),
      resonance:Object.freeze({label:"Écouter la résonance · 1 tour, 2 END, +2 XP",
        item:null,xp:2,endurance:2,
        text:"CHAMBRE DE L'ÉCHO — L'écho répond avant que tu ne parles. La sensation te laisse épuisé, mais plus lucide."})
    })
  }),
  camp:Object.freeze({
    name:"Camp de fortune",symbol:"b",sprite:"site_camp",
    description:"Des couvertures et une boîte de secours abandonnées. Tu peux soigner tes plaies ou récupérer une ressource, mais pas les deux.",
    options:Object.freeze({
      treat:Object.freeze({label:"Panser les blessures +3 PV · 1 tour, 2 END",
        item:null,heal:3,requiresDamage:true,xp:1,endurance:2,
        text:"CAMP DE FORTUNE — Tes blessures sont pansées sous les décombres."}),
      gather:Object.freeze({label:"Récupérer un bandage · 1 tour",
        item:"consumable.bandage",xp:1,endurance:0,
        text:"CAMP DE FORTUNE — Un bandage préservé rejoint le sac."})
    })
  }),
  signal:Object.freeze({
    name:"Balise de garde",symbol:"g",sprite:"site_signal",
    description:"Une cloche d’alerte rouillée est fixée à la pierre. La démonter discrètement ou forcer son boîtier : celui-ci risque d'attirer les Charognards.",
    options:Object.freeze({
      quiet:Object.freeze({label:"Démonter discrètement · 1 tour, 1 END",
        item:"consumable.vigor_salts",xp:1,endurance:1,
        text:"BALISE — Tu récupères des sels de vigueur sans faire sonner le mécanisme."}),
      alarm:Object.freeze({label:"Forcer le boîtier · 1 tour, 3 END · alerte 5 tours",
        item:"relic.ashen_fragment",xp:2,endurance:3,alarmTurns:5,
        text:"BALISE — Un Fragment de cendre tombe et l'alarme résonne. Les Charognards repèrent plus loin pendant cinq tours."})
    })
  }),
  cache:Object.freeze({
    name:"Cache oubliée",symbol:"k",sprite:"site_cache",
    description:"Une niche murée à la hâte conserve plusieurs ressources. Tu ne peux en extraire qu'une avant que la pierre ne s'effrite.",
    options:Object.freeze({
      tonic:Object.freeze({label:"Emporter le tonique · 1 tour",
        item:"consumable.dusk_tonic",xp:1,endurance:0,
        text:"CACHE OUBLIÉE — Un tonique scellé rejoint ton sac."}),
      fragment:Object.freeze({label:"Prélever le fragment · 1 tour",
        item:"relic.ashen_fragment",xp:1,endurance:0,
        text:"CACHE OUBLIÉE — Un éclat de cendre préservé est retiré de la niche."}),
      // Only new GAME-101B branches can recover this rarer piece of equipment.
      buckler:Object.freeze({label:"Forcer le sceau · 1 tour, 3 END · équipement rare",
        item:"shield.worn_buckler",xp:2,endurance:3,
        text:"CACHE GARDÉE — Tu brises le scellement et saisis une rondache usée."})
    })
  })
});
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cell=(map,p)=>map[p.y]?.[p.x]??"#";
/** Fixed entry/exit, but special chambers migrate between descents.
 * These candidate rooms do not contain the entrance, extraction or workshop.
 */
export function specialRoomPlan(index){
  if(!Number.isSafeInteger(index)||index<2)throw new RangeError("Invalid special room seed");
  return {echoRoomId:[0,1,2,4,7][index%5],
    cacheRoomId:[6,9,11][Math.floor(index/5)%3]};
}
const definition=(rooms,graph=false)=>[
  {kind:"atelier",roomId:graph?rooms.find(r=>r.role==="atelier_abandonne")?.id:10},
  {kind:"echo",roomId:rooms.find(r=>r.role==="chambre_echo")?.id},
  {kind:"cache",roomId:rooms.find(r=>r.role==="cache_scellee")?.id}
];
const inRoom=(p,r)=>p.x>r.x&&p.x<r.x+r.width-1&&
  p.y>r.y&&p.y<r.y+r.height-1;

export function placeRoomSites(layout,index,route){
  if(!layout?.map||!Array.isArray(layout.rooms)||!Array.isArray(layout.enemies)||
      !Number.isSafeInteger(index)||index<2)throw new TypeError("Invalid room site layout");
  const occupied=new Set([key(layout.start),key(layout.exit),
    ...Object.keys(layout.loot),...layout.enemies.map(key),
    ...layout.doors.map(key),...(layout.traps||[]).flatMap(t=>[key(t),key(t.clue)]),
    ...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)])]);
  const blocked=new Set([...(layout.traps||[]),...layout.enemies].map(key));
  const sites=[];
  for(const {kind,roomId} of definition(layout.rooms,layout.topologyVersion===1)){
    const room=layout.rooms[roomId],candidates=[];
    if(!room)throw new Error("Missing special room");
    for(let y=room.y+1;y<room.y+room.height-1;y++)
      for(let x=room.x+1;x<room.x+room.width-1;x++){
        const p={x,y};
        if(cell(layout.map,p)!=="."||occupied.has(key(p))||
            (layout.traps||[]).some(t=>distance(t,p)<2)||
            layout.enemies.some(e=>distance(e,p)<2)||
            !route(layout.map,layout.start,p,blocked))continue;
        const center=distance(p,{x:room.cx,y:room.cy});
        const variety=(x*31+y*17+index*13+roomId*7)%9;
        candidates.push({p,score:center*4+variety});
      }
    candidates.sort((a,b)=>a.score-b.score||key(a.p).localeCompare(key(b.p)));
    if(!candidates.length)throw new Error("No safe DEV-087 room site");
    const p=candidates[0].p;
    sites.push({id:"nhal-site-"+kind+"-01",kind,roomId,
      x:p.x,y:p.y,status:"untouched",choice:null});
    occupied.add(key(p));
  }
  return sites;
}

/** Live enemies may later occupy a site: do not reject such saved runs.
 * Legacy saves legitimately have no sites and are not modified on reload.
 */
export function validRoomSites(run){
  if(run?.sites===undefined)return true;
  if(!Array.isArray(run.sites)||run.sites.length!==3||
      !Array.isArray(run.rooms)||
      (run.topologyVersion===1?
        (run.rooms.length<8||run.rooms.length>12):run.rooms.length!==12)||
      !Array.isArray(run.map))return false;
  const seen=new Set();
  return definition(run.rooms,run.topologyVersion===1).every((expected,i)=>{
    const s=run.sites[i],room=run.rooms[expected.roomId];
    if(!s||s.id!=="nhal-site-"+expected.kind+"-01"||
        s.kind!==expected.kind||s.roomId!==expected.roomId||
        !Number.isInteger(s.x)||!Number.isInteger(s.y)||
        (!room||!inRoom(s,room))||cell(run.map,s)!=="."||seen.has(key(s))||
        !["untouched","resolved"].includes(s.status)||
        (s.status==="untouched"?s.choice!==null:
          !Object.hasOwn(ROOM_SITES[s.kind].options,s.choice))||
        (s.choice==="buckler"&&run.branchPlanVersion!==1)||
        (s.choice==="cartographie"&&run.scoutingPlanVersion!==1)||
        Object.keys(run.loot||{}).includes(key(s))||
        run.doors?.some(d=>key(d)===key(s))||
        run.traps?.some(t=>key(t)===key(s)||key(t.clue)===key(s))||
        run.secrets?.some(t=>key(t)===key(s)||key(t.clue)===key(s)))return false;
    seen.add(key(s));
    return true;
  });
}
export const roomSiteAt=(run,x,y)=>[...(run?.sites||[]),...(run?.encounters||[])]
  .find(s=>s.x===x&&s.y===y)||null;
export function roomSiteVisible(run,site){
  return Boolean(run?.exploration&&site&&
    visibleCells(run).has(visionKey(run,site.x,site.y)));
}
export function nearbyRoomSite(run){
  if(!run?.sites&&!run?.encounters)return null;
  return [...(run.sites||[]),...(run.encounters||[])]
    .find(s=>s.status==="untouched"&&
      distance(run,s)<=1&&roomSiteVisible(run,s))||null;
}
export function roomSiteAppearance(run,x,y){
  const s=roomSiteAt(run,x,y);
  if(!s||!roomSiteVisible(run,s))return null;
  const def=ROOM_SITES[s.kind];
  return s.status==="resolved"
    ?{name:def.name+" (exploré)",symbol:"v",sprite:"site_resolved",
      description:"Ce lieu a livré son unique découverte. Aucune ressource supplémentaire n'y reste."}
    :{name:def.name,symbol:def.symbol,sprite:def.sprite,description:def.description};
}
