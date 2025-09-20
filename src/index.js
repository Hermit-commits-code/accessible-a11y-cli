const axe = require("axe-core");
const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

class AccessibilityChecker {
  constructor(options = {}) {
    this.options = {
      format: "table",
      verbose: false,
      fix: false,
      ...options,
    };
  }

  async checkFiles(filePaths) {
    console.log(chalk.blue(`📁 Processing ${filePaths.length} file(s)...`));

    const results = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.checkFile(filePath);
        results.push(result);
      } catch (error) {
        console.error(
          chalk.red(`❌ Error processing ${filePath}:`, error.message)
        );
      }
    }

    return results;
  }

  async checkFile(filePath) {
    const content = await fs.readFile(filePath, "utf8");
    const ext = path.extname(filePath).toLowerCase();

    if (this.options.verbose) {
      console.log(chalk.gray(`🔍 Checking: ${filePath}`));
    }

    // Only process HTML files for now
    if (ext !== ".html" && ext !== ".htm") {
      return {
        file: filePath,
        error: "Unsupported file type (only .html/.htm supported)",
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
      };
    }

    // Use jsdom to create a DOM for axe-core
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM(content);
    const { window } = dom;

    // axe-core expects a global window and document
    global.window = window;
    global.document = window.document;

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

    return {
      file: filePath,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
    };
  }

  formatResults(results, format = "table") {
    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(results, null, 2);
      case "html":
        return this.formatAsHtml(results);
      case "table":
      default:
        return this.formatAsTable(results);
    }
  }

  formatAsTable(results) {
    let output = "\n";
    output += chalk.bold.blue("📊 Accessibility Check Results\n");
    output += chalk.gray("=" * 50) + "\n\n";

    for (const result of results) {
      output += chalk.bold(`📄 File: ${result.file}\n`);
      output += chalk.green(`✅ Passes: ${result.passes.length}\n`);
      output += chalk.red(`❌ Violations: ${result.violations.length}\n`);
      output += chalk.yellow(`⚠️  Incomplete: ${result.incomplete.length}\n`);
      output += chalk.gray(
        `ℹ️  Not applicable: ${result.inapplicable.length}\n`
      );
      output += "\n";
    }

    return output;
  }

  formatAsHtml(results) {
    // TODO: Implement HTML formatting
    return "<html><body><h1>Accessibility Results</h1></body></html>";
  }

  async saveResults(results, outputPath, format = "json") {
    const formattedResults = this.formatResults(results, format);
    await fs.writeFile(outputPath, formattedResults, "utf8");
    console.log(chalk.green(`💾 Results saved to: ${outputPath}`));
  }
}

module.exports = { AccessibilityChecker };
