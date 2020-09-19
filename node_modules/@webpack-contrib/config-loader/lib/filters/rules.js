const regexEqual = (reg, exp) =>
  reg instanceof RegExp &&
  exp instanceof RegExp &&
  reg.source === exp.source &&
  reg.global === exp.global &&
  reg.ignoreCase === exp.ignoreCase &&
  reg.multiline === exp.multiline;

module.exports = {
  default: (config) => {
    const { rules } = config.module;
    /* istanbul ignore if */
    if (!rules || !rules.length) {
      return rules;
    }

    return rules.reduce(
      (array, other) =>
        array.findIndex(
          (rule) =>
            rule.test === other.test || regexEqual(rule.test, other.test)
        ) < 0
          ? [...array, other]
          : array,
      []
    );
  },

  none: (config) => config.module.rules,
};
