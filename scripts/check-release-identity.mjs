#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootFlag = process.argv.indexOf('--root');
const repoRoot = rootFlag === -1 ? scriptRoot : path.resolve(process.argv[rootFlag + 1] || '');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    fail(`${relativePath} is missing or unreadable.`);
    return '';
  }
}

function readJson(relativePath) {
  const source = read(relativePath);
  if (!source) return {};
  try {
    return JSON.parse(source);
  } catch {
    fail(`${relativePath} is not valid JSON.`);
    return {};
  }
}

function compareCore(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function shieldEscape(value) {
  return value.replaceAll('_', '__').replaceAll('-', '--');
}

function versionLabels(source) {
  return [...source.matchAll(/\bv(\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)\b/g)]
    .map((match) => match[1]);
}

function checkReadme(relativePath, source, version, language, isDevelopment) {
  const badge = `/badge/version-${shieldEscape(version)}-`;
  const markerLabel = language === 'zh'
    ? isDevelopment ? '当前开发版本：' : '当前稳定版本：'
    : isDevelopment ? 'Current development version:' : 'Current stable version:';
  const identity = isDevelopment ? 'development' : 'stable';
  const hasMarker = source.split('\n').some((line) => line.includes(markerLabel) && line.includes(`\`v${version}\``));
  if (!source.includes(badge) || !hasMarker) {
    fail(`${relativePath} must advertise ${identity} identity v${version} with an exact escaped badge and explicit ${identity} marker.`);
  }
}

function checkDocument(relativePath, source, version, isDevelopment) {
  const labels = versionLabels(source);
  const identity = isDevelopment ? 'development' : 'stable';
  const englishLabel = isDevelopment ? /development/i : /stable/i;
  const chineseLabel = isDevelopment ? /开发版/ : /稳定版/;
  if (labels.length === 0 || labels.some((label) => label !== version)
    || !englishLabel.test(source) || !chineseLabel.test(source)) {
    fail(`${relativePath} must advertise ${identity} identity v${version} in both languages without a conflicting version alias.`);
  }
}

function checkRavenBoundary(relativePath, source, language) {
  const installParent = String.raw`~\/\.raven\/workspace\/skills`;
  const installedRoot = `${installParent}\/topolyn`;
  const pathBoundary = String.raw`(?=$|[\s\x60'"<>,.;:，；。])`;
  const hasEnglishManual = /manual ZIP/i.test(source);
  const hasChineseManual = /(?:手动[^\n<]{0,40}ZIP|ZIP[^\n<]{0,40}手动)/i.test(source);
  const hasRequiredCopy = language === 'both'
    ? hasEnglishManual && hasChineseManual
    : language === 'zh' ? hasChineseManual : hasEnglishManual;
  const englishExtractsIntoParent = new RegExp(
    String.raw`(?:extract|unpack)[^\n]{0,180}topolyn\.zip[^\n]{0,180}(?:into|to)\s*[\x60'"<]*${installParent}${pathBoundary}`,
    'i',
  ).test(source);
  const englishExplainsInstalledRoot = new RegExp(
    String.raw`(?:yields?|creates?|produces?|results? in)[^\n]{0,120}${installedRoot}`,
    'i',
  ).test(source);
  const chineseExtractsIntoParent = new RegExp(
    String.raw`topolyn\.zip[^\n]{0,100}解压(?:到|至)\s*[\x60'"<]*${installParent}${pathBoundary}`,
    'i',
  ).test(source);
  const chineseExplainsInstalledRoot = new RegExp(
    String.raw`(?:得到|生成|产生|最终位于)[^\n]{0,120}${installedRoot}`,
    'i',
  ).test(source);
  const hasCorrectDestination = language === 'both'
    ? englishExtractsIntoParent && englishExplainsInstalledRoot
      && chineseExtractsIntoParent && chineseExplainsInstalledRoot
    : language === 'zh'
      ? chineseExtractsIntoParent && chineseExplainsInstalledRoot
      : englishExtractsIntoParent && englishExplainsInstalledRoot;
  const nestedDestination = new RegExp(
    String.raw`(?:\b(?:extract|unpack)[^\n]{0,220}(?:into|to)|解压(?:到|至))\s*[\x60'"<]*${installedRoot}`,
    'i',
  ).test(source);
  const inventsSwitcher = /data-agent=["']raven["']/i.test(source)
    || /--agent\s+raven\b/i.test(source)
    || /[?&]agent=raven\b/i.test(source);
  if (!/Raven/i.test(source) || !hasRequiredCopy || !hasCorrectDestination
    || nestedDestination || inventsSwitcher) {
    fail(`${relativePath}: Raven must remain a manual ZIP installation outside the agent switcher: extract topolyn.zip into ~/.raven/workspace/skills, yielding ~/.raven/workspace/skills/topolyn.`);
  }
}

function checkIdentityTemplate(relativePath, source, isDevelopment) {
  const hasHardcodedVersion = /\b\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?\b/.test(source);
  const identity = isDevelopment ? 'development and 开发版' : 'stable and 稳定版';
  const hasIdentity = isDevelopment
    ? /development/i.test(source) && /开发版/.test(source)
    : /stable/i.test(source) && /稳定版/.test(source);
  if (!source.includes('[[ARCHIFY_VERSION]]') || !hasIdentity || hasHardcodedVersion) {
    fail(`${relativePath} must use [[ARCHIFY_VERSION]] with ${identity} labels, never a hardcoded package version.`);
  }
}

function checkRoadmap(relativePath, source, version, isDevelopment) {
  const identity = isDevelopment ? 'development line' : 'stable version';
  const marker = `The current ${identity} is \`v${version}\``;
  if (!source.includes(marker)) {
    fail(`${relativePath} must declare the current ${identity} as v${version}.`);
  }
}

const packageJson = readJson('topolyn/package.json');
const changelog = read('CHANGELOG.md');
const unreleasedStart = changelog.search(/^## \[Unreleased\][^\n]*(?:\n|$)/m);
const afterUnreleased = unreleasedStart === -1
  ? ''
  : changelog.slice(unreleasedStart).replace(/^## \[Unreleased\][^\n]*(?:\n|$)/, '');
const nextRelease = afterUnreleased.search(/^## \[/m);
const unreleased = nextRelease === -1 ? afterUnreleased : afterUnreleased.slice(0, nextRelease);
const hasRealUnreleasedChanges = /^\s*-\s+\S/m.test(unreleased);
const version = packageJson.version;
const semver = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
const isDevelopment = Boolean(semver?.[4]);

if (!semver) {
  fail(`package version is not a supported SemVer identity: ${JSON.stringify(version)}`);
} else if (hasRealUnreleasedChanges && !semver[4]) {
  fail(`Unreleased changes require a prerelease package version; found stable ${version}.`);
}

if (semver && hasRealUnreleasedChanges) {
  if (semver[4] && !/^dev\.\d+$/.test(semver[4])) {
    fail(`Unreleased development identity must use a dev.N prerelease; found ${version}.`);
  }
  const published = [...changelog.matchAll(/^## \[(\d+)\.(\d+)\.(\d+)\]/gm)]
    .map((match) => match.slice(1, 4).map(Number));
  const newestPublished = published.sort((left, right) => compareCore(right, left))[0];
  const currentCore = semver.slice(1, 4).map(Number);
  if (newestPublished && compareCore(currentCore, newestPublished) <= 0) {
    fail(`Unreleased package core ${currentCore.join('.')} must be newer than published ${newestPublished.join('.')}.`);
  }
}

if (semver) {
  const lock = readJson('topolyn/package-lock.json');
  if (lock.version !== version || lock.packages?.['']?.version !== version) {
    fail(`topolyn/package-lock.json must match ${version} at the root and packages[""].`);
  }

  const skill = read('topolyn/SKILL.md');
  const skillVersion = skill.match(/^\s*version:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];
  const expectedSkillVersion = `${semver[1]}.${semver[2]}`;
  if (skillVersion !== expectedSkillVersion) {
    fail(`topolyn/SKILL.md metadata version ${skillVersion || '(missing)'} must map to package ${version} as ${expectedSkillVersion}.`);
  }

  const rendererTemplate = read('topolyn/assets/template.html');
  const generatorVersions = [...rendererTemplate.matchAll(/<meta\s+name="generator"\s+content="topolyn\s+([^"]+)"\s*\/?>/g)]
    .map((match) => match[1]);
  if (generatorVersions.length !== 1 || generatorVersions[0] !== version) {
    fail(`topolyn/assets/template.html generator must be topolyn ${version}; found ${generatorVersions.join(', ') || '(missing)'}.`);
  }

  const english = read('README.md');
  const chinese = read('README.zh-CN.md');
  checkReadme('README.md', english, version, 'en', isDevelopment);
  checkReadme('README.zh-CN.md', chinese, version, 'zh', isDevelopment);
  checkRavenBoundary('README.md', english, 'en');
  checkRavenBoundary('README.zh-CN.md', chinese, 'zh');
  for (const [alias, target] of [['README_EN.md', 'README.md'], ['README_ZH.md', 'README.zh-CN.md']]) {
    const source = read(alias);
    if (!source.includes(`](${target})`)) fail(`${alias} must link to ${target}.`);
  }

  const newestStableLabel = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)][0]?.[1];
  if (newestStableLabel && isDevelopment) {
    const stableMinor = newestStableLabel.split('.').slice(0, 2).join('\\.');
    if (new RegExp(`Topolyn ${stableMinor} includes\\b`).test(english)
      || new RegExp(`Topolyn ${stableMinor} 已覆盖`).test(chinese)) {
      fail(`README capability summary must describe v${version} as development, not published ${newestStableLabel}.`);
    }
  }

  const landing = read('docs/index.html');
  checkDocument('docs/index.html', landing, version, isDevelopment);
  if (!/href=["']workspace\.html["']/.test(landing)
    || !/href=["']guide\.html["']/.test(landing)
    || !/href=["']gallery\.html["']/.test(landing)) {
    fail('docs/index.html must expose the complete four-page Topolyn product navigation.');
  }
  const workspace = read('docs/workspace.html');
  checkDocument('docs/workspace.html', workspace, version, isDevelopment);
  if (!/id=["']system-prompt["']/.test(workspace)
    || !/id=["']generate-button["']/.test(workspace)
    || !/assets\/topolyn-app\.js/.test(workspace)) {
    fail('docs/workspace.html must expose the independent Topolyn generation workspace.');
  }
  const start = read('docs/start.html');
  checkDocument('docs/start.html', start, version, isDevelopment);
  checkRavenBoundary('docs/start.html', start, 'both');
  checkRoadmap('ROADMAP.md', read('ROADMAP.md'), version, isDevelopment);

  for (const templatePath of [
    'scripts/start-template.html',
    'scripts/guide-template.html',
    'scripts/gallery-template.html',
  ]) {
    checkIdentityTemplate(templatePath, read(templatePath), isDevelopment);
  }

  const changelogMarker = `Development identity: \`v${version}\``;
  if (hasRealUnreleasedChanges && !unreleased.includes(changelogMarker)) {
    fail(`CHANGELOG.md Unreleased must declare ${changelogMarker}.`);
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`release identity: ${message}`);
  process.exit(1);
}

console.log(`release identity ok: ${version}`);
