const { JSDOM } = require('jsdom');
const { AccessibilityChecker } = require('../src/index');

describe('AccessibilityChecker.autofix (unit)', () => {
  function runAutofix({ html, violations }) {
    const dom = new JSDOM(html);
    const checker = new AccessibilityChecker();
    const log = [];
    return checker
      .autofix(dom, violations, (msg) => log.push(msg))
      .then(() => ({
        html: dom.serialize(),
        log,
      }));
  }

  it('adds missing alt to <img>', async () => {
    const html = '<img src="foo.png">';
    const violations = [{ id: 'image-alt', nodes: [{ target: ['img'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/alt=""/);
  });

  it('adds or fixes lang on <html>', async () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>';
    const violations = [{ id: 'html-has-lang', nodes: [{ target: ['html'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/lang="en"/);
  });

  it('adds label for input', async () => {
    const html = '<form><input type="text"></form>';
    const violations = [{ id: 'label', nodes: [{ target: ['input'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/<label/);
  });

  it('adds <h1> if missing for heading-order', async () => {
    const html = '<body><h2>Subheading</h2><h3>Another</h3></body>';
    const violations = [{ id: 'heading-order', nodes: [] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/<h1>/);
  });

  it('adds ARIA role if missing', async () => {
    const html = '<section></section>';
    const violations = [{ id: 'aria-roles', nodes: [{ target: ['section'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/role="region"/);
  });

  it('adds outline for low color contrast', async () => {
    const html = '<span style="color:#fff;background:#fff">Text</span>';
    const violations = [
      { id: 'color-contrast', nodes: [{ target: ['span'] }] },
    ];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/outline:/);
  });

  it('removes positive tabindex', async () => {
    const html = '<button tabindex="2">Btn</button>';
    const violations = [{ id: 'tabindex', nodes: [{ target: ['button'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).not.toMatch(/tabindex/);
  });

  it('adds skip link if missing', async () => {
    const html = '<body><main id="main"></main></body>';
    const violations = [{ id: 'skip-link', nodes: [] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/Skip to main content/);
  });

  it('adds <main> landmark if missing', async () => {
    const html = '<body><div>Content</div></body>';
    const violations = [{ id: 'landmark-one-main', nodes: [] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/<main/);
  });

  it('adds descriptive text to empty link', async () => {
    const html = '<a href="#"></a>';
    const violations = [{ id: 'link-name', nodes: [{ target: ['a'] }] }];
    const { html: out } = await runAutofix({ html, violations });
    expect(out).toMatch(/Descriptive link/);
  });
});
