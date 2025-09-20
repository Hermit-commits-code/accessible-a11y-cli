const fs = require('fs').promises;
const path = require('path');
const { Chalk } = require('chalk');
const chalk = new Chalk();
const fetch = require('node-fetch');

class AccessibilityChecker {
  constructor(options = {}) {
    this.options = {
      format: 'table',
      verbose: false,
      fix: false,
      ...options,
    };
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

    let autofixLog = [];
    let fixes = [];
    if (this.options.fix || this.options.fixDryRun) {
      const logFix = (msg) => autofixLog.push(msg);
      fixes = await this.autofix(
        dom,
        results.violations,
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
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      autofix: fixes,
      autofixLog,
    };
  }

  formatResults(results, format = 'table') {
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

  async saveResults(results, outputPath, format = 'json') {
    const formattedResults = this.formatResults(results, format);
    await fs.writeFile(outputPath, formattedResults, 'utf8');
    console.log(chalk.green(`💾 Results saved to: ${outputPath}`));
  }

  async autofix(dom, violations, logFix, dryRun = false) {
    logFix(
      `[autofix-debug] autofix called. Violation ids: ${violations.map((v) => v.id).join(', ')}`
    );
    // Advanced autofix: context-aware DOM fixes for common issues
    // This is a scaffold: add more rules as needed
    let fixes = [];
    const { document } = dom.window;
    for (const v of violations) {
      if (v.id === 'image-alt') {
        // Add missing alt attributes to images
        for (const node of v.nodes) {
          for (const selector of node.target) {
            const imgs = document.querySelectorAll(selector);
            logFix(
              `[autofix-debug] Checking selector: ${selector}, found ${imgs.length} element(s)`
            );
            imgs.forEach((img) => {
              if (!img.hasAttribute('alt')) {
                img.setAttribute('alt', '');
                fixes.push({ type: 'alt', selector });
                logFix(`Added missing alt attribute to: ${selector}`);
              } else {
                logFix(`[autofix-debug] alt already present for: ${selector}`);
              }
            });
          }
        }
      }
      if (v.id === 'html-has-lang') {
        // Add lang attribute to <html>
        const html = document.documentElement;
        if (html && !html.hasAttribute('lang')) {
          html.setAttribute('lang', 'en');
          fixes.push({ type: 'lang', selector: 'html' });
          logFix('Added lang="en" to <html>');
        } else {
          logFix('[autofix-debug] lang already present for <html>');
        }
      }
      // Add more advanced autofix rules here (labels, headings, ARIA, etc.)
    }
    return fixes;
  }
}

module.exports = { AccessibilityChecker };
