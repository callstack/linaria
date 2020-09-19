const { getHelp } = require('./help');
const { validate } = require('./validate');

module.exports = {
  getHelp,
  validate,

  getOpts(flags = {}) {
    const result = {};

    for (const key of Object.keys(flags)) {
      const flag = Object.assign({}, flags[key]);

      delete flag.desc;
      delete flag.deprecated;

      result[key] = flag;
    }

    return result;
  },
};
