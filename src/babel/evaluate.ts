// TypeScript Version: 3.2

import {
  transformSync,
  BabelFileResult,
  PluginItem,
  TransformOptions,
  types,
} from '@babel/core';
import generator from '@babel/generator';
import Module from './module';
import { Location, StrictOptions, Value } from './types';
import { NodePath } from '@babel/traverse';

type DefaultOptions = Partial<TransformOptions> & {
  plugins: PluginItem[];
  presets: PluginItem[];
};

interface IRequirement {
  result: types.Node;
  path: NodePath;
  start: Location;
  end: Location;
}

const isAdded = (requirements: IRequirement[], path: NodePath): boolean => {
  if (requirements.some(req => req.path === path)) {
    return true;
  }

  if (path.parentPath) {
    return isAdded(requirements, path.parentPath);
  }

  return false;
};

const resolve = (
  path: NodePath<types.Identifier>,
  requirements: IRequirement[]
) => {
  const binding = path.scope.getBinding(path.node.name);

  if (
    path.isReferenced() &&
    binding &&
    // Next condition it's always true because `params` isn't valid value
    (binding.kind as string) !== 'param' &&
    !isAdded(requirements, binding.path)
  ) {
    let result;

    switch (binding.kind) {
      case 'module':
        if (types.isImportSpecifier(binding.path)) {
          const p = binding.path as NodePath<types.ImportSpecifier>;
          result = types.importDeclaration(
            [p.node],
            (p.parentPath.node as types.ImportDeclaration).source
          );
        } else {
          result = binding.path.parentPath.node;
        }
        break;
      case 'const':
      case 'let':
      case 'var': {
        const { node } = binding.path as NodePath<types.VariableDeclarator>;
        let decl;

        // Replace SequenceExpressions (expr1, expr2, expr3, ...) with the last one
        if (types.isSequenceExpression(node.init)) {
          decl = types.variableDeclarator(
            node.id,
            node.init.expressions[node.init.expressions.length - 1]
          );
        } else {
          decl = node;
        }

        result = types.variableDeclaration(binding.kind, [decl]);
        break;
      }
      default:
        result = binding.path.node;
        break;
    }

    const { loc } = binding.path.node;

    requirements.push({
      result,
      path: binding.path,
      start: loc!.start,
      end: loc!.end,
    });

    binding.path.traverse({
      Identifier(p) {
        resolve(p, requirements);
      },
    });
  }
};

export default function evaluate(
  path: any,
  t: any,
  filename: string,
  transformer?: (text: string) => BabelFileResult | null,
  options?: StrictOptions
) {
  if (t.isSequenceExpression(path)) {
    // We only need to evaluate the last item in a sequence expression, e.g. (a, b, c)
    // eslint-disable-next-line no-param-reassign
    path = path.get('expressions')[path.node.expressions.length - 1];
  }

  const requirements: IRequirement[] = [];

  if (t.isIdentifier(path)) {
    resolve(path, requirements);
  } else {
    path.traverse({
      Identifier(p: NodePath<types.Identifier>) {
        resolve(p, requirements);
      },
    });
  }

  const expression = t.expressionStatement(
    t.assignmentExpression(
      '=',
      t.memberExpression(t.identifier('module'), t.identifier('exports')),
      path.node
    )
  );

  // Preserve source order
  requirements.sort((a, b) => {
    if (a.start.line === b.start.line) {
      return a.start.column - b.start.column;
    }

    return a.start.line - b.start.line;
  });

  // We'll wrap each code in a block to avoid collisions in variable names
  // We separate out the imports since they cannot be inside blocks
  const { imports, others } = requirements.reduce(
    (acc, curr) => {
      if (t.isImportDeclaration(curr.path.parentPath)) {
        acc.imports.push(curr.result);
      } else {
        // Add these in reverse because we'll need to wrap in block statements in reverse
        acc.others.unshift(curr.result);
      }

      return acc;
    },
    { imports: [] as types.Node[], others: [] as types.Node[] }
  );

  const wrapped = others.reduce(
    (acc, curr) => t.blockStatement([curr, acc]),
    t.blockStatement([expression])
  );

  const m = new Module(filename);

  m.dependencies = [];
  m.transform =
    typeof transformer !== 'undefined'
      ? transformer
      : function transform(this: Module, text) {
          if (options && options.ignore && options.ignore.test(this.filename)) {
            return { code: text };
          }

          const plugins: Array<string | object> = [
            // Include these plugins to avoid extra config when using { module: false } for webpack
            '@babel/plugin-transform-modules-commonjs',
            '@babel/plugin-proposal-export-namespace-from',
          ];

          const defaults: DefaultOptions = {
            caller: { name: 'linaria', evaluate: true },
            filename: this.filename,
            presets: [[require.resolve('./index'), options]],
            plugins: [
              ...plugins.map(name => require.resolve(name as string)),
              // We don't support dynamic imports when evaluating, but don't wanna syntax error
              // This will replace dynamic imports with an object that does nothing
              require.resolve('./dynamic-import-noop'),
            ],
          };

          const babelOptions =
            // Shallow copy the babel options because we mutate it later
            options && options.babelOptions ? { ...options.babelOptions } : {};

          // If we programmtically pass babel options while there is a .babelrc, babel might throw
          // We need to filter out duplicate presets and plugins so that this doesn't happen
          // This workaround isn't full proof, but it's still better than nothing
          const keys: Array<
            keyof TransformOptions & ('presets' | 'plugins')
          > = ['presets', 'plugins'];
          keys.forEach(field => {
            babelOptions[field] = babelOptions[field]
              ? babelOptions[field]!.filter((item: PluginItem) => {
                  // If item is an array it's a preset/plugin with options ([preset, options])
                  // Get the first item to get the preset.plugin name
                  // Otheriwse it's a plugin name (can be a function too)
                  const name = Array.isArray(item) ? item[0] : item;

                  if (
                    // In our case, a preset might also be referring to linaria/babel
                    // We require the file from internal path which is not the same one that we export
                    // This case won't get caught and the preset won't filtered, even if they are same
                    // So we add an extra check for top level linaria/babel
                    name === 'linaria/babel' ||
                    name === require.resolve('../../babel') ||
                    // Also add a check for the plugin names we include for bundler support
                    plugins.includes(name)
                  ) {
                    return false;
                  }

                  // Loop through the default presets/plugins to see if it already exists
                  return !defaults[field].some(it =>
                    // The default presets/plugins can also have nested arrays,
                    Array.isArray(it) ? it[0] === name : it === name
                  );
                })
              : [];
          });

          return transformSync(text, {
            // Passed options shouldn't be able to override the options we pass
            // Linaria's plugins rely on these (such as filename to generate consistent hash)
            ...babelOptions,
            ...defaults,
            presets: [
              // Preset order is last to first, so add the extra presets to start
              // This makes sure that our preset is always run first
              ...babelOptions.presets!,
              ...defaults.presets,
            ],
            plugins: [
              ...defaults.plugins,
              // Plugin order is first to last, so add the extra presets to end
              // This makes sure that the plugins we specify always run first
              ...babelOptions.plugins!,
            ],
          });
        };

  m.evaluate(
    [
      // Use String.raw to preserve escapes such as '\n' in the code
      // Flow doesn't understand template tags: https://github.com/facebook/flow/issues/2616
      /* $FlowFixMe */
      imports.map(node => String.raw`${generator(node).code}`).join('\n'),
      /* $FlowFixMe */
      String.raw`${generator(wrapped).code}`,
    ].join('\n')
  );

  return {
    value: m.exports as Value,
    dependencies: m.dependencies,
  };
}
