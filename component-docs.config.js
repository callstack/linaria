const path = require('path');

module.exports = {
  port: 3031,
  assets: [path.resolve(__dirname, 'website/assets')],
  logo: '/assets/linaria-logo-colored.svg',
  /* prettier-ignore */
  pages: [
    { type: 'mdx', file: path.resolve(__dirname, 'docs/00.HOME.mdx') },
    { type: 'md', file: path.resolve(__dirname, 'docs/01.GET_STARTED.md') },
    { type: 'md', file: path.resolve(__dirname, 'docs/02.BASICS.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/03.BENEFITS.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/04.API.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/05.CONFIGURATION.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/06.CLI.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/07.BUNDLERS_INTEGRATION.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/08.LINTING.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/09.CRITICAL_CSS.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/10.DYNAMIC_STYLES.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/11.THEMING.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/12.HOW_IT_WORKS.md')},
    { type: 'md', file: path.resolve(__dirname, 'docs/13.2.0_MIGRATION_GUIDE.md')},
  ]
};
