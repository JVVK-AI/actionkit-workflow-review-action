'use strict';
const assert = require('node:assert/strict');
const { envInput, review, markdown } = require('./dist/index.js');
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
console.log('review-action tests passed');
