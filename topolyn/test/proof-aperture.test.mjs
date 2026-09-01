import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir=path.dirname(fileURLToPath(import.meta.url));
const docs=path.resolve(testDir,'..','..','docs');
const workspace=fs.readFileSync(path.join(docs,'workspace.html'),'utf8');
const css=fs.readFileSync(path.join(docs,'assets','topolyn-workspace.css'),'utf8');
const chatCss=fs.readFileSync(path.join(docs,'assets','topolyn-chat.css'),'utf8');
const app=fs.readFileSync(path.join(docs,'assets','topolyn-app.js'),'utf8');

test('workspace first viewport is a focused conversation before revealing the map',()=>{
  const description=workspace.indexOf('class="brief panel conversation-panel"'),canvas=workspace.indexOf('class="canvas panel"'),details=workspace.indexOf('class="detail panel"');
  assert.ok(description>-1&&canvas>description&&details>canvas);
  assert.match(workspace,/class="workspace is-conversation"/);
  assert.match(chatCss,/\.workspace\.is-conversation \.canvas,.workspace\.is-conversation \.detail\{display:none\}/);
  assert.match(chatCss,/\.workspace\.is-conversation\{background:var\(--surface\);height:100vh;padding:64px 0 0\}/);
  assert.match(chatCss,/\.workspace\.is-conversation \.conversation-panel\{background:transparent;border:0;border-radius:0;box-shadow:none;height:100%;max-width:none\}/);
  assert.match(chatCss,/\.workspace\.is-generated\{grid-template-columns:390px minmax\(560px,1fr\) 274px\}/);
});

test('diagram surface has semantic edges, zoom, selection, and persistent work',()=>{
  assert.match(workspace,/id="edge-layer"/);assert.match(workspace,/id="node-layer"/);
  assert.match(app,/function renderGraph/);assert.match(app,/function renderEdges/);assert.match(app,/function selectNode/);
  assert.match(app,/topolyn-workspace/);
});

test('saved diagrams use a persistent desktop rail and a compact-screen drawer',()=>{
  assert.match(chatCss,/\.history-sidebar\{[^}]*position:fixed[^}]*top:64px/);
  assert.match(chatCss,/@media\(min-width:1281px\)\{\.history-sidebar\{transform:none\}/);
  assert.match(chatCss,/\.history-sidebar\.is-open\{transform:translateX\(0\)!important\}/);
  assert.match(chatCss,/\.history-backdrop\[hidden\]\{display:none\}/);
  assert.match(chatCss,/@media\(min-width:1400px\) and \(max-width:1580px\)\{\.workspace\.is-generated\{grid-template-columns:330px minmax\(520px,1fr\) 250px\}\}/);
});

test('selecting a node replaces the empty detail state instead of pushing content below it',()=>{
  assert.match(css,/\.detail-empty\[hidden\],\.detail-content\[hidden\]\{display:none!important\}/);
  assert.match(app,/\$\('#detail-empty'\)\.hidden=true; \$\('#detail-content'\)\.hidden=false/);
});

test('generation status truthfully reports the live AI service',()=>{
  assert.match(workspace,/id="generation-status" hidden/);assert.match(workspace,/id="engine-status"/);assert.match(workspace,/正在检查 AI 服务/);
  assert.match(app,/正在理解你的描述/);assert.match(app,/Generating the first map/);
});

test('workspace supports desktop, compact, mobile, light-only, and reduced-motion modes',()=>{
  assert.match(css,/@media\(max-width:1120px\)/);assert.match(css,/@media\(max-width:780px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.doesNotMatch(workspace,/theme-toggle|theme-button/);
});
