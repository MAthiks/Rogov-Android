// ROGOV DEV-073A — shared hero/NPC stats and equipment model (pure, offline).
// Derived numbers are PREVIEWS: combat dice, crits and stat-driven defense are DEV-073B.
export const STAT_KEYS=Object.freeze(["strength","agility","constitution","perception","willpower","intellect"]);
export const STAT_LABELS=Object.freeze({
  strength:"FOR",agility:"AGI",constitution:"CON",perception:"PER",
  willpower:"VOL",intellect:"INT"
});
export const ARCHETYPES=Object.freeze({
  mercenary:"Mercenaire",scout:"Éclaireur",medic:"Médecin",scavenger:"Récupérateur",
  hunter:"Chasseur",artisan:"Artisan",scholar:"Érudit",rogue:"Filou",
  cultist:"Cultiste",paladin:"Paladin",leper:"Lépreux"
});
export const GEAR_SLOTS=Object.freeze(["mainHand","offHand","body","relic"]);
export const EMPTY_LOADOUT=Object.freeze({mainHand:null,offHand:null,body:null,relic:null});
export const DEFAULT_HERO_STATS=Object.freeze({
  strength:5,agility:5,constitution:5,perception:5,willpower:5,intellect:5
});
export const ENEMY_STATS=Object.freeze({
  charognard:Object.freeze({strength:4,agility:8,constitution:4,perception:7,willpower:3,intellect:2}),
  guardian:Object.freeze({strength:8,agility:3,constitution:9,perception:4,willpower:7,intellect:3}),
  rift_larva:Object.freeze({strength:3,agility:6,constitution:5,perception:7,willpower:8,intellect:8})
});
/** Equipment rules are shared between actors. Enemy-only and prototype items do
 * not enter the player's stash until a separate loot/equipment feature adds them.
 */
export const EQUIPMENT_CATALOG=Object.freeze({
  "weapon.rusty_sword":Object.freeze({
    name:"Épée usée",slot:"mainHand",kind:"weapon",quality:0,
    bonuses:Object.freeze({attack:1,accuracy:1,parry:4,critical:1})
  }),
  "natural.charognard_claws":Object.freeze({
    name:"Serres caveuses",slot:"mainHand",kind:"natural",quality:0,
    bonuses:Object.freeze({attack:1,accuracy:1,critical:2})
  }),
  "weapon.guardian_ritual_blade":Object.freeze({
    name:"Lame rituelle",slot:"mainHand",kind:"weapon",quality:0,
    bonuses:Object.freeze({attack:2,parry:5})
  }),
  "armor.guardian_stone":Object.freeze({
    name:"Carapace de pierre",slot:"body",kind:"armor",quality:0,
    bonuses:Object.freeze({armor:3,mobilityPenalty:2})
  }),
  "natural.rift_membrane":Object.freeze({
    name:"Membrane de Faille",slot:"body",kind:"natural",quality:0,
    bonuses:Object.freeze({arcaneResist:3})
  }),
  // Model-only equipment, deliberately not obtainable in the current run.
  "shield.prototype_ward":Object.freeze({
    name:"Bouclier d'essai (non disponible)",slot:"offHand",kind:"shield",quality:0,
    bonuses:Object.freeze({block:9,absorption:2,mobilityPenalty:1})
  }),
  "armor.prototype_leather":Object.freeze({
    name:"Armure légère d'essai (non disponible)",slot:"body",kind:"armor",quality:0,
    bonuses:Object.freeze({armor:1,mobilityPenalty:0})
  })
});
export const ENEMY_LOADOUTS=Object.freeze({
  charognard:Object.freeze({mainHand:"natural.charognard_claws",offHand:null,body:null,relic:null}),
  guardian:Object.freeze({mainHand:"weapon.guardian_ritual_blade",offHand:null,body:"armor.guardian_stone",relic:null}),
  rift_larva:Object.freeze({mainHand:null,offHand:null,body:"natural.rift_membrane",relic:null})
});
export const clamp=(number,min,max)=>Math.min(max,Math.max(min,number));

export function validAttributes(attrs){
  return attrs!==null && typeof attrs==="object" && !Array.isArray(attrs) &&
    STAT_KEYS.every(key=>Number.isSafeInteger(attrs[key]) && attrs[key]>=1 && attrs[key]<=20) &&
    Object.keys(attrs).every(key=>STAT_KEYS.includes(key));
}
export function validClassId(id){return id===null || Object.hasOwn(ARCHETYPES,id);}
export function validLoadout(loadout,carried=null){
  if(!loadout || typeof loadout!=="object" || Array.isArray(loadout))return false;
  if(Object.keys(loadout).some(slot=>!GEAR_SLOTS.includes(slot)))return false;
  for(const slot of GEAR_SLOTS){
    const id=loadout[slot];
    if(id===undefined || id===null)continue;
    const item=EQUIPMENT_CATALOG[id];
    if(!item || item.slot!==slot)return false;
    if(carried!==null && (!Object.hasOwn(carried,id)||carried[id]<1))return false;
  }
  return true;
}
/** The old bag remains the source of truth for owned items. No item is copied. */
export function playerLoadout(carried={}){
  return {
    ...EMPTY_LOADOUT,
    mainHand:(carried["weapon.rusty_sword"]||0)>0?"weapon.rusty_sword":null
  };
}
export function migrateHero(hero){
  return {
    ...hero,
    attributes: hero.attributes===undefined?{...DEFAULT_HERO_STATS}:hero.attributes,
    classId:hero.classId===undefined?null:hero.classId
  };
}
export function migrateEnemy(enemy){
  return {
    ...enemy,
    attributes:enemy.attributes===undefined?{...ENEMY_STATS[enemy.kind]}:enemy.attributes,
    loadout:enemy.loadout===undefined?{...ENEMY_LOADOUTS[enemy.kind]}:enemy.loadout
  };
}
export function migrateRunStats(run){
  if(!run)return run;
  const carried=run.carried||{};
  return {
    ...run,
    loadout:run.loadout===undefined?playerLoadout(carried):run.loadout,
    enemies:Array.isArray(run.enemies)?run.enemies.map(migrateEnemy):[]
  };
}
function gearBonuses(loadout){
  const result={attack:0,accuracy:0,parry:0,critical:0,block:0,armor:0,
    absorption:0,mobilityPenalty:0,arcaneResist:0};
  for(const slot of GEAR_SLOTS){
    const item=EQUIPMENT_CATALOG[loadout?.[slot]];
    if(!item)continue;
    for(const [key,value] of Object.entries(item.bonuses)){
      if(Object.hasOwn(result,key))result[key]+=value;
    }
  }
  return result;
}
/**
 * Pure shared actor calculation. Stats are model-only in DEV-073A;
 * existing v0.7a attack/defend damage and HP are intentionally untouched.
 */
export function deriveStats(attributes,loadout=EMPTY_LOADOUT){
  if(!validAttributes(attributes)||!validLoadout(loadout))return null;
  const a=attributes;
  const gear=gearBonuses(loadout);
  const mobilityPenalty=gear.mobilityPenalty;
  const mainItem=EQUIPMENT_CATALOG[loadout.mainHand];
  const canParry=Boolean(mainItem && ["weapon","natural"].includes(mainItem.kind));
  const hasShield=EQUIPMENT_CATALOG[loadout.offHand]?.kind==="shield";
  return {
    attributes:{...a},
    attackPower:a.strength+gear.attack,
    accuracy:50+(a.perception-5)*3+gear.accuracy,
    criticalChance:clamp(5+(a.perception-5)+(a.agility-5)+gear.critical,1,30),
    dodgeChance:clamp(10+(a.agility-5)*3-mobilityPenalty*3,1,45),
    parryChance:canParry?clamp(12+(a.strength-5)+(a.agility-5)+gear.parry,1,50):0,
    blockChance:clamp((hasShield?18:5)+(a.constitution-5)*2+gear.block,1,60),
    blockAbsorb:1+gear.absorption,
    armor:gear.armor,
    arcaneResistance:clamp(a.willpower-5+gear.arcaneResist,0,30),
    mobilityPenalty,
    enduranceMax:8+a.constitution+Math.floor(a.agility/2),
    equipmentBonus:{...gear}
  };
}
export function heroDerivedStats(state){
  const hero=state?.meta?.hero;
  if(!hero)return null;
  const attributes=hero.attributes??DEFAULT_HERO_STATS;
  const carried=state.run?.carried||{};
  const equipped=state.run?.loadout ?? playerLoadout(carried);
  if(!validLoadout(equipped,carried))return null;
  return deriveStats(attributes,equipped);
}
export function enemyDerivedStats(enemy){
  if(!enemy || !Object.hasOwn(ENEMY_STATS,enemy.kind))return null;
  return deriveStats(enemy.attributes??ENEMY_STATS[enemy.kind],enemy.loadout??ENEMY_LOADOUTS[enemy.kind]);
}
