import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { findChrome, runVisualCheck } from '../bin/visual-check.mjs';
import { DESKTOP_READABILITY_VIEWPORT, DESKTOP_READER_MIN_WIDTH, DESKTOP_READER_DIAGRAM_WIDTH, DESKTOP_READER_HORIZONTAL_CHROME, MIN_PROJECTED_NODE_TEXT_PX } from '../renderers/shared/desktop-readability.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const chromePath = process.env.ARCHIFY_CHROME ? findChrome() : null;

test('production showcase is readable in the real 1440 by 900 adaptive reader', {
  skip: chromePath ? false : 'Set ARCHIFY_CHROME to run the real browser regression.',
}, async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-desktop-reader-'));
  const artifact = path.join(tmp, 'production-deployment.html');
  try {
    execFileSync(process.execPath, [
      path.join(skillRoot, 'bin', 'topolyn.mjs'),
      'render',
      'architecture',
      path.join(skillRoot, 'examples', 'production-deployment.architecture.json'),
      artifact,
      '--quality',
      'showcase',
    ], { cwd: skillRoot, encoding: 'utf8' });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await runVisualCheck({ artifactPath: artifact, chromePath });
      assert.equal(result.exitCode, 0, `attempt ${attempt}: ${JSON.stringify(result.receipt, null, 2)}`);
      assert.equal(result.receipt.readability.status, 'pass', `attempt ${attempt}: ${JSON.stringify(result.receipt, null, 2)}`);
      const desktop = result.receipt.readability.viewports.find(({ width, height }) => (
        width === DESKTOP_READABILITY_VIEWPORT.width && height === DESKTOP_READABILITY_VIEWPORT.height
      ));
      const darkDesktop = result.receipt.captures.screenshots.find(({ width, height, theme }) => (
        width === DESKTOP_READABILITY_VIEWPORT.width
        && height === DESKTOP_READABILITY_VIEWPORT.height
        && theme === 'dark'
      ));
      for (const observation of [desktop, darkDesktop]) {
        assert.ok(observation);
        // Font metrics and available height can expand the adaptive shell above its floor.
        assert.ok(observation.readerWidth >= DESKTOP_READER_MIN_WIDTH);
        assert.ok(observation.readerWidth <= DESKTOP_READABILITY_VIEWPORT.width);
        assert.ok(observation.diagramWidth >= DESKTOP_READER_DIAGRAM_WIDTH);
        assert.ok(Math.abs(observation.readerWidth - observation.diagramWidth - DESKTOP_READER_HORIZONTAL_CHROME) <= 1);
        assert.ok(observation.minimumProjectedNodeTextPx >= MIN_PROJECTED_NODE_TEXT_PX);
        assert.equal(observation.minimumProjectedNodeTextDetail, 'boundary');
        assert.equal(observation.minimumProjectedNodeText, 'AWS eu-west-1 / disaster recovery');
        assert.equal(observation.readabilityOk, true);
        assert.equal(observation.scrollHeight, DESKTOP_READABILITY_VIEWPORT.height);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
