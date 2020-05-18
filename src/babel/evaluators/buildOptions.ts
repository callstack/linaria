/**
 * This file handles preparing babel config for Linaria preevaluation.
 */

import {
  PluginItem,
  TransformOptions,
  PluginTarget,
  PluginOptions,
} from '@babel/core';
import { StrictOptions } from '../types';

type DefaultOptions = Partial<TransformOptions> & {
  plugins: PluginItem[];
  presets: PluginItem[];
  caller: { evaluate: boolean };
};

function getPluginTarget(item: PluginItem) {
  const target = Array.isArray(item) ? item[0] : item;
  try {
    if (typeof target === 'string') {
      return require.resolve(target);
    }
    return target;
  } catch {
    return target;
  }
}

function getPluginInstanceName(item: PluginItem) {
  return Array.isArray(item) ? item[2] : undefined;
}

function shouldMergePlugins(left: PluginItem, right: PluginItem) {
  const leftTarget = getPluginTarget(left);
  const rightTarget = getPluginTarget(right);
  const leftName = getPluginInstanceName(left);
  const rightName = getPluginInstanceName(right);
  const result = leftTarget === rightTarget && leftName === rightName;
  return result;
}

function isMergablePlugin(
  item: PluginItem
): item is
  | PluginTarget
  | [PluginTarget, PluginOptions]
  | [PluginTarget, PluginOptions, string | undefined] {
  return typeof item === 'string' || Array.isArray(item);
}

function getPluginOptions(item: PluginItem): object {
  if (typeof item === 'string') {
    return {};
  }

  if (Array.isArray(item)) {
    return {
      ...item[1],
    };
  }

  if (typeof item === 'object' && 'options' in item) {
    return {
      ...item.options,
    };
  }

  return {};
}

// Merge two plugin declarations. Options from the right override options
// on the left
function mergePluginItems(left: PluginItem, right: PluginItem) {
  if (isMergablePlugin(left) && isMergablePlugin(right)) {
    const pluginTarget = Array.isArray(left) ? left[0] : left;
    const leftOptions = getPluginOptions(left);
    const rightOptions = getPluginOptions(right);
    return [pluginTarget, { ...leftOptions, ...rightOptions }];
  }

  return right;
}

/**
 * Add `newItem` to the beginning of `plugins`. If a plugin with the same
 * target (and ID) already exists, it will be dropeed, and its options
 * merged into those of the newly added item.
 */
export function mergeOrPrependPlugin(
  plugins: PluginItem[],
  newItem: PluginItem
) {
  const mergeItemIndex = plugins.findIndex(existingItem =>
    shouldMergePlugins(existingItem, newItem)
  );
  if (mergeItemIndex === -1) {
    return [newItem, ...plugins];
  }

  const mergedItem = mergePluginItems(plugins[mergeItemIndex], newItem);
  return [
    mergedItem,
    ...plugins.slice(0, mergeItemIndex),
    ...plugins.slice(mergeItemIndex + 1),
  ];
}

/**
 * Add `newItem` to the end of `plugins`. If an item with the same target (and
 * ID) already exists, instead update its options from `newItem`.
 */
export function mergeOrAppendPlugin(
  plugins: PluginItem[],
  newItem: PluginItem
) {
  const mergeItemIndex = plugins.findIndex(existingItem =>
    shouldMergePlugins(existingItem, newItem)
  );
  if (mergeItemIndex === -1) {
    return [...plugins, newItem];
  }

  const mergedItem = mergePluginItems(plugins[mergeItemIndex], newItem);
  return [
    ...plugins.slice(0, mergeItemIndex),
    ...plugins.slice(mergeItemIndex + 1),
    mergedItem,
  ];
}

function isLinariaBabelPreset(item: PluginItem) {
  const name = getPluginTarget(item);
  return name === 'linaria/babel' || name === require.resolve('../../babel');
}

export default function buildOptions(
  filename: string,
  options?: StrictOptions
): TransformOptions {
  const plugins: Array<string | object> = [
    // Include these plugins to avoid extra config when using { module: false } for webpack
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-export-namespace-from',
  ];

  const defaults: DefaultOptions = {
    caller: { name: 'linaria', evaluate: true },
    filename: filename,
    presets: [
      [
        require.resolve('../index'),
        {
          ...(options || {}),
        },
      ],
    ],
    plugins: [
      ...plugins.map(name => require.resolve(name as string)),
      // We don't support dynamic imports when evaluating, but don't wanna syntax error
      // This will replace dynamic imports with an object that does nothing
      require.resolve('../dynamic-import-noop'),
    ],
  };

  const babelOptions =
    // Shallow copy the babel options because we mutate it later
    options?.babelOptions ? { ...options.babelOptions } : {};

  // If we programmatically pass babel options while there is a .babelrc, babel might throw
  // We need to filter out duplicate presets and plugins so that this doesn't happen
  // This workaround isn't full proof, but it's still better than nothing
  //
  // In our case, a preset might also be referring to linaria/babel
  // We require the file from internal path which is not the same one that we export
  // This case won't get caught and the preset won't filtered, even if they are same
  // So we add an extra check for top level linaria/babel
  let configuredPresets = (babelOptions.presets || []).filter(
    item => !isLinariaBabelPreset(item)
  );
  for (const requiredPreset of defaults.presets) {
    // Preset order is last to first, so add our required presets to the end
    // This makes sure that our preset is always run first
    configuredPresets = mergeOrAppendPlugin(configuredPresets, requiredPreset);
  }

  let configuedPlugins = babelOptions.plugins || [];
  for (const requiredPlugin of defaults.plugins.slice().reverse()) {
    // Plugin order is first to last, so add our required plugins to the start
    // This makes sure that the plugins we specify always run first
    configuedPlugins = mergeOrPrependPlugin(plugins, requiredPlugin);
  }

  return {
    // Passed options shouldn't be able to override the options we pass
    // Linaria's plugins rely on these (such as filename to generate consistent hash)
    ...babelOptions,
    ...defaults,
    presets: configuredPresets,
    plugins: configuedPlugins,
  };
}
