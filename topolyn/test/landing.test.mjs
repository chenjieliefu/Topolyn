import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir=path.dirname(fileURLToPath(import.meta.url));
const docs=path.resolve(testDir,'..','..','docs');
const home=fs.readFileSync(path.join(docs,'index.html'),'utf8');
const workspace=fs.readFileSync(path.join(docs,'workspace.html'),'utf8');
const guide=fs.readFileSync(path.join(docs,'guide.html'),'utf8');
const app=fs.readFileSync(path.join(docs,'assets','topolyn-app.js'),'utf8');
const site=fs.readFileSync(path.join(docs,'assets','topolyn-site.js'),'utf8');
const server=fs.readFileSync(path.resolve(docs,'..','scripts','serve-topolyn-site.mjs'),'utf8');
const gitignore=fs.readFileSync(path.resolve(docs,'..','.gitignore'),'utf8');

test('home presents Topolyn as an independent natural-language web product',()=>{
  assert.match(home,/<title>Topolyn — 把想法变成清晰的系统图<\/title>/);
  assert.match(home,/不需要先写代码，也不需要安装任何工具/);
  assert.match(home,/描述你的想法/);
  assert.doesNotMatch(home,/安装 Skill|安装技能|Codex|Claude Code|OpenCode|npx skills add/);
});

test('all four primary product destinations are discoverable from the home page',()=>{
  for(const href of ['index.html','workspace.html','guide.html','gallery.html'])assert.match(home,new RegExp(`href="${href}"`));
  assert.match(home,/data-zh="首页" data-en="Home"/);
  assert.match(home,/data-zh="工作台" data-en="Workspace"/);
  assert.match(home,/data-zh="场景指南" data-en="Scenario Guide"/);
  assert.match(home,/data-zh="验证作品集" data-en="Proof Gallery"/);
});

test('workspace keeps natural language primary and materials optional',()=>{
  const prompt=workspace.indexOf('id="system-prompt"'),materials=workspace.indexOf('class="materials"');
  assert.ok(prompt>-1&&materials>prompt);
  assert.match(workspace,/描述你的想法或场景/);
  assert.match(workspace,/添加材料/);
  assert.match(workspace,/id="repo-url"/);
  assert.match(workspace,/id="material-files"/);
});

test('workspace absorbs scenario guidance into one progressive conversation',()=>{
  assert.match(workspace,/id="conversation-feed"/);
  assert.match(workspace,/assets\/topolyn-scenarios\.js/);
  assert.match(app,/function recommendScenario/);
  assert.match(app,/function showScenarioRecommendation/);
  assert.match(app,/function buildClarifyingQuestions/);
  assert.match(app,/function renderClarificationQuestion/);
  assert.match(app,/function showRequirementReview/);
  assert.match(app,/生成前确认/);
  assert.doesNotMatch(workspace,/图的类型<\/span>/);
});

test('a guide selection becomes active workspace context instead of a plain page jump',()=>{
  assert.match(guide,/workspace\.html\?scenario=\$\{encodeURIComponent\(recipe\.id\)\}&source=guide/);
  assert.match(app,/function startLinkedScenario\(scenarioId\)/);
  assert.match(app,/state\.originalIdea=zh\.prompt\|\|zh\.summary\|\|zh\.title/);
  assert.match(app,/preferred\?`已选择场景`:`推荐表达方式`/);
  assert.match(app,/if\(linkedScenario&&!linkedPrompt\)setTimeout\(\(\)=>startLinkedScenario\(linkedScenario\),80\)/);
  assert.match(app,/scenarioId:state\.recommendation\?\.id\|\|''/);
});

test('workspace completes describe, map, inspect, refine, and export flows',()=>{
  for(const id of ['generate-button','graph-view','summary-view','questions-view','detail-content','refine-form','export-menu'])assert.match(workspace,new RegExp(`id="${id}"`));
  for(const format of ['png','svg','json','summary'])assert.match(workspace,new RegExp(`data-export="${format}"`));
  assert.match(app,/async function generateArchitecture/);
  assert.match(app,/recordClarification\(text\)/);
  assert.match(app,/确认并生成/);
  assert.match(app,/async function addRefinement/);
  assert.match(app,/function exportPng/);
});

test('new maps preserve a browser-local history that can restore earlier diagrams',()=>{
  for(const id of ['history-sidebar','history-toggle','history-new-button','history-list','history-empty'])assert.match(workspace,new RegExp(`id="${id}"`));
  assert.match(app,/const HISTORY_KEY='topolyn-history-v1'/);
  assert.match(app,/const MAX_HISTORY_RECORDS=30/);
  assert.match(app,/function saveHistoryRecord/);
  assert.match(app,/function openHistoryRecord/);
  assert.match(app,/function historyRecordTitle/);
  assert.match(app,/englishModels\[title\]\?\.title\|\|title/);
  assert.match(app,/function startNewMap/);
  assert.match(app,/getHistory:\(\)=>structuredClone\(readHistory\(\)\)/);
  assert.doesNotMatch(app,/removeItem\(HISTORY_KEY\)/);
});

test('workspace distinguishes facts, inference, and open questions',()=>{
  assert.match(workspace,/描述中明确/);assert.match(workspace,/Topolyn 推断/);assert.match(workspace,/需要确认/);
  assert.match(app,/sourceCopyEn/);assert.match(app,/questions/);
});

test('Chinese is the default and every page can persistently switch to English',()=>{
  assert.match(home,/<html lang="zh-CN">/);
  assert.match(workspace,/class="site-button language-toggle"/);
  assert.match(site,/topolyn-language/);
  assert.match(site,/applyLanguage/);
  assert.match(app,/englishModels/);
});

test('the product is permanently light and exposes no dark-mode state',()=>{
  assert.doesNotMatch(home,/theme-toggle/);
  assert.doesNotMatch(workspace,/theme-toggle|theme-button/);
  assert.doesNotMatch(site,/applyTheme|classList\.toggle\('dark'/);
  assert.match(site,/classList\.remove\('dark'\)/);
});

test('live AI integration remains behind one explicit browser boundary',()=>{
  assert.match(app,/window\.TOPOLYN_API_ENDPOINT/);
  assert.match(app,/fetch\(apiEndpoint\(\)/);
  assert.match(app,/window\.TopolynApp=/);
  assert.match(app,/clarifications:structuredClone\(state\.clarifications\)/);
  assert.match(app,/input:\['description','diagramType','scenarioId','clarifications','repositoryUrl','materials','currentModel','refinement'\]/);
  assert.match(app,/DeepSeek 已连接/);
});

test('DeepSeek credentials stay server-side and outside version control',()=>{
  assert.match(server,/process\.env\.DEEPSEEK_API_KEY/);
  assert.match(server,/\/api\/generate/);
  assert.match(server,/Authorization.*Bearer/);
  assert.match(server,/response_format:\{ type:'json_object' \}/);
  assert.doesNotMatch(server,/sk-[a-z0-9]{16,}/i);
  assert.doesNotMatch(app,/sk-[a-z0-9]{16,}/i);
  assert.match(gitignore,/\.topolyn\.env/);
});
