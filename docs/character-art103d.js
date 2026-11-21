// ART-103D — pure character-sheet presentation from REAL game state.
// Never writes to the save, adds a mental-health field or invents equipment.
import {MAX_HP} from "./game.js";

const xpPerLevel=5; // game.js gainXp and save validation use 1 + floor(xp/5).
export const CHARACTER103D_METRICS=Object.freeze([
  Object.freeze({key:"enduranceMax",label:"END MAX",unit:""}),
  Object.freeze({key:"criticalChance",label:"CRITIQUE",unit:"%"}),
  Object.freeze({key:"dodgeChance",label:"ESQUIVE",unit:"%"}),
  Object.freeze({key:"parryChance",label:"PARADE",unit:"%"}),
  Object.freeze({key:"blockChance",label:"BLOCAGE",unit:"%"}),
  Object.freeze({key:"armor",label:"ARMURE",unit:""})
]);

export function characterPresentation(state,stats){
  const hero=state?.meta?.hero;
  if(!hero||!stats)return null;
  const xp=hero.xp;
  const level=hero.level;
  const run=state.run;
  const metrics=CHARACTER103D_METRICS.map(({key,label,unit})=>Object.freeze({
    key,label,value:String(stats[key])+unit
  }));
  return Object.freeze({
    name:hero.title||"L'Égaré",
    level,
    xp,
    xpProgress:xp%xpPerLevel,
    xpGoal:xpPerLevel,
    xpCaption:(xp%xpPerLevel)+" / "+xpPerLevel+" XP vers niveau "+(level+1),
    location:run?"Nhal · expédition":"Veyr · refuge",
    health:run?run.hp+" / "+MAX_HP+" PV":"Hors expédition",
    endurance:run&&Number.isSafeInteger(run.endurance)
      ?run.endurance+" / "+(run.enduranceMax??stats.enduranceMax)+" END"
      :"Hors expédition",
    metrics:Object.freeze(metrics)
  });
}
