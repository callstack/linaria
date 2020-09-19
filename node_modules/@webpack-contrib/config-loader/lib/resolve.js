const minimist = require('minimist');

const fromFunction = (config, argv) => {
  const result = config(argv);

  return Promise.resolve(result);
};

const fromObject = (config) => Promise.resolve(config);

const handlers = {
  function: fromFunction,
  object: fromObject,
};

module.exports = (configSet, argv) => {
  const { config, configPath } = configSet;
  const type = typeof (config.default || config);
  const handler = handlers[type];

  // eslint-disable-next-line no-param-reassign
  argv = argv || minimist(process.argv.slice(2));

  return handler(config.default || config, argv).then((configResult) => {
    return {
      config: configResult,
      configPath,
    };
  });
};
