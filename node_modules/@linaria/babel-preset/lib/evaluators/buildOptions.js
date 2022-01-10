"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = buildOptions;

/**
 * This file handles preparing babel config for Linaria preevaluation.
 */
function buildOptions(filename, options) {
  const plugins = [// Include these plugins to avoid extra config when using { module: false } for webpack
  '@babel/plugin-transform-modules-commonjs', '@babel/plugin-proposal-export-namespace-from'];
  const defaults = {
    caller: {
      name: 'linaria',
      evaluate: true
    },
    filename: filename,
    presets: [[require.resolve('../index'), { ...(options || {})
    }]],
    plugins: [...plugins.map(name => require.resolve(name)), // We don't support dynamic imports when evaluating, but don't wanna syntax error
    // This will replace dynamic imports with an object that does nothing
    require.resolve('../dynamic-import-noop')]
  };
  const babelOptions = // Shallow copy the babel options because we mutate it later
  options !== null && options !== void 0 && options.babelOptions ? { ...options.babelOptions
  } : {}; // If we programmatically pass babel options while there is a .babelrc, babel might throw
  // We need to filter out duplicate presets and plugins so that this doesn't happen
  // This workaround isn't full proof, but it's still better than nothing

  const keys = ['presets', 'plugins'];
  keys.forEach(field => {
    babelOptions[field] = babelOptions[field] ? babelOptions[field].filter(item => {
      // If item is an array it's a preset/plugin with options ([preset, options])
      // Get the first item to get the preset.plugin name
      // Otherwise it's a plugin name (can be a function too)
      const name = Array.isArray(item) ? item[0] : item;

      if ( // In our case, a preset might also be referring to linaria/babel
      // We require the file from internal path which is not the same one that we export
      // This case won't get caught and the preset won't filtered, even if they are same
      // So we add an extra check for top level linaria/babel
      name === 'linaria/babel' || name === '@linaria' || name === '@linaria/babel-preset' || name === require.resolve('../index') || // Also add a check for the plugin names we include for bundler support
      plugins.includes(name)) {
        return false;
      } // Loop through the default presets/plugins to see if it already exists


      return !defaults[field].some(it => // The default presets/plugins can also have nested arrays,
      Array.isArray(it) ? it[0] === name : it === name);
    }) : [];
  });
  return { // Passed options shouldn't be able to override the options we pass
    // Linaria's plugins rely on these (such as filename to generate consistent hash)
    ...babelOptions,
    ...defaults,
    presets: [// Preset order is last to first, so add the extra presets to start
    // This makes sure that our preset is always run first
    ...babelOptions.presets, ...defaults.presets],
    plugins: [...defaults.plugins, // Plugin order is first to last, so add the extra presets to end
    // This makes sure that the plugins we specify always run first
    ...babelOptions.plugins]
  };
}
//# sourceMappingURL=buildOptions.js.map