#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicGuideData } from '../topolyn/recipes/scenarios.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.resolve(process.argv[2] || path.join(repoRoot, 'docs/assets/topolyn-scenarios.js'));
const serialized = JSON.stringify(publicGuideData())
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `window.TopolynScenarios=${serialized};\n`);
console.log(`Built ${outputPath} with ${publicGuideData().length} scenarios.`);
