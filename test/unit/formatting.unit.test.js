const { AccessibilityChecker } = require('../../src/index');

describe('AccessibilityChecker output formatting', () => {
  const sampleResults = [
    {
      file: 'test.html',
      autofixLog: ['Fixed alt text', 'Added <main> landmark'],
      violations: [
        {
          id: 'image-alt',
          impact: 'critical',
          description: 'Image missing alt',
          nodes: [{ target: ['img'] }],
        },
        {
          id: 'landmark-one-main',
          impact: 'moderate',
          description: 'Missing <main>',
          nodes: [{ target: ['body'] }],
        },
      ],
    },
    {
      file: 'other.html',
      autofixLog: [],
      violations: [],
    },
  ];

  let checker;
  beforeEach(() => {
    checker = new AccessibilityChecker();
  });

  it('formats autofix logs as table', () => {
    const out = checker.formatResults(sampleResults, 'table', true);
    expect(out).toMatch(/Autofix Logs/);
    expect(out).toMatch(/Fixed alt text/);
    expect(out).toMatch(/Added <main> landmark/);
    expect(out).toMatch(/No autofix actions performed/);
  });

  it('formats autofix logs as HTML', () => {
    const out = checker.formatResults(sampleResults, 'html', true);
    expect(out).toMatch(/<h1>🛠️  Autofix Logs<\/h1>/);
    expect(out).toMatch(/<li>Fixed alt text<\/li>/);
    expect(out).toMatch(/<li>Added <main> landmark<\/li>/);
    expect(out).toMatch(/<em>\(No autofix actions performed\)<\/em>/);
  });

  it('formats autofix logs as JSON', () => {
    const out = checker.formatResults(sampleResults, 'json', true);
    const parsed = JSON.parse(out);
    expect(parsed[0].file).toBe('test.html');
    expect(parsed[0].autofixLog).toContain('Fixed alt text');
    expect(parsed[1].autofixLog).toEqual([]);
  });

  it('formats full results as table', () => {
    const out = checker.formatResults(sampleResults, 'table', false);
    expect(out).toMatch(/test.html/);
    expect(out).toMatch(/image-alt/);
    expect(out).toMatch(/landmark-one-main/);
  });

  it('formats full results as HTML (stub)', () => {
    // TODO: Refactor formatAsHtml to output full details, then update this test
    const out = checker.formatResults(sampleResults, 'html', false);
    expect(out).toMatch(/<html>/);
    expect(out).toMatch(/Accessibility Results/);
  });

  it('formats full results as JSON', () => {
    const out = checker.formatResults(sampleResults, 'json', false);
    const parsed = JSON.parse(out);
    expect(parsed[0].file).toBe('test.html');
    expect(parsed[0].violations[0].id).toBe('image-alt');
  });
});
