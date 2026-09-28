'use strict';

const fs = require('node:fs');
const path = require('node:path');

function envInput(name, fallback) {
  const rawName = name.replace(/ /g, '_').toUpperCase();
  const normalizedName = rawName.replace(/-/g, '_');
  return process.env[`INPUT_${rawName}`] || process.env[`INPUT_${normalizedName}`] || fallback;
}

function finding(level, message, line) {
  return { level, message, line };
}

function review(text) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  const hasRootConcurrency = /^concurrency\s*:/m.test(text);
  let inJobs = false;
  let currentJob = null;
  let currentJobLine = null;
  let jobHasTimeout = false;
  let jobHasConcurrency = false;

  function finishJob() {
    if (currentJob && !jobHasTimeout) findings.push(finding('review', `Job \`${currentJob}\` has no timeout-minutes.`, currentJobLine));
    if (currentJob && !hasRootConcurrency && !jobHasConcurrency) findings.push(finding('review', `Job \`${currentJob}\` has no concurrency key.`, currentJobLine));
  }

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    if (/^jobs\s*:/.test(line)) { inJobs = true; return; }
    if (inJobs && /^\S/.test(line) && !/^jobs\s*:/.test(line)) { finishJob(); inJobs = false; currentJob = null; }
    if (inJobs) {
      const job = line.match(/^  ([A-Za-z0-9_-]+)\s*:/);
      if (job) { finishJob(); currentJob = job[1]; currentJobLine = lineNo; jobHasTimeout = false; jobHasConcurrency = false; }
      if (currentJob && /^    timeout-minutes\s*:/.test(line)) jobHasTimeout = true;
      if (currentJob && /^    concurrency\s*:/.test(line)) jobHasConcurrency = true;
    }
    if (/^permissions\s*:\s*write-all\s*$/.test(line)) findings.push(finding('review', 'Top-level permissions are write-all; scope them to the minimum needed.', lineNo));
    if (/^\s+permissions\s*:\s*write-all\s*$/.test(line)) findings.push(finding('review', 'A job uses permissions: write-all; scope it to the minimum needed.', lineNo));
    const uses = line.match(/uses:\s*([^\s#]+)/);
    if (uses && /@(?:main|master|latest)$/.test(uses[1])) findings.push(finding('review', `Action reference \`${uses[1]}\` floats on a moving branch or tag.`, lineNo));
    if (/^\s*(?:-\s*)?run:\s*npm install\b/.test(line)) findings.push(finding('review', 'Use npm ci when a lockfile is present for a reproducible install.', lineNo));
  });
  finishJob();
  return findings;
}

function markdown(source, findings) {
  const rows = findings.length
    ? findings.map((item) => `| ${item.level} | ${item.line} | ${item.message} |`).join('\n')
    : '| info | — | No configured review prompts matched. |';
  return `# ActionKit workflow review\n\nSource: \`${source}\`\n\n| Level | Line | Review prompt |\n| --- | ---: | --- |\n${rows}\n\nThis report is a static review aid. It is not a security audit or deployment approval.\n`;
}

function main() {
  const workflowPath = envInput('workflow-path', '.github/workflows/ci.yml');
  const reportPath = envInput('report-path', 'actionkit-workflow-review.md');
  if (!fs.existsSync(workflowPath)) throw new Error(`Workflow file not found: ${workflowPath}`);
  const findings = review(fs.readFileSync(workflowPath, 'utf8'));
  const target = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, markdown(workflowPath, findings));
  console.log(`ActionKit reviewed ${workflowPath}: ${findings.length} prompt(s). Report: ${reportPath}`);
}

module.exports = { envInput, review, markdown, main };
if (require.main === module) main();
