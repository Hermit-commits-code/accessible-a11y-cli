const { AccessibilityChecker } = require('../src/index');
const path = require('path');

describe('AccessibilityChecker', () => {
  it('should report violations for HTML missing alt text', async () => {
    const checker = new AccessibilityChecker();
    const testFile = path.join(__dirname, 'test.html');
    const results = await checker.checkFiles([testFile]);
    expect(results[0].violations.length).toBeGreaterThan(0);
    const altViolation = results[0].violations.find(
      (v) => v.id === 'image-alt'
    );
    expect(altViolation).toBeDefined();
  });
});
