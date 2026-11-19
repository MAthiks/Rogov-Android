// NAR-094 — Three finite, authored clues recovered from actual Echo room choices.
// These are observations, never proof of the origin of the Rappel or a finished story.
// Knowledge is permanently retained; the expedition bag follows existing loss rules.
export const ECHO_FINDINGS=Object.freeze([
  Object.freeze({
    id:"buried_city",title:"I — La cité enfouie",
    text:"Une inscription évoque une ville enfouie sous Nhal. Aucun plan n'en indique l'accès."
  }),
  Object.freeze({
    id:"early_voice",title:"II — La voix en avance",
    text:"Une autre Chambre de l'Écho répond avant que les paroles soient prononcées. Le phénomène reste inexpliqué."
  }),
  Object.freeze({
    id:"return_mark",title:"III — La marque du retour",
    text:"Un signe répété accompagne le mot « retour ». Il rappelle le Rappel, sans prouver leur lien."
  })
]);

// Optional field deliberately leaves every pre-NAR094 save valid without rewriting it.
// Only a prefix of the canonical authored list can be saved, no duplicates or spoofed IDs.
export function validEchoFindings(findings){
  if(findings===undefined)return true;
  if(!Array.isArray(findings)||findings.length>ECHO_FINDINGS.length)return false;
  return findings.every((id,i)=>id===ECHO_FINDINGS[i].id);
}

// Called ONLY after a real, validated Echo site interaction has consumed a turn.
// Mutates only the newly cloned game meta, never the caller's input.
export function discoverEcho(meta){
  const ids=meta.echoFindings??[];
  if(!validEchoFindings(ids)||ids.length===ECHO_FINDINGS.length)return null;
  const next=ECHO_FINDINGS[ids.length];
  meta.echoFindings=[...ids,next.id];
  return next;
}

export function echoDossier(state){
  const ids=state?.meta?.echoFindings??[];
  const count=validEchoFindings(ids)?ids.length:0;
  const findings=ECHO_FINDINGS.slice(0,count);
  const complete=count===ECHO_FINDINGS.length;
  return {
    count,total:ECHO_FINDINGS.length,findings,
    next:complete
      ?"Trois indices recueillis. Leur signification reste incertaine : l'origine du Rappel n'est pas encore découverte."
      :count===0
        ?"Aucune trace encore relevée. Cherche une Chambre de l'Écho dans les profondeurs et interagis avec elle."
        :"Conserve ces traces à Veyr. Une nouvelle Chambre de l'Écho, lors d'une autre descente, peut révéler un nouvel indice."
  };
}
