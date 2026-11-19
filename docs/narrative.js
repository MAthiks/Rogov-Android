import {echoDossier} from "./echo-investigation.js";
// NAR-093 — Read-only, spoiler-safe objective cues derived from existing saves.
// No quest state, RNG, hidden room coordinates or reward is created here.
// A story mystery is a promise for future design, NOT an implemented quest.
export const NAR093_LORE=Object.freeze({
  veyr:"Veyr est le refuge : le coffre et les objets qui y restent sont à l'abri.",
  nhal:"Nhal est un réseau de ruines mouvantes. On y cherche des Fragments de cendre et des traces anciennes.",
  fragment:"Le Fragment de cendre sert à forger une arme (2 Fragments) ou deux bandages (1 Fragment) après extraction.",
  arche:"Une Arche d'extraction te ramène à Veyr et protège tout le contenu de ton sac.",
  rappel:"Le Rappel te ramène à Veyr après la mort. Le sac transporté est perdu ; le coffre reste intact.",
  echo:"La Chambre de l'Écho contient des inscriptions sur une cité enfouie. Comprendre le Rappel reste un mystère."
});

const count=(collection,id)=>{
  const n=collection?.[id]??0;
  return Number.isSafeInteger(n)&&n>0?n:0;
};
const fragmentLabel=n=>n+" Fragment"+(n>1?"s":"")+" de cendre";

/** Returns only what the player knows from public state and established rules.
 * It never reads unrevealed map cells, secret coordinates or enemy placements.
 */
export function narrativeObjective(state){
  const meta=state?.meta??{},run=state?.run??null;
  const secured=count(meta.stash,"relic.ashen_fragment");
  const carried=count(run?.carried,"relic.ashen_fragment");
  const hasExtracted=(meta.extractions??0)>0;
  const echoes=echoDossier(state).count;

  if(run){
    if(carried>0)return {
      phase:"retour",
      tag:"MISSION · REJOINDRE L'ARCHE",
      title:"Ramener la preuve à Veyr",
      text:"Tu transportes "+fragmentLabel(carried)+". Trouve une Arche d'extraction pour sécuriser ce butin. Le Rappel te ferait perdre tout ton sac."
    };
    if(!hasExtracted)return {
      phase:"premiere-descente",
      tag:"MISSION · 1 FRAGMENT",
      title:"Première preuve",
      text:"Trouve au moins 1 Fragment de cendre puis rejoins une Arche d'extraction. Tu peux contourner les dangers : aucun combat n'est obligatoire."
    };
    return {
      phase:"enquete",
      tag:echoes?"MISSION · "+echoes+"/3 ÉCHOS":"MISSION · EXPLORER NHAL",
      title:"Suivre les traces de Nhal",
      text:"Explore les salles à la recherche de fragments et, si tu la découvres, d'une Chambre de l'Écho. Rapporte ton butin par une Arche ; les mystères restent à élucider."+
        (echoes?" Indices du Rappel conservés : "+echoes+"/3.":"")
    };
  }

  if(!hasExtracted)return {
    phase:"depart",
    tag:"MISSION · PREMIÈRE PREUVE",
    title:"Première mission : une preuve pour Veyr",
    text:"Descends dans Nhal, récupère au moins 1 Fragment de cendre, puis franchis une Arche d'extraction. Seul le butin ramené vivant rejoint le coffre."
  };
  if(secured>0)return {
    phase:"securise",
    tag:"MISSION · PRÉPARER LA SUITE",
    title:"Butin sécurisé : préparer la prochaine descente",
    text:fragmentLabel(secured)+" au coffre. À la forge : 1 Fragment donne 2 bandages ; 2 Fragments donnent une Lame cendrée. Retourne explorer Nhal pour recueillir d'autres preuves."
  };
  return {
    phase:"suite",
    tag:"MISSION · RETOURNER DANS NHAL",
    title:"Poursuivre l'enquête",
    text:"L'extraction est possible, mais ton coffre ne contient plus de Fragment de cendre. Descends chercher de nouvelles ressources et les traces des Chambres de l'Écho."
  };
}
