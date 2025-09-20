# accessible-a11y-cli

![npm version](https://img.shields.io/npm/v/accessible-a11y-cli?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Hermit-commits-code/accessible-a11y-cli/ci.yml?branch=main&style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

> **A fast, user-friendly CLI for automated accessibility testing of HTML and JSX files using axe-core.**

---

## 🚀 Vision

`accessible-a11y-cli` aims to make accessibility testing simple, fast, and part of every developer's workflow. By leveraging [axe-core](https://github.com/dequelabs/axe-core), this tool helps you catch and fix accessibility issues early, ensuring your web projects are usable by everyone.

## 📦 Installation

```bash
npm install -g accessible-a11y-cli
```

## 🛠️ Usage

Run accessibility checks on one or more HTML/JSX files:

```bash
a11y-check check path/to/file.html path/to/other.jsx
```

### Options

- `-f, --format <type>` Output format: `table` (default), `json`, or `html`
- `-o, --output <file>` Save results to a file
- `--fix` Attempt to auto-fix common issues
- `--verbose` Verbose output

### Example

```bash
a11y-check check src/**/*.html --format json --output results.json
```

## 🗺️ Roadmap

- [x] CLI scaffold and project setup
- [x] Integrate axe-core for accessibility checks
- [ ] Parse HTML/JSX and report issues in readable format
- [ ] Support CLI flags: format, fix, output
- [ ] Add autofix for common issues
- [ ] Markdown/code output support
- [ ] CI/CD integration and npm release
- [ ] Collect feedback and iterate

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for bugs, features, or improvements.

1. Fork the repo and create your branch
2. Run `npm install` to set up dependencies
3. Add tests for new features
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
5. Open a pull request and describe your changes

## 📄 License

MIT © Hermit-commits-code

---

_This project is not affiliated with Deque Systems. "axe-core" is a trademark of Deque Systems, Inc._
