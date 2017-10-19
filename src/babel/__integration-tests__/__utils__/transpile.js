const babel = require('babel-core');
const path = require('path');
const dedent = require('dedent');

const CSS_PATH = require.resolve(path.join(process.cwd(), 'build/css'));
const SHEET_PATH = require.resolve(path.join(process.cwd(), 'build/sheet'));
const PREVAL_PLUGIN_PATH = require.resolve(
  path.join(process.cwd(), 'build/babel/preval-extract')
);
const MODULE_SYSTEM_PATH = require.resolve(
  path.join(process.cwd(), 'build/babel/lib/moduleSystem')
);

function transpile(source, options = { pluginOptions: {}, babelOptions: {} }) {
  return babel.transform(
    dedent`
      import css from '${CSS_PATH}';

      ${source}
    `,
    Object.assign(
      {
        presets: ['env', 'stage-2', 'react'],
        plugins: [[PREVAL_PLUGIN_PATH, options.pluginOptions]],
        sourceMaps: false,
      },
      options.babelOptions
    )
  ).code;
}

module.exports = transpile;

if (require.main && module.filename === require.main.filename) {
  const code = transpile(
    JSON.parse(process.argv[2]),
    JSON.parse(process.argv[3])
  );

  if (code) {
    console.log(JSON.stringify(code));

    // eslint-disable-next-line global-require
    const getCachedModule = require(MODULE_SYSTEM_PATH).getCachedModule;
    const sheet = getCachedModule(SHEET_PATH);
    const styles = sheet
      ? getCachedModule(SHEET_PATH).exports.default.styles()
      : {};
    console.log(JSON.stringify(styles || ''));
  }
}
