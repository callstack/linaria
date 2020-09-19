const chalk = require('chalk');
const camel = require('camelize');
const decamel = require('decamelize');
const meant = require('meant');
const strip = require('strip-ansi');
const table = require('text-table');
const weblog = require('webpack-log');

module.exports = {
  // eslint-disable-next-line consistent-return
  validateFlag(flag, value) {
    const { type: types } = flag;
    let result = false;

    if (!value || !types) {
      return true;
    }

    for (const type of [].concat(types)) {
      if (result !== true) {
        if (type === 'array') {
          result = Array.isArray(value);
        } else {
          // eslint-disable-next-line valid-typeof
          result = typeof value === type;
        }
      }
    }

    return result;
  },

  validate(opts) {
    const defaults = { throw: true };
    const options = Object.assign({}, defaults, opts);
    const errors = [];
    const { argv, flags, prefix = 'webpack' } = options;
    const log = weblog({ name: prefix, id: `${prefix}-cli-util` });
    const names = Object.keys(flags);
    const tableOptions = {
      align: ['', 'l', 'l'],
      stringLength(str) {
        return strip(str).length;
      },
    };
    const aliases = names
      .map((name) => flags[name].alias)
      .filter((alias) => !!alias);
    const uniqueArgs = new Set(
      Object.keys(argv)
        .map((arg) => decamel(arg, '-'))
        .filter((arg) => !aliases.includes(arg))
    );
    const unknown = [];
    const { validateFlag } = module.exports;

    for (const unique of uniqueArgs) {
      if (!names.includes(unique)) {
        const [suggestion] = meant(unique, names);
        let help = 'Not sure what you mean there';

        /* istanbul ignore else */
        if (suggestion) {
          help = chalk`Did you mean {bold --${suggestion}}?`;
        }

        unknown.push(['', chalk.blue(`--${unique}`), help]);
      }
    }

    for (const name of names) {
      const flag = flags[name];
      const value = argv[camel(name)];

      // eslint-disable-next-line valid-typeof
      if (!validateFlag(flag, value)) {
        errors.push([
          '',
          chalk.blue(`--${name}`),
          chalk`must be set to a {bold ${flag.type}}`,
        ]);
      }
    }

    if (errors.length) {
      const pre = 'Flags were specified with invalid values:';
      const post = 'Please check the command executed.';
      const out = `${pre}\n\n${table(errors, tableOptions)}\n\n${post}`;

      /* istanbul ignore else */
      if (options.throw) {
        throw new Error(out);
      } else {
        log.error(out);
      }
    }

    if (unknown.length) {
      /* istanbul ignore if */
      if (errors.length && !options.throw) {
        console.log(''); // eslint-disable-line no-console
      }

      const pre = `Flags were specified that were not recognized:`;
      const post = 'Please check the command executed.';
      const out = `${pre}\n\n${table(unknown, tableOptions)}\n\n${post}`;

      /* istanbul ignore if */
      if (options.throw) {
        throw new Error(out);
      } else {
        log.error(out);
      }
    }

    if (errors.length || unknown.length) {
      return false;
    }

    return true;
  },
};
