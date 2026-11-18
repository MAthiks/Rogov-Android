// DEV-088 — An informational, fog-safe field report, not an auto-navigator.
// A path is reported ONLY if a route through already seen cells can be traced.
// No information on unknown enemies, traps, unvisited rewards or the exit leaks.
import {hasFog,visibleCells,visionKey} from "./exploration-visibility.js";

const key=(x,y)=>x+","+y;
const neighbors=({x,y})=>[{x:x+1,y},{x:x-1,y},{x,y:y+1},{x,y:y-1}];
const amount=bag=>Object.values(bag||{}).reduce((sum,n)=>
  sum+(Number.isSafeInteger(n)&&n>0?n:0),0);

/** Only geometry the player has actually observed is eligible. An unrevealed
 * trap has no identity in the report (though unknown risks still exist).
 */
function knownRoute(run,known){
  const exit=run.exit;
  if(!exit||!known.has(visionKey(run,exit.x,exit.y)))return null;
  const from={x:run.x,y:run.y},start=key(from.x,from.y);
  const target=key(exit.x,exit.y);
  const queue=[from],parents=new Map([[start,null]]);
  const points=new Map([[start,from]]);
  const danger=new Set((run.traps||[])
    .filter(t=>t.status==="revealed"&&
      known.has(visionKey(run,t.x,t.y)))
    .map(t=>key(t.x,t.y)));
  let found=false;
  for(let i=0;i<queue.length;i++){
    const p=queue[i],k=key(p.x,p.y);
    if(k===target){found=true;break;}
    for(const q of neighbors(p)){
      const tile=run.map[q.y]?.[q.x],qk=key(q.x,q.y);
      if(!tile||tile==="#"||tile==="^"||danger.has(qk)||
        parents.has(qk)||!known.has(visionKey(run,q.x,q.y)))continue;
      // Closed doors are traversable after one deliberate opening action.
      parents.set(qk,k);
      points.set(qk,q);
      queue.push(q);
    }
  }
  if(!found)return null;
  let steps=0,closedDoors=0,cursor=target;
  while(cursor!==start){
    const p=points.get(cursor);
    if(run.map[p.y][p.x]==="+"&&
      run.doors?.some(d=>d.x===p.x&&d.y===p.y&&!d.open))closedDoors++;
    steps++;
    cursor=parents.get(cursor);
  }
  return {steps,closedDoors};
}

/** Pure, read-only summary for both Android and ASCII.
 * Does not advance time, mutate saves, expose new tiles or evaluate actual
 * future enemy movement. Unknown topological routes stay "unknown".
 */
export function expeditionReport(state){
  const run=state?.run;
  if(!run?.map||!hasFog(run)||!Array.isArray(run.exploration?.seen))
    return {available:false};
  const known=new Set([...run.exploration.seen,...visibleCells(run)]);
  const discovered=(x,y)=>known.has(visionKey(run,x,y));
  const exitKnown=Boolean(run.exit&&discovered(run.exit.x,run.exit.y));
  const path=knownRoute(run,known);
  const carried=amount(run.carried),secured=amount(state.meta?.stash);
  const fragments=run.carried?.["relic.ashen_fragment"]||0;
  const valuableWeapon=run.carried?.["weapon.ashen_blade"]||0;
  const knownChests=Object.keys(run.loot||{})
    .filter(pos=>!run.collected?.includes(pos))
    .filter(pos=>{
      const [x,y]=pos.split(",").map(Number);
      return discovered(x,y);
    }).length;
  const knownSites=(run.sites||[])
    .filter(site=>site.status==="untouched"&&discovered(site.x,site.y))
    .length;
  const enemies=(run.enemies||[])
    .filter(enemy=>enemy.hp>0&&discovered(enemy.x,enemy.y)&&
      visibleCells(run).has(visionKey(run,enemy.x,enemy.y))).length;
  let advice;
  if(run.hp<=4)advice="Blessures importantes : un retour prudent mérite d'être envisagé.";
  else if(enemies>0)advice="Menaces actuellement visibles : chaque détour ou fouille consomme du temps.";
  else if(!exitKnown)advice="L'Arche n'a pas encore été repérée. Explore et mémorise les chemins.";
  else if(!path)advice="Aucune route de retour entièrement connue n'est tracée pour le moment.";
  else if(fragments>0||valuableWeapon>0)
    advice="Du matériel précieux est exposé : l'Arche permet de le sécuriser.";
  else if(knownChests+knownSites>0)
    advice="Des découvertes connues restent facultatives : choisis le détour ou l'extraction.";
  else advice="Tu connais un trajet vers l'Arche. Continuer demeure un choix, jamais une obligation.";
  return {
    available:true,carried,secured,fragments,
    valuableWeapon,knownChests,knownSites,enemies,
    hp:run.hp,endurance:run.endurance??null,exitKnown,
    knownRoute:path,advice
  };
}
