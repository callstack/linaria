module.exports = {
  default: (config) => config.plugins,

  constructor: (config) => {
    const { plugins } = config;
    /* istanbul ignore if */
    if (!plugins || !plugins.length) {
      return plugins;
    }

    return plugins.reduceRight(
      (array, other) =>
        array.findIndex(
          (plugin) => plugin.constructor.name === other.constructor.name
        ) < 0
          ? [...array, other]
          : array,
      []
    );
  },
};
