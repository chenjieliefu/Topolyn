import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIO_RECIPES } from '../recipes/scenarios.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(skillRoot, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-gallery-'));
const generatedRoot = path.join(tmp, 'docs');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function normalize(text) {
  return text.replace(/\r\n?/g, '\n');
}

test('generated proof gallery matches its sources, receipts, and checked-in artifacts', () => {
  const output = execFileSync(process.execPath, [
    path.join(repoRoot, 'scripts', 'build-gallery.mjs'),
    generatedRoot,
  ], { encoding: 'utf8' });
  assert.match(output, /gallery 11 artifacts \/ 99 checks/);

  const manifestPath = path.join(generatedRoot, 'gallery', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.archifyVersion, JSON.parse(fs.readFileSync(path.join(skillRoot, 'package.json'))).version);
  assert.equal(manifest.entryCount, 11);
  assert.equal(manifest.checkCount, 99);
  assert.deepEqual(new Set(manifest.entries.map((entry) => entry.type)), new Set([
    'architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle',
  ]));
  assert.deepEqual(
    Object.fromEntries(['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'].map((type) => [
      type,
      manifest.entries.filter((entry) => entry.type === type).length,
    ])),
    { architecture: 2, workflow: 3, sequence: 2, dataflow: 2, lifecycle: 2 },
  );
  assert.deepEqual(
    new Set(manifest.entries.map((entry) => entry.id)),
    new Set(SCENARIO_RECIPES.map((recipe) => recipe.proof)),
  );

  const workflow = manifest.entries.find((entry) => entry.id === 'agent-tool-call');
  assert.equal(workflow.view, 'happy-path');
  assert.equal(workflow.viewCount, 3);
  assert.deepEqual(workflow.viewIds, ['happy-path', 'safety-gate', 'evidence-loop']);
  assert.equal(workflow.guidedPlayback, true);

  const deployment = manifest.entries.find((entry) => entry.id === 'deployment-ownership');
  assert.equal(deployment.engineeringProfile, 'deployment-ownership');
  assert.ok(manifest.entries.filter((entry) => entry.id !== 'deployment-ownership')
    .every((entry) => entry.engineeringProfile === null));

  for (const entry of manifest.entries) {
    const artifact = path.join(generatedRoot, entry.artifact.replace(/^gallery\//, 'gallery/'));
    const source = path.join(generatedRoot, entry.input.replace(/^gallery\//, 'gallery/'));
    assert.ok(fs.existsSync(artifact), `${entry.id}: artifact missing`);
    assert.ok(fs.existsSync(source), `${entry.id}: source missing`);
    assert.equal(sha256(artifact), entry.artifactSha256, `${entry.id}: artifact digest drift`);
    assert.equal(sha256(source), entry.sourceSha256, `${entry.id}: source digest drift`);
    const localizedArtifact = path.join(generatedRoot, entry.localizedArtifact);
    const localizedSource = path.join(generatedRoot, entry.localizedInput);
    assert.equal(sha256(localizedArtifact), entry.localizedArtifactSha256, `${entry.id}: localized artifact digest drift`);
    assert.equal(sha256(localizedSource), entry.localizedSourceSha256, `${entry.id}: localized source digest drift`);
    assert.equal(entry.localizedChecksPassed, 9, `${entry.id}: localized validation receipt not green`);
    assert.equal(entry.checks.length, 9);
    assert.ok(entry.checks.every((check) => check.ok), `${entry.id}: validation receipt not green`);
    assert.equal(entry.composition.profile, 'showcase', `${entry.id}: expected showcase composition profile`);
    assert.equal(entry.composition.status, 'pass', `${entry.id}: showcase composition is not green`);
    assert.equal(entry.composition.metrics.properCrossings, 0, `${entry.id}: proper crossing debt remains`);
    assert.equal(entry.composition.metrics.ambiguousCorridors, 0, `${entry.id}: ambiguous corridor debt remains`);
    assert.equal(entry.composition.metrics.containerBorderRuns, 0, `${entry.id}: container border-run debt remains`);
    assert.equal(entry.composition.metrics.labelRouteClearanceIssues, 0, `${entry.id}: label-route clearance debt remains`);
    assert.equal(entry.composition.metrics.shortInteriorSegmentCount, 0, `${entry.id}: cramped interior turn remains`);
    assert.equal(entry.composition.metrics.microSegmentCount, 0, `${entry.id}: micro segment remains`);
    assert.equal(entry.viewCount, 3, `${entry.id}: expected a three-step reader story`);
    assert.equal(entry.guidedPlayback, true, `${entry.id}: guided playback missing`);
  }

  const html = fs.readFileSync(path.join(generatedRoot, 'gallery.html'), 'utf8');
  assert.equal((html.match(/class="showcase-card/g) || []).length, 11);
  assert.match(html, /id="gallery-manifest" type="application\/json"/);
  assert.match(html, /data-src-zh="gallery\/localized-artifacts\/agent-tool-call\.workflow\.html\?embed=1&amp;theme=light"/);
  assert.match(html, /data-src-en="gallery\/artifacts\/agent-tool-call\.workflow\.html\?embed=1&amp;theme=light"/);
  assert.match(html, /localized-artifacts\/agent-tool-call\.workflow\.html\?theme=light&amp;present=1&amp;play=1#view=happy-path/);
  assert.match(html, /data-href-en="gallery\/artifacts\/agent-tool-call\.workflow\.html\?theme=light&amp;present=1&amp;play=1#view=happy-path"/);
  assert.match(html, /localized-artifacts\/event-stream\.dataflow\.html\?theme=light&amp;present=1&amp;play=1#view=order-transit/);
  assert.match(html, /syncArtifactLanguage/);
  assert.match(html, /topolyn:language/);
  assert.match(html, /id="proof-deployment-lifecycle"/);
  assert.match(html, /Play named chapter/);
  assert.match(html, /3 个视图 · 可播放/);
  assert.match(html, /Proof,<br><em>not promises\.<\/em>/);
  assert.match(html, /Five lenses\. Eleven real stories\./);
  assert.match(html, /画面结构<\/span><span class="receipt-value ok" title="0 个交叉 · 0 个边界重合 · 0 个微小线段 · 0 个拥挤转角">SHOWCASE · 通过/);
  assert.match(html, /工程规则/);
  assert.match(html, /DEPLOYMENT OWNERSHIP · 通过/);
  assert.match(html, /theme=light/);
  assert.doesNotMatch(html, /theme=dark/);
  assert.match(html, /assets\/topolyn-site\.css/);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /data-zh="验证作品集" data-en="Proof Gallery"/);
  assert.equal((html.match(/class="card-link create-link"/g) || []).length, 11);
  for (const type of ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle']) {
    assert.match(html, new RegExp(`workspace\\.html\\?type=${type}&amp;source=gallery`), `${type}: gallery-to-workspace link missing`);
  }
  assert.match(html, /不是效果图/);
  assert.match(html, /所有案例均由同一套生成与验证管线产生/);

  const localizedWorkflow = JSON.parse(fs.readFileSync(path.join(generatedRoot, 'gallery/localized-sources/agent-tool-call.workflow.json'), 'utf8'));
  assert.equal(localizedWorkflow.meta.locale, 'zh-CN');
  assert.equal(localizedWorkflow.meta.title, '智能体工具调用');
  assert.deepEqual(localizedWorkflow.meta.views.map((view) => view.label), ['请求到结果', '策略与恢复', '证据与记忆']);
  assert.deepEqual(localizedWorkflow.cards.map((card) => card.title), ['渲染规则', '工作流语义', '为什么重要']);
  assert.equal(localizedWorkflow.cards[0].items[0], '泳道和列决定节点位置');
  assert.equal(localizedWorkflow.nodes.find((node) => node.id === 'user').label, 'User');
  assert.equal(localizedWorkflow.nodes.find((node) => node.id === 'user').sublabel, '用户 · 提出任务');
  const localizedWorkflowArtifact = fs.readFileSync(path.join(generatedRoot, 'gallery/localized-artifacts/agent-tool-call.workflow.html'), 'utf8');
  assert.doesNotMatch(localizedWorkflowArtifact, /id="topolyn-hover-zh-data"/);
  assert.match(localizedWorkflowArtifact, /请求到结果/);
  assert.match(localizedWorkflowArtifact, /渲染规则/);
  assert.match(localizedWorkflowArtifact, /无需直接修改 SVG 即可编辑图谱/);
  assert.match(localizedWorkflowArtifact, /id="topolyn-gallery-embed-fit"/);
  assert.match(localizedWorkflowArtifact, /id="topolyn-gallery-detail-layout"/);
  assert.match(localizedWorkflowArtifact, /padding-right: 29rem/);
  assert.match(localizedWorkflowArtifact, /"viewer\.theme\.light":"浅色"/);
  assert.match(localizedWorkflowArtifact, /导出 <span class="toolbar-icon toolbar-chevron"/);
  assert.doesNotMatch(localizedWorkflowArtifact, /<div class="card" title=/);
  assert.doesNotMatch(localizedWorkflowArtifact, /渲染规则：泳道和列决定节点位置/);
  const englishWorkflowArtifact = fs.readFileSync(path.join(generatedRoot, 'gallery/artifacts/agent-tool-call.workflow.html'), 'utf8');
  assert.doesNotMatch(englishWorkflowArtifact, /topolyn-hover-zh-data/);
  assert.match(englishWorkflowArtifact, /id="topolyn-gallery-detail-layout"/);
  assert.match(englishWorkflowArtifact, /padding-right: 29rem/);

  for (const relative of [
    'gallery.html',
    'gallery/manifest.json',
    ...manifest.entries.flatMap((entry) => [entry.artifact, entry.input, entry.localizedArtifact, entry.localizedInput]),
  ]) {
    const fresh = path.join(generatedRoot, relative);
    const checked = path.join(repoRoot, 'docs', relative);
    assert.ok(fs.existsSync(checked), `${relative}: checked-in gallery output missing`);
    assert.equal(normalize(fs.readFileSync(fresh, 'utf8')), normalize(fs.readFileSync(checked, 'utf8')),
      `${relative}: checked-in gallery output is stale; run node scripts/build-gallery.mjs`);
  }
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
