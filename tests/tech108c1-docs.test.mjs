import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const audit=JSON.parse(execFileSync(process.execPath,
  ["tools/tech108c1-docs.mjs","--check"],{cwd:root,encoding:"utf8"}));

test("TECH-108C1: preserve all original Markdown documentation",()=>{
  assert.equal(audit.phase,"TECH-108C1");
  assert.ok(audit.markdown.total>=141,"baseline must never silently lose Markdown files");
  assert.ok(audit.markdown.docs>=134);
  assert.ok(audit.markdown.bytes>=817552);
  assert.deepEqual(audit.missingRequired,[]);
});
test("TECH-108C1: record unresolved and ambiguous links, never delete on heuristics",()=>{
  assert.ok(Array.isArray(audit.unresolvedCandidates));
  assert.ok(Array.isArray(audit.uncertainCandidates));
  assert.ok(Array.isArray(audit.unreferencedMarkdownCandidates));
  assert.ok(audit.links.scanned>=0);
  assert.equal(audit.links.unresolved,audit.unresolvedCandidates.length);
  assert.equal(audit.links.uncertain,audit.uncertainCandidates.length);
  assert.match(audit.policy,/NO DELETION/);
  assert.match(audit.policy,/not proof of obsolescence/);
});
test("TECH-108C1: retain historic checkpoint and protection references",()=>{
  for(const path of [
    "README.md","ROADMAP.md","docs/GDD_EXPLORATION_NHAL_V0.9.md",
    "docs/TECH108A_AUDIT_BASELINE.md",
    "docs/TECH108B4_VISUAL_RESOURCE_INVENTORY.md"
  ])assert.ok(audit.requiredDocuments.includes(path));
  assert.ok(audit.markdown.groups.checkpoints?.files>0);
  assert.ok(audit.markdown.groups.gdd?.files>0);
  assert.ok(audit.markdown.groups.qa?.files>0);
});
