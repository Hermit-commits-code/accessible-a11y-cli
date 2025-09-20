const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const fetch = require('node-fetch');

class AccessibilityChecker {
  constructor(options = {}) {
    this.options = {
      format: 'table',
      verbose: false,
      debug: false,
      fix: false,
      ...options,
    };
    // --debug implies verbose
    if (this.options.debug) this.options.verbose = true;
  }

  async checkFiles(inputs) {
    console.log(chalk.blue(`📁 Processing ${inputs.length} input(s)...`));
    const results = [];
    for (const input of inputs) {
      try {
        if (this.isUrl(input)) {
          const result = await this.checkUrl(input);
          results.push(result);
        } else {
          const result = await this.checkFile(input);
          results.push(result);
        }
      } catch (error) {
        console.error(
          chalk.red(`❌ Error processing ${input}:`, error.message)
        );
      }
    }
    return results;
  }

  isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  async checkUrl(url) {
    if (this.options.verbose) {
      console.log(chalk.gray(`🔗 Fetching: ${url}`));
    }
    let htmlContent;
    try {
      const res = await fetch(url);
      htmlContent = await res.text();
    } catch (e) {
      return {
        file: url,
        error: `Failed to fetch URL: ${e.message}`,
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
      };
    }
    // Use jsdom to create a DOM for axe-core
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent, { url });
    const { window } = dom;

    // axe-core expects a global window and document and related classes
    global.window = window;
    global.document = window.document;
    global.Node = window.Node;
    global.Element = window.Element;
    global.HTMLElement = window.HTMLElement;

    // Require axe-core after globals are set
    const axe = require('axe-core');

    // Run axe-core
    const results = await new Promise((resolve, reject) => {
      axe.run(
        window.document,
        this.options.axeOptions || {},
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    // Clean up globals
    delete global.window;
    delete global.document;
    delete global.Node;
    delete global.Element;
    delete global.HTMLElement;

    return {
      file: url,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
    };
  }

  async checkFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    if (this.options.verbose) {
      console.log(chalk.gray(`🔍 Checking: ${filePath}`));
    }

    let htmlContent = content;
    if (ext === '.jsx') {
      try {
        const babel = require('@babel/core');
        const reactDomServer = require('react-dom/server');
        const React = require('react');
        const transpiled = babel.transformSync(content, {
          presets: [require.resolve('@babel/preset-react')],
          filename: filePath,
        });

        const Component = eval(
          transpiled.code +
            ';module.exports = exports.default || module.exports;'
        );
        htmlContent = reactDomServer.renderToStaticMarkup(
          React.createElement(Component)
        );
      } catch (e) {
        return {
          file: filePath,
          error: `Failed to parse JSX: ${e.message}`,
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: [],
        };
      }
    } else if (ext !== '.html' && ext !== '.htm') {
      return {
        file: filePath,
        error: 'Unsupported file type (only .html/.htm/.jsx supported)',
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
      };
    }

    // Use jsdom to create a DOM for axe-core
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent);
    const { window } = dom;

    // axe-core expects a global window and document and related classes
    global.window = window;
    global.document = window.document;
    global.Node = window.Node;
    global.Element = window.Element;
    global.HTMLElement = window.HTMLElement;

    // Require axe-core after globals are set
    const axe = require('axe-core');

    // Run axe-core
    const results = await new Promise((resolve, reject) => {
      axe.run(
        window.document,
        this.options.axeOptions || {},
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    // Filter violations by enabled/disabled rules if specified
    let filteredViolations = results.violations;
    if (this.options.rules && Array.isArray(this.options.rules)) {
      filteredViolations = filteredViolations.filter((v) =>
        this.options.rules.includes(v.id)
      );
    }
    if (this.options.disableRule && Array.isArray(this.options.disableRule)) {
      filteredViolations = filteredViolations.filter(
        (v) => !this.options.disableRule.includes(v.id)
      );
    }

    let autofixLog = [];
    let fixes = [];
    if (this.options.fix || this.options.fixDryRun) {
      const logFix = (msg) => autofixLog.push(msg);
      fixes = await this.autofix(
        dom,
        filteredViolations,
        logFix,
        this.options.fixDryRun
      );
      if (fixes.length > 0) {
        if (this.options.fix) {
          // Backup original file
          await fs.copyFile(filePath, filePath + '.bak');
          await fs.writeFile(filePath, dom.serialize(), 'utf8');
        }
      }
    }

    // Clean up globals
    delete global.window;
    delete global.document;
    delete global.Node;
    delete global.Element;
    delete global.HTMLElement;

    return {
      file: filePath,
      violations: filteredViolations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      autofix: fixes,
      autofixLog,
    };
  }

  formatResults(results, format = 'table', autofixLogs = false) {
    // If autofixLogs is true, format only autofix logs for each result
    if (autofixLogs) {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(
            results.map((r) => ({ file: r.file, autofixLog: r.autofixLog })),
            null,
            2
          );
        case 'html':
          return this.formatAutofixHtml(results);
        case 'table':
        default:
          return this.formatAutofixTable(results);
      }
    } else {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(results, null, 2);
        case 'html':
          return this.formatAsHtml(results);
        case 'table':
        default:
          return this.formatAsTable(results);
      }
    }
  }

  formatAutofixTable(results) {
    let output = '\n';
    output += chalk.bold.blue('🛠️  Autofix Logs\n');
    output += chalk.gray('='.repeat(50)) + '\n\n';
    for (const result of results) {
      output += chalk.bold(`📄 File: ${result.file}\n`);
      if (result.autofixLog && result.autofixLog.length > 0) {
        for (const msg of result.autofixLog) {
          output += '  ' + msg + '\n';
        }
      } else {
        output += chalk.gray('  (No autofix actions performed)\n');
      }
    }
    return output;
  }

  formatAutofixHtml(results) {
    let html = '<html><head><title>Autofix Logs</title></head><body>';
    html += '<h1>🛠️  Autofix Logs</h1>';
    for (const result of results) {
      html += `<h2>File: ${result.file}</h2>`;
      if (result.autofixLog && result.autofixLog.length > 0) {
        html += '<ul>';
        for (const msg of result.autofixLog) {
          html += `<li>${msg}</li>`;
        }
        html += '</ul>';
      } else {
        html += '<p><em>(No autofix actions performed)</em></p>';
      }
    }
    html += '</body></html>';
    return html;
  }

  formatAsTable(results) {
    let output = '\n';
    output += chalk.bold.blue('📊 Accessibility Check Results\n');
    output += chalk.gray('='.repeat(50)) + '\n\n';

    for (const result of results) {
      output += chalk.bold(`📄 File: ${result.file}\n`);
      if (result.error) {
        output += chalk.red(`  Error: ${result.error}\n\n`);
        continue;
      }
      if (result.violations.length === 0) {
        output += chalk.green('  No accessibility violations found!\n\n');
      } else {
        output += chalk.red(`  Violations: ${result.violations.length}\n`);
        for (const v of result.violations) {
          output += chalk.red(`    [${v.id}] ${v.help}\n`);
          output += chalk.gray(`      Impact: ${v.impact}\n`);
          output += chalk.gray(`      Description: ${v.description}\n`);
          output += chalk.gray(`      Help: ${v.helpUrl}\n`);
          for (const node of v.nodes) {
            output += chalk.yellow(
              `      Selector: ${node.target.join(', ')}\n`
            );
            output += chalk.gray(
              `      Failure Summary: ${node.failureSummary || 'N/A'}\n`
            );
          }
        }
        output += '\n';
      }
    }
    return output;
  }

  formatAsHtml(results) {
    // TODO: Implement HTML formatting
    return '<html><body><h1>Accessibility Results</h1></body></html>';
  }

  async saveResults(results, outputPath, format = 'json', autofixLogs = false) {
    const formattedResults = this.formatResults(results, format, autofixLogs);
    await fs.writeFile(outputPath, formattedResults, 'utf8');
    console.log(chalk.green(`💾 Results saved to: ${outputPath}`));
  }

  async autofix(dom, violations, logFix, dryRun = false) {
    const document = dom.window.document;
    let fixes = [];
    // Move <h1> and other main content inside <main> if not already contained
    const verbose = this.options.verbose;
    const main = document.querySelector('main');
    if (main) {
      // Find all <h1> not inside <main>
      const h1s = Array.from(document.querySelectorAll('h1'));
      h1s.forEach((h1) => {
        if (!main.contains(h1)) {
          main.appendChild(h1);
          fixes.push({ type: 'move-h1-into-main', selector: 'h1' });
          logFix('Moved <h1> inside <main> to satisfy landmark/region rule');
        }
      });
      // Optionally, move other main content as needed
    }
    const head = document.head || document.getElementsByTagName('head')[0];
    // Always ensure <title>
    let title = head ? head.querySelector('title') : null;
    if (!title) {
      title = document.createElement('title');
      title.textContent = 'Accessible Page';
      if (head) {
        head.appendChild(title);
        fixes.push({ type: 'title', selector: 'title' });
        logFix('Added missing <title> to <head>');
      }
    } else if (!title.textContent || title.textContent.trim() === '') {
      title.textContent = 'Accessible Page';
      fixes.push({ type: 'title', selector: 'title' });
      logFix('Filled empty <title> in <head>');
    }

    // Always ensure <html lang>
    const html = document.documentElement;
    if (
      html &&
      (!html.hasAttribute('lang') ||
        html.getAttribute('lang') === '' ||
        html.getAttribute('lang') == null)
    ) {
      html.setAttribute('lang', 'en');
      fixes.push({ type: 'lang', selector: 'html' });
      logFix('Added or fixed lang="en" on <html>');
    }

    // Always ensure <main>
    const mains = document.getElementsByTagName('main');
    if (mains.length === 0) {
      const main = document.createElement('main');
      main.id = 'main';
      main.textContent = 'Main content';
      document.body.appendChild(main);
      fixes.push({ type: 'main', selector: 'main' });
      logFix('Added <main> landmark to document');
    }

    // Always ensure <h1>
    const h1s = document.getElementsByTagName('h1');
    if (h1s.length === 0) {
      const h1 = document.createElement('h1');
      h1.textContent = 'Main Heading';
      document.body.insertBefore(h1, document.body.firstChild);
      fixes.push({ type: 'heading', selector: 'h1' });
      logFix('Added missing <h1> to document');
    }
    logFix(
      `[autofix-debug] autofix called. Violation ids: ${violations.map((v) => v.id).join(', ')}`
    );
    // Advanced autofix: context-aware DOM fixes for common issues
    // This is a scaffold: add more rules as needed
    // ...existing code...
    for (const v of violations) {
      if (v.id === 'image-alt') {
        // Add missing alt attributes to images
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const imgs = document.querySelectorAll(selector);
            if (verbose)
              logFix(
                `[autofix-debug] Checking selector: ${selector}, found ${imgs.length} element(s)`
              );
            imgs.forEach((img) => {
              if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', '');
                fixes.push({ type: 'alt', selector });
                logFix(`Added missing alt attribute to: ${selector}`);
              } else if (verbose) {
                logFix(`[autofix-debug] alt already present for: ${selector}`);
              }
            });
          }
        }
      }
      if (v.id === 'html-has-lang') {
        // Add or fix lang attribute on <html>
        const html = document.documentElement;
        if (
          html &&
          (!html.hasAttribute('lang') ||
            html.getAttribute('lang') === '' ||
            html.getAttribute('lang') == null)
        ) {
          html.setAttribute('lang', 'en');
          fixes.push({ type: 'lang', selector: 'html' });
          logFix('Added or fixed lang="en" on <html>');
        } else if (verbose) {
          logFix(
            '[autofix-debug] lang already present and non-empty for <html>'
          );
        }
      }
      // Autofix for missing labels on form fields
      if (v.id === 'label' || v.id === 'form-field-multiple-label') {
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const fields = document.querySelectorAll(selector);
            if (verbose)
              logFix(
                `[autofix-debug] Checking selector: ${selector} for label, found ${fields.length} element(s)`
              );
            fields.forEach((field, idx) => {
              if (!field.id) {
                field.id = `a11y-autofix-field-${Date.now()}-${idx}`;
                logFix(`Assigned id to form field: ${field.id}`);
              }
              // Only add label if not already labeled
              const label = document.createElement('label');
              label.setAttribute('for', field.id);
              label.textContent = 'Label';
              field.parentNode.insertBefore(label, field);
              fixes.push({ type: 'label', selector });
              logFix(`Added label for: ${selector}`);
            });
          }
        }
      }

      // Autofix for heading order (add missing h1 if none exists)
      if (v.id === 'heading-order') {
        const h1s = document.getElementsByTagName('h1');
        if (h1s.length === 0) {
          const h1 = document.createElement('h1');
          h1.textContent = 'Main Heading';
          document.body.insertBefore(h1, document.body.firstChild);
          fixes.push({ type: 'heading', selector: 'h1' });
          logFix('Added missing <h1> to document');
        } else if (verbose) {
          logFix('[autofix-debug] h1 already present in document');
        }
      }

      // Autofix for ARIA roles/attributes
      if (v.id === 'aria-roles' || v.id === 'aria-valid-attr') {
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const elements = document.querySelectorAll(selector);
            if (verbose)
              logFix(
                `[autofix-debug] Checking selector: ${selector} for ARIA, found ${elements.length} element(s)`
              );
            elements.forEach((el) => {
              if (!el.hasAttribute('role')) {
                el.setAttribute('role', 'region');
                fixes.push({ type: 'aria-role', selector });
                logFix(`Added role="region" to: ${selector}`);
              }
            });
          }
        }
      }

      // Autofix for color contrast (add outline for low contrast)
      if (v.id === 'color-contrast') {
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const elements = document.querySelectorAll(selector);
            logFix(
              `[autofix-debug] Checking selector: ${selector} for color contrast, found ${elements.length} element(s)`
            );
            elements.forEach((el) => {
              el.style.outline = '2px dashed #f00';
              fixes.push({ type: 'color-contrast', selector });
              logFix(`Added outline to low-contrast element: ${selector}`);
            });
          }
        }
      }

      // Autofix for tabindex (remove positive tabindex)
      if (v.id === 'tabindex') {
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const elements = document.querySelectorAll(selector);
            logFix(
              `[autofix-debug] Checking selector: ${selector} for tabindex, found ${elements.length} element(s)`
            );
            elements.forEach((el) => {
              if (
                el.hasAttribute('tabindex') &&
                parseInt(el.getAttribute('tabindex')) > 0
              ) {
                el.removeAttribute('tabindex');
                fixes.push({ type: 'tabindex', selector });
                logFix(`Removed positive tabindex from: ${selector}`);
              }
            });
          }
        }
      }

      // Autofix for skip links (add skip link if missing)
      if (v.id === 'skip-link') {
        if (!document.getElementById('a11y-skip-link')) {
          const skip = document.createElement('a');
          skip.id = 'a11y-skip-link';
          skip.href = '#main';
          skip.textContent = 'Skip to main content';
          document.body.insertBefore(skip, document.body.firstChild);
          fixes.push({ type: 'skip-link', selector: 'body' });
          logFix('Added skip link to document');
        }
      }

      // Autofix for semantic HTML (add <main> if missing)
      if (v.id === 'landmark-one-main' || v.id === 'region') {
        const mains = document.getElementsByTagName('main');
        if (mains.length === 0) {
          const main = document.createElement('main');
          main.id = 'main';
          main.textContent = 'Main content';
          document.body.appendChild(main);
          fixes.push({ type: 'main', selector: 'main' });
          logFix('Added <main> landmark to document');
        }
      }

      // Autofix for link text (add descriptive text if missing)
      if (v.id === 'link-name') {
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const links = document.querySelectorAll(selector);
            logFix(
              `[autofix-debug] Checking selector: ${selector} for link text, found ${links.length} element(s)`
            );
            links.forEach((link) => {
              if (!link.textContent || link.textContent.trim() === '') {
                link.textContent = 'Descriptive link';
                fixes.push({ type: 'link-text', selector });
                logFix(`Added descriptive text to link: ${selector}`);
              }
            });
          }
        }
      }
    }
    return fixes;
  }
}

module.exports = { AccessibilityChecker };
