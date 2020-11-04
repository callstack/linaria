const path = require('path');

// pages structure and order
const pages = [
  'docs/HOME.mdx',
  'docs/GET_STARTED.md',
  'docs/BASICS.md',
  'docs/BENEFITS.md',
  '---',
  'docs/API.md',
  'docs/CONFIGURATION.md',
  'docs/CLI.md',
  'docs/BUNDLERS_INTEGRATION.md',
  'docs/LINTING.md',
  'docs/CRITICAL_CSS.md',
  'docs/DYNAMIC_STYLES.md',
  'docs/THEMING.md',
  'docs/HOW_IT_WORKS.md',
  '---',
  'docs/2.0_MIGRATION_GUIDE.md',
];

const extMap = {
  md: 'md',
  mdx: 'mdx',
  js: 'component',
};

module.exports = {
  port: 3031,
  root: path.resolve(__dirname),
  assets: ['website/assets'],
  logo: '/assets/linaria-logo-colored.svg',
  output: 'docs-public',
  pages: pages.map((page) => {
    if (page === '---') return { type: 'separator' };

    return {
      type: extMap[path.extname(page).substr(1)],
      file: path.resolve(__dirname, page),
    };
  }),
  title: '[title] - Linaria Documentation',
};
