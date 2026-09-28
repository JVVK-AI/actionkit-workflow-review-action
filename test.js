'use strict';
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { envInput, review, markdown, publishResult } = require('./dist/index.js');
const sample = `name: CI
on: [push]
permissions: write-all
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - run: npm install
`;
const findings = review(sample);
process.env['INPUT_WORKFLOW-PATH'] = 'fixture.yml';
assert.equal(envInput('workflow-path', 'fallback.yml'), 'fixture.yml');
delete process.env['INPUT_WORKFLOW-PATH'];
assert.equal(findings.length, 5);
assert.match(markdown('ci.yml', findings), /write-all/);
assert.match(markdown('ci.yml', findings), /npm ci/);
assert.match(markdown('ci.yml', findings), /ActionKit workflow review/);
const resultDir = mkdtempSync(join(tmpdir(), 'actionkit-result-'));
process.env.GITHUB_STEP_SUMMARY = join(resultDir, 'summary.md');
process.env.GITHUB_OUTPUT = join(resultDir, 'output.txt');
publishResult(markdown('ci.yml', findings), findings.length);
assert.match(readFileSync(process.env.GITHUB_STEP_SUMMARY, 'utf8'), /ActionKit workflow review/);
assert.equal(readFileSync(process.env.GITHUB_OUTPUT, 'utf8'), `finding-count=${findings.length}\n`);
delete process.env.GITHUB_STEP_SUMMARY;
delete process.env.GITHUB_OUTPUT;
console.log('review-action tests passed');
