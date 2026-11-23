#!/usr/bin/env node
/**
 * TECH-108B1: read-only entrypoint inventory (not a dead-code detector).
 * Enumerates CSS loaded by index.html and static ESM imports reachable from
 * app.js. Test-only, dynamic, service worker and native APK dependencies are
 * deliberately NOT used as evidence for deleting any asset.
 */
import {execFileSync} from "node:child_process";
import {existsSync,readFileSync,statSync} from "node:fs";
import {dirname,extname,relative,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const docs=resolve(root,"docs");
const tracked=execFileSync("git",["ls-files","-z"],{cwd:root})
  .toString("utf8").split("\0").filter(Boolean);
const docSources=tracked.filter(p=>p.startsWith("docs/"));
const cssFiles=docSources.filter(p=>p.endsWith(".css")).sort();
const jsFiles=docSources.filter(p=>p.endsWith(".js")).sort();
const size=p=>statSync(resolve(root,p)).size;
const total=arr=>arr.reduce((sum,p)=>sum+size(p),0);
const read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("docs/index.html");
const cssRefs=[...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/g)].map(x=>x[1]);
const scriptRefs=[...html.matchAll(/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1]);
const broken=[];
function resolveLocal(source,ref,kind){
  if(/^(?:https?:|data:|\/)/i.test(ref))return null;
  const path=ref.split(/[?#]/)[0];
  const absolute=resolve(dirname(resolve(root,source)),path);
  if(absolute!==docs&&!absolute.startsWith(docs+sep)){
    broken.push({source,kind,ref,reason:"outside docs"});
    return null;
  }
  const target=relative(root,absolute).split(sep).join("/");
  if(!existsSync(absolute)){
    broken.push({source,kind,ref,reason:"missing file",target});
    return null;
  }
  return target;
}
const cssEntries=cssRefs.map(ref=>resolveLocal("docs/index.html",ref,"CSS")).filter(Boolean);
const jsEntries=scriptRefs.map(ref=>resolveLocal("docs/index.html",ref,"module")).filter(Boolean);
const reachable=new Set();
const pending=[...jsEntries];
while(pending.length){
  const current=pending.pop();
  if(!current||reachable.has(current))continue;
  reachable.add(current);
  const source=read(current);
  const refs=[
    ...source.matchAll(/\bfrom\s*["']([^"']+)["']/g),
    ...source.matchAll(/\bimport\s*["']([^"']+)["']/g),
    ...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)
  ].map(x=>x[1]).filter(x=>x.startsWith("./")||x.startsWith("../"));
  for(const ref of refs){
    const target=resolveLocal(current,ref,"static JS import");
    if(target&&!reachable.has(target))pending.push(target);
  }
}
const unlinkedCss=cssFiles.filter(p=>!cssEntries.includes(p));
const unreachedJs=jsFiles.filter(p=>!reachable.has(p));
const duplicateCssEntries=cssEntries.filter((p,i)=>cssEntries.indexOf(p)!==i);
const css=read("docs/uiart106a.css");
const shadowedQuickAction=css.includes("min-height:55px;min-width:0;min-height:44px;");
const report={
  phase:"TECH-108B1",kind:"static entrypoint inventory",
  disclaimer:"Unlinked/unreached means only absent from this static entrypoint graph; NOT unused or safe to delete.",
  trackedDocsCss:{count:cssFiles.length,bytes:total(cssFiles)},
  trackedDocsJs:{count:jsFiles.length,bytes:total(jsFiles)},
  indexCss:{count:cssEntries.length,unique:new Set(cssEntries).size,files:cssEntries},
  indexModuleScripts:jsEntries,
  staticJsClosure:{count:reachable.size,bytes:total([...reachable]),files:[...reachable].sort()},
  candidatesToInvestigate:{
    cssNotDirectlyLinked:unlinkedCss,
    jsNotInStaticEntryGraph:unreachedJs
  },
  broken,duplicateCssEntries,
  redundantQuickActionMinHeight:shadowedQuickAction
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(process.argv.includes("--check")&&(broken.length||duplicateCssEntries.length||
  shadowedQuickAction||!cssEntries.length||!jsEntries.length)){
  process.stderr.write("TECH-108B1: static inventory/quick-action CSS guard failed\n");
  process.exitCode=1;
}
