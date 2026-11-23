#!/usr/bin/env node
/**
 * TECH-108C1: non-destructive inventory of tracked Markdown and literal links.
 * Lexical absence is NEVER proof a file can be deleted; dynamic, reference-
 * style and code-generated links require a separate review.
 */
import {execFileSync} from "node:child_process";
import {existsSync,readFileSync,statSync} from "node:fs";
import {posix,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const fromRepo=p=>resolve(root,p.split("/").join(sep));
const files=execFileSync("git",["ls-files","-z"],{cwd:root})
  .toString("utf8").split("\0").filter(Boolean).sort();
const paths=new Set(files);
const markdown=files.filter(p=>p.toLowerCase().endsWith(".md"));
const required=[
  "README.md","ROADMAP.md","docs/GDD_EXPLORATION_NHAL_V0.9.md",
  "docs/TECH108A_AUDIT_BASELINE.md",
  "docs/TECH108B4_VISUAL_RESOURCE_INVENTORY.md"
];
const missingRequired=required.filter(p=>!paths.has(p)||!existsSync(fromRepo(p)));
const group=p=>{
  if(!p.startsWith("docs/"))return "root";
  const name=posix.basename(p);
  if(name.startsWith("CHECKPOINT"))return "checkpoints";
  if(/^GDD_/i.test(name))return "gdd";
  if(/^QA/i.test(name))return "qa";
  if(/^TECH/i.test(name))return "tech";
  if(/^(ART|UI|GAME|DEV|NAR)/i.test(name))return "production";
  return "other-docs";
};
const groups={};
let bytes=0;
for(const p of markdown){
  const n=statSync(fromRepo(p)).size;
  bytes+=n;
  groups[group(p)]??={files:0,bytes:0};
  groups[group(p)].files++;
  groups[group(p)].bytes+=n;
}
const references=[],unresolvedCandidates=[],uncertainCandidates=[],incoming=new Set();
for(const file of markdown){
  const lines=readFileSync(fromRepo(file),"utf8").split(/\r?\n/);
  let inFence=false;
  for(let index=0;index<lines.length;index++){
    const line=lines[index];
    if(/^\s*(?:~{3,}|\x60{3,})/.test(line)){inFence=!inFence;continue;}
    if(inFence)continue;
    const plain=line.replace(/\x60[^\x60]*\x60/g,"");
    const links=/!?\[[^\]\n]*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
    for(const m of plain.matchAll(links)){
      const raw=m[1].replace(/^<|>$/g,"");
      if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(raw))continue;
      let target=raw.split(/[?#]/)[0];
      if(!target)continue;
      try{target=decodeURIComponent(target);}
      catch{
        uncertainCandidates.push({file,line:index+1,raw,reason:"invalid-encoding"});
        continue;
      }
      if(target.startsWith("/")){
        uncertainCandidates.push({file,line:index+1,raw,reason:"root-relative-url"});
        continue;
      }
      const resolved=posix.normalize(posix.join(posix.dirname(file),target));
      if(resolved===".."||resolved.startsWith("../")){
        uncertainCandidates.push({file,line:index+1,raw,reason:"outside-repository"});
        continue;
      }
      const tracked=paths.has(resolved);
      const trackedDirectory=!tracked&&files.some(p=>p.startsWith(resolved.replace(/\/$/,"")+"/"));
      const present=tracked||trackedDirectory||existsSync(fromRepo(resolved));
      const ref={file,line:index+1,raw,resolved,kind:
        tracked?"tracked-file":trackedDirectory?"tracked-directory":
        present?"generated-or-untracked":"unresolved"};
      references.push(ref);
      if(tracked)incoming.add(resolved);
      if(!present)unresolvedCandidates.push(ref);
    }
  }
}
const report={
  phase:"TECH-108C1",
  baselineSha:"1321bb6375fc25d1ed17041dc6e8ebf889b9dc25",
  scope:"Git-tracked Markdown plus conservative inline Markdown link syntax",
  trackedFiles:files.length,
  markdown:{total:markdown.length,docs:markdown.filter(p=>p.startsWith("docs/")).length,
    bytes,groups},
  links:{scanned:references.length,trackedFiles:references.filter(r=>r.kind==="tracked-file").length,
    trackedDirectories:references.filter(r=>r.kind==="tracked-directory").length,
    generatedOrUntracked:references.filter(r=>r.kind==="generated-or-untracked").length,
    unresolved:unresolvedCandidates.length,uncertain:uncertainCandidates.length},
  unresolvedCandidates,
  uncertainCandidates,
  unreferencedMarkdownCandidates:markdown.filter(p=>!incoming.has(p)),
  requiredDocuments:required,
  missingRequired,
  policy:"NO DELETION: unlinked or unresolved is not proof of obsolescence. Check historical consumers, code, builds and external inbound links before any proposal."
};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes("--check")&&(missingRequired.length||markdown.length<141)){
  console.error("TECH-108C1: protected Markdown baseline missing");
  process.exitCode=1;
}