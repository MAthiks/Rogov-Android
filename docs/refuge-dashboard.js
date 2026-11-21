// UI-102 — pure refuge display model. Never stored, no RNG or game actions.
export const REFUGE_BAG_CAPACITY=8;
const positiveCount=items=>Object.values(items||{}).reduce((sum,count)=>
  sum+(Number.isSafeInteger(count)&&count>0?count:0),0);
export function refugeDashboard(stash={},carried={},options={}){
  const {bestDepth=0,maxDepth=3,fragmentId="relic.ashen_fragment"}=options;
  const securedUnits=positiveCount(stash),packedUnits=positiveCount(carried);
  const fragments=Number.isSafeInteger(stash?.[fragmentId])&&stash[fragmentId]>0?
    stash[fragmentId]:0;
  const record=Number.isSafeInteger(bestDepth)&&bestDepth>0?bestDepth:0;
  const max=Number.isSafeInteger(maxDepth)&&maxDepth>0?maxDepth:3;
  return Object.freeze({
    securedUnits,packedUnits,fragments,
    canDepart:packedUnits<=REFUGE_BAG_CAPACITY,
    depthLabel:(record||"—")+" / "+max
  });
}
