// ECO-078 — deterministic refuge crafting; no RNG, no combat turn.
// Fragments are secured only through extraction, never spent from the carried bag.
export const RESOURCE_ID="relic.ashen_fragment";
export const RECIPES=Object.freeze({
  "forge.ashen_blade":Object.freeze({
    title:"Forger une Lame cendrée",
    description:"Une arme plus précise, aux critiques et parades renforcés. Perdue si emportée puis perdue au Rappel.",
    costs:Object.freeze({"relic.ashen_fragment":2}),
    yields:Object.freeze({"weapon.ashen_blade":1})
  }),
  "supply.bandages":Object.freeze({
    title:"Préparer 2 bandages",
    description:"Du matériel de soin à emporter. Une alternative immédiate à l'investissement dans une arme.",
    costs:Object.freeze({"relic.ashen_fragment":1}),
    yields:Object.freeze({"consumable.bandage":2})
  })
});
export function canCraft(stash,recipeId){
  const recipe=Object.hasOwn(RECIPES,recipeId)?RECIPES[recipeId]:null;
  if(!recipe || !stash || typeof stash!=="object")return false;
  return Object.entries(recipe.costs).every(([id,count])=>
    Number.isSafeInteger(stash[id]??0) && (stash[id]??0)>=count);
}
export function craftingPreview(stash){
  return Object.entries(RECIPES).map(([id,recipe])=>({
    id,title:recipe.title,description:recipe.description,
    costFragments:recipe.costs[RESOURCE_ID]??0,
    available:canCraft(stash,id)
  }));
}
