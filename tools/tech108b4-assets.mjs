#!/usr/bin/env node
/**
 * TECH-108B4: read-only inventory of file-backed visual assets and
 * text-defined sprite providers. A lexical reference is NOT evidence that
 * a resource is unused, removable or safe to change.
 *
 * Generated PNG icons are deliberately absent from git and must be generated
 * by tools/make-icons.mjs before running --check.
 */
import {execFileSync} from "node:child_process";
import {existsSync,readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const pathInRepo=p=>resolve(root,p);
const tracked=execFileSync("git",["ls-files","-z","docs"],{cwd:root})
  .toString("utf8").split("\0").filter(Boolean).sort();
const read=p=>readFileSync(pathInRepo(p),"utf8");
const imageExt=/\.(?:svg|png|webp|gif|jpe?g|ico)$/i;
const visualFiles=tracked.filter(p=>imageExt.test(p));
const codeSources=tracked.filter(p=>/^docs\/.+\.(?:html|css|js|webmanifest)$/i.test(p));
const nonCacheSources=codeSources.filter(p=>p!=="docs/sw.js");
const sw=read("docs/sw.js");
const coreMatch=sw.match(/const CORE\s*=\s*(\[[\s\S]*?\]);/);
if(!coreMatch)throw Error("PWA CORE list missing: manual review required");
const core=JSON.parse(coreMatch[1]);
const manifest=JSON.parse(read("docs/manifest.webmanifest"));
const generator=readFileSync(pathInRepo("tools/make-icons.mjs"),"utf8");
const generatedIconNames=["icon-192.png","icon-512.png"];
const created=generatedIconNames.map(name=>{
  const path="docs/"+name;
  return {
    path,
    generator:"tools/make-icons.mjs",
    exists:existsSync(pathInRepo(path)),
    bytes:existsSync(pathInRepo(path))?statSync(pathInRepo(path)).size:null,
    tracked:tracked.includes(path),
    manifest:manifest.icons.some(icon=>icon.src==="./"+name),
    core:core.includes("./"+name)
  };
});
const scan=nonCacheSources.map(path=>[path,read(path)]);
const visualAssets=visualFiles.map(path=>{
  const basename=path.slice("docs/".length);
  const references=scan.filter(([,source])=>source.includes(basename)).map(([source])=>source);
  return {
    path,
    bytes:statSync(pathInRepo(path)).size,
    pwaCached:core.includes("./"+basename),
    textualReferences:references,
    cacheOnly:references.length===0
  };
});
const spriteProviderCandidates=scan.filter(([path,source])=>
  path.endsWith(".js")&&/(?:_SVG[S]?\b|_SPRITES?\b|<svg\b|viewBox=)/i.test(source)
).map(([path])=>path);
const missingCore=core.map(url=>({url,path:"docs/"+url.replace(/^\.\//,"").split(/[?#]/)[0]}))
  .filter(entry=>!existsSync(pathInRepo(entry.path)));
const missingManifest=(manifest.icons||[])
  .map(icon=>({src:icon.src,path:"docs/"+icon.src.replace(/^\.\//,"").split(/[?#]/)[0]}))
  .filter(icon=>!existsSync(pathInRepo(icon.path))||!core.includes(icon.src));
const nonPrecached=visualAssets.filter(a=>!a.pwaCached).map(a=>a.path);
const generatorKnown=generator.includes("for (const size of [192, 512])");
const report={
  phase:"TECH-108B4",
  type:"read-only visual resource and sprite-source inventory",
  disclaimer:"Textual references and cache membership do NOT establish runtime use. Cache-only and sprite-source candidates MUST NOT be deleted without manual and physical Android proof.",
  trackedVisualAssets:{count:visualAssets.length,bytes:visualAssets.reduce((n,a)=>n+a.bytes,0),files:visualAssets},
  generatedAssets:created,
  inlineSpriteSourceCandidates:spriteProviderCandidates,
  pwaCache:{coreCount:core.length,missing:missingCore,visualNotListed:nonPrecached},
  manifest:{missingOrNotCached:missingManifest},
  candidatesToInvestigate:{trackedVisualFilesWithNoLiteralRuntimeReference:visualAssets.filter(a=>a.cacheOnly).map(a=>a.path)},
  generatorKnown
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(process.argv.includes("--check")&&
  (missingCore.length||missingManifest.length||nonPrecached.length||
    created.some(x=>!x.exists||!x.manifest||!x.core||x.tracked)||
    !generatorKnown||visualAssets.length===0)){
  console.error("TECH-108B4: generated assets, PWA precache or visual resource guard failed");
  process.exitCode=1;
}
