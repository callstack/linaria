import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { Expression, TaggedTemplateExpression } from '@babel/types';
import findUp from 'find-up';

import BaseProcessor from '@linaria/core/processors/BaseProcessor';
import type { Params } from '@linaria/core/processors/types';
import { warn } from '@linaria/logger';

import type { StrictOptions } from '../types';

import type { IImport } from './collectExportsAndImports';
import collectExportsAndImports from './collectExportsAndImports';
import getSource from './getSource';
import isNotNull from './isNotNull';

type BuilderArgs = ConstructorParameters<typeof BaseProcessor> extends [
  typeof t,
  Params,
  Expression,
  ...infer T
]
  ? T
  : never;

type Builder = (...args: BuilderArgs) => BaseProcessor;

type ProcessorClass = new (
  ...args: ConstructorParameters<typeof BaseProcessor>
) => BaseProcessor;

interface IState {
  file: {
    opts: {
      root: string;
      filename: string;
    };
  };
}

const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

function buildCodeFrameError(path: NodePath, message: string): Error {
  try {
    return path.buildCodeFrameError(message);
  } catch {
    return new Error(message);
  }
}

function findPackageJSON(pkgName: string, filename: string) {
  try {
    const pkgPath = require.resolve(pkgName, { paths: [dirname(filename)] });
    return findUp.sync('package.json', { cwd: pkgPath });
  } catch (er: unknown) {
    if (
      typeof er === 'object' &&
      er !== null &&
      (er as { code?: unknown }).code === 'MODULE_NOT_FOUND'
    ) {
      return undefined;
    }

    throw er;
  }
}

const definedTagsCache = new Map<string, Record<string, string> | undefined>();
const getDefinedTagsFromPackage = (
  pkgName: string,
  filename: string
): Record<string, string> | undefined => {
  if (definedTagsCache.has(pkgName)) {
    return definedTagsCache.get(pkgName);
  }

  const packageJSONPath = findPackageJSON(pkgName, filename);
  if (!packageJSONPath) {
    return undefined;
  }

  const packageDir = dirname(packageJSONPath);
  const packageJSON = JSON.parse(readFileSync(packageJSONPath, 'utf8'));
  const definedTags: Record<string, string> | undefined =
    packageJSON.linaria?.tags;

  const normalizedTags = definedTags
    ? Object.entries(definedTags).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value.startsWith('.')
            ? join(packageDir, value)
            : require.resolve(value, { paths: [packageDir] }),
        }),
        {} as Record<string, string>
      )
    : undefined;

  definedTagsCache.set(pkgName, normalizedTags);

  return normalizedTags;
};

function isValidProcessorClass(module: unknown): module is ProcessorClass {
  return module instanceof BaseProcessor.constructor;
}

function getProcessor(
  packageName: string,
  tagName: string,
  filename: string
): ProcessorClass | null {
  const definedTags = getDefinedTagsFromPackage(packageName, filename);
  const processorPath = definedTags?.[tagName];
  if (!processorPath) {
    return null;
  }

  const Processor = require(processorPath).default;
  if (!isValidProcessorClass(Processor)) {
    return null;
  }

  return Processor;
}

function getBuilderForTemplate(
  path: NodePath<TaggedTemplateExpression>,
  imports: IImport[],
  filename: string
): Builder | null {
  const relatedImports = imports
    .map((i): [IImport, NodePath] | null => {
      const { local } = i;

      if (!local.isIdentifier()) {
        if (local.isDescendant(path)) {
          return [i, local];
        }

        return null;
      }

      const binding = local.scope.getBinding(local.node.name);

      const tagPath = binding?.referencePaths.find((p) => p.isDescendant(path));

      if (tagPath) {
        return [i, tagPath];
      }

      return null;
    })
    .filter(isNotNull)
    .filter((i) => i[1].isExpression());

  if (relatedImports.length === 0) {
    return null;
  }

  const [Processor, tagPath] =
    relatedImports
      .map(([imp, p]): [ProcessorClass | null, NodePath] => [
        getProcessor(imp.source, imp.imported, filename),
        p,
      ])
      .find(([proc]) => proc) ?? [];

  if (!Processor || !tagPath) {
    return null;
  }

  const params: Params = [];
  let prev: NodePath | null = tagPath;
  let current: NodePath | null = tagPath.parentPath;
  while (current && current !== path) {
    if (
      current?.isSequenceExpression() &&
      last(current.node.expressions) === prev.node
    ) {
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (current?.isCallExpression() && current.node.callee === prev.node) {
      const args = current.get('arguments');
      params.push([
        'call',
        ...args.map(
          (arg) => [getSource(arg), arg] as [string, NodePath<Expression>]
        ),
      ]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (current?.isMemberExpression() && current.node.object === prev.node) {
      const property = current.get('property');
      if (property.isPrivateName()) {
        // eslint-disable-next-line no-continue
        continue;
      }

      params.push(['member', property as NodePath<Expression>]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    throw buildCodeFrameError(path, 'Unexpected tag usage');
  }

  return (...args: BuilderArgs) =>
    new Processor(t, params, (tagPath as NodePath<Expression>).node, ...args);
}

function getDisplayName(
  path: NodePath<TaggedTemplateExpression>,
  idx: number,
  state: IState
): string {
  let displayName: string | undefined;

  const parent = path.findParent(
    (p) =>
      p.isObjectProperty() ||
      p.isJSXOpeningElement() ||
      p.isVariableDeclarator()
  );

  if (parent) {
    if (parent.isObjectProperty()) {
      if ('name' in parent.node.key) {
        displayName = parent.node.key.name;
      } else if ('value' in parent.node.key) {
        displayName = parent.node.key.value.toString();
      } else {
        const keyPath = parent.get('key');
        displayName = getSource(keyPath);
      }
    } else if (parent.isJSXOpeningElement()) {
      const name = parent.get('name');
      if (name.isJSXIdentifier()) {
        displayName = name.node.name;
      }
    } else if (parent.isVariableDeclarator()) {
      const id = parent.get('id');
      if (id.isIdentifier()) {
        displayName = id.node.name;
      }
    }
  }

  if (!displayName) {
    // Try to derive the path from the filename
    displayName = basename(state.file.opts.filename);

    if (/^index\.[a-z\d]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = basename(dirname(state.file.opts.filename));
    }

    // Remove the file extension
    displayName = displayName.replace(/\.[a-z\d]+$/, '');

    if (displayName) {
      displayName += idx;
    } else {
      throw new Error(
        "Couldn't determine a name for the component. Ensure that it's either:\n" +
          '- Assigned to a variable\n' +
          '- Is an object property\n' +
          '- Is a prop in a JSX element\n'
      );
    }
  }

  return displayName;
}

const counters = new WeakMap<IState, number>();
const getNextIndex = (state: IState) => {
  const counter = counters.get(state) ?? 0;
  counters.set(state, counter + 1);
  return counter;
};

const cache = new WeakMap<
  NodePath<TaggedTemplateExpression>,
  BaseProcessor | null
>();

export default function getTagProcessor(
  path: NodePath<TaggedTemplateExpression>,
  state: IState,
  options: Pick<StrictOptions, 'classNameSlug' | 'displayName'>
): BaseProcessor | null {
  if (!cache.has(path)) {
    // Increment the index of the style we're processing
    // This is used for slug generation to prevent collision
    // Also used for display name if it couldn't be determined
    const idx = getNextIndex(state);

    const root = path.findParent((p) => p.isProgram() || p.isFile());
    if (!root) {
      // How is this possible?
      warn('get-tag-context', 'Could not find root node for template tag');
      return null;
    }

    const { imports } = collectExportsAndImports(
      root,
      state.file.opts.filename
    );
    try {
      const builder = getBuilderForTemplate(
        path,
        imports,
        state.file.opts.filename
      );
      if (builder) {
        const displayName = getDisplayName(path, idx, state);
        const processor = builder(displayName, idx, options, state.file.opts);
        cache.set(path, processor);
      } else {
        cache.set(path, null);
      }
    } catch (e) {
      if (e instanceof Error) {
        throw buildCodeFrameError(path, e.message);
      }

      throw e;
    }
  }

  return cache.get(path) ?? null;
}
