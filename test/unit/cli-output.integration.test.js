const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('CLI integration: output/logging', () => {
  const cli = 'node bin/index.js check';
  const testFile = 'test/unit/autofix-robust.html';
  const outputs = [
    'cli-out-table.txt',
    'cli-out-json.json',
    'cli-out-html.html',
    'cli-autofix-log-table.txt',
    'cli-autofix-log-json.json',
    'cli-autofix-log-html.html',
  ];

  afterAll(() => {
    // Clean up output files
    outputs.forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('outputs results as table', () => {
    execSync(`${cli} --format table --output cli-out-table.txt ${testFile}`);
    const out = fs.readFileSync('cli-out-table.txt', 'utf8');
    expect(out).toMatch(/Accessibility Check Results/);
    expect(out).toMatch(/autofix-robust.html/);
  });

  it('outputs results as JSON', () => {
    execSync(`${cli} --format json --output cli-out-json.json ${testFile}`);
    const out = fs.readFileSync('cli-out-json.json', 'utf8');
    const parsed = JSON.parse(out);
    expect(parsed[0].file).toMatch(/autofix-robust.html/);
    expect(parsed[0].violations.length).toBeGreaterThan(0);
  });

  it('outputs results as HTML', () => {
    execSync(`${cli} --format html --output cli-out-html.html ${testFile}`);
    const out = fs.readFileSync('cli-out-html.html', 'utf8');
    expect(out).toMatch(/<html>/);
    expect(out).toMatch(/Accessibility Results/);
  });

  it('outputs autofix log as table', () => {
    execSync(
      `${cli} --fix --format table --output cli-autofix-log-table.txt --verbose ${testFile}`
    );
    const out = fs.readFileSync('cli-autofix-log-table.txt', 'utf8');
    expect(out).toMatch(/Autofix Logs/);
    expect(out).toMatch(/autofix-robust.html/);
  });

  it('outputs autofix log as JSON', () => {
    execSync(
      `${cli} --fix --format json --output cli-autofix-log-json.json --verbose ${testFile}`
    );
    const out = fs.readFileSync('cli-autofix-log-json.json', 'utf8');
    const parsed = JSON.parse(out);
    expect(parsed[0].file).toMatch(/autofix-robust.html/);
    expect(Array.isArray(parsed[0].autofixLog)).toBe(true);
  });

  it('outputs autofix log as HTML', () => {
    execSync(
      `${cli} --fix --format html --output cli-autofix-log-html.html --verbose ${testFile}`
    );
    const out = fs.readFileSync('cli-autofix-log-html.html', 'utf8');
    expect(out).toMatch(/<h1>🛠️  Autofix Logs<\/h1>/);
    expect(out).toMatch(/autofix-robust.html/);
  });
});
