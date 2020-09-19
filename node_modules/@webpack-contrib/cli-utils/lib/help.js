const chalk = require('chalk');
const strip = require('strip-ansi');
const table = require('text-table');

module.exports = {
  getHelp(flags = {}) {
    const rows = [];
    const options = {
      align: ['l', 'l', 'l'],
      stringLength(str) {
        return strip(str).length;
      },
    };

    for (const flagName of Object.keys(flags)) {
      const flag = flags[flagName];
      let { alias = '', desc } = flag;
      const { deprecated } = flag;

      if (alias) {
        alias = `, -${alias}`;
      }

      if (deprecated) {
        desc = chalk`{bold Deprecated.} Please use ${deprecated}.\n${desc}`;
      }

      const lines = desc.split('\n');
      const [description] = lines.splice(0, 1);

      rows.push([`  --${flagName}${alias}`, '', description]);

      if (lines.length > 0) {
        for (const line of lines) {
          rows.push(['', '', line]);
        }
      }
    }

    return table(rows, options);
  },
};
