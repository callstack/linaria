import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type {
  Expression,
  TaggedTemplateExpression,
  SourceLocation,
} from '@babel/types';
import findUp from 'find-up';

import BaseProcessor from '@linaria/core/processors/BaseProcessor';
import type { Params } from '@linaria/core/processors/types';
import type { IFileContext } from '@linaria/core/processors/utils/types';
import type { IImport, StrictOptions } from '@linaria/utils';
import {
  collectExportsAndImports,
  explicitImport,
  isNotNull,
  mutate,
} from '@linaria/utils';

import collectTemplateDependencies, {
  extractExpression,
} from './collectTemplateDependencies';
import getSource from './getSource';

type BuilderArgs = ConstructorParameters<typeof BaseProcessor> extends [
  typeof t,
  Params,
  Expression,
  SourceLocation | null,
  (replacement: Expression, isPure: boolean) => void,
  ...infer T
]
  ? T
  : never;

type Builder = (...args: BuilderArgs) => BaseProcessor;

type ProcessorClass = new (
  ...args: ConstructorParameters<typeof BaseProcessor>
) => BaseProcessor;

const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

function zip<T1, T2>(arr1: T1[], arr2: T2[]) {
  const result: (T1 | T2)[] = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push(arr1[i]);
    if (arr2[i]) result.push(arr2[i]);
  }

  return result;
}

function buildCodeFrameError(path: NodePath, message: string): Error {
  try {
    return path.buildCodeFrameError(message);
  } catch {
    return new Error(message);
  }
}

function findPackageJSON(pkgName: string, filename: string | null | undefined) {
  try {
    const pkgPath = require.resolve(
      pkgName,
      filename ? { paths: [dirname(filename)] } : {}
    );
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
  filename: string | null | undefined
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

function getProcessorFromPackage(
  packageName: string,
  tagName: string,
  filename: string | null | undefined
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

function getProcessorFromFile(processorPath: string): ProcessorClass | null {
  const Processor = require(processorPath).default;
  if (!isValidProcessorClass(Processor)) {
    return null;
  }

  return Processor;
}

function getBuilderForTemplate(
  path: NodePath<TaggedTemplateExpression>,
  imports: IImport[],
  filename: string | null | undefined,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
): Builder | null {
  const tagResolver = options.tagResolver ?? (() => null);
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
      .map(([imp, p]): [ProcessorClass | null, NodePath] => {
        const source = tagResolver(imp.source, imp.imported);
        const processor = source
          ? getProcessorFromFile(source)
          : getProcessorFromPackage(imp.source, imp.imported, filename);
        return [processor, p];
      })
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
      const cookedArgs = args
        .map((arg) => {
          const buildError = arg.buildCodeFrameError.bind(arg);
          if (!arg.isExpression()) {
            throw buildError(`Unexpected type of an argument ${arg.type}`);
          }
          const source = getSource(arg);
          const extracted = extractExpression(arg, options.evaluate);
          return { ...extracted, source, buildCodeFrameError: buildError };
        })
        .filter(isNotNull);

      params.push(['call', ...cookedArgs]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (current?.isMemberExpression() && current.node.object === prev.node) {
      const property = current.get('property');
      if (property.isIdentifier() && !current.node.computed) {
        params.push(['member', property.node.name]);
      } else if (property.isStringLiteral()) {
        params.push(['member', property.node.value]);
      } else {
        throw property.buildCodeFrameError(`Unexpected type of a property`);
      }

      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    throw buildCodeFrameError(path, 'Unexpected tag usage');
  }

  const replacer = (replacement: Expression, isPure: boolean) => {
    mutate(path, (p) => {
      p.replaceWith(replacement);
      if (isPure) {
        p.addComment('leading', '#__PURE__');
      }
    });
  };

  return (...args: BuilderArgs) =>
    new Processor(
      t,
      params,
      (tagPath as NodePath<Expression>).node,
      tagPath.node.loc ?? null,
      replacer,
      ...args
    );
}

function getDisplayName(
  path: NodePath<TaggedTemplateExpression>,
  idx: number,
  fileContext: IFileContext
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
    const filename = fileContext.filename ?? 'unknown';
    // Try to derive the path from the filename
    displayName = basename(filename);

    if (/^index\.[a-z\d]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = basename(dirname(filename));
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

function isTagReferenced(path: NodePath): boolean {
  // Check if the variable is referenced anywhere for basic DCE
  // Only works when it's assigned to a variable
  let isReferenced = true;

  const parent = path.findParent(
    (p) =>
      p.isObjectProperty() ||
      p.isJSXOpeningElement() ||
      p.isVariableDeclarator()
  );

  if (parent) {
    if (parent.isVariableDeclarator()) {
      const id = parent.get('id');
      // FIXME: replace with id.isReferencedIdentifier()
      if (id.isIdentifier()) {
        const { referencePaths } = path.scope.getBinding(id.node.name) || {
          referencePaths: [],
        };

        isReferenced = referencePaths.length !== 0;
      }
    }
  }

  return isReferenced;
}

const counters = new WeakMap<IFileContext, number>();
const getNextIndex = (state: IFileContext) => {
  const counter = counters.get(state) ?? 0;
  counters.set(state, counter + 1);
  return counter;
};

const cache = new WeakMap<TaggedTemplateExpression, BaseProcessor | null>();

export default function getTagProcessor(
  path: NodePath<TaggedTemplateExpression>,
  fileContext: IFileContext,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
): BaseProcessor | null {
  if (!cache.has(path.node)) {
    // Increment the index of the style we're processing
    // This is used for slug generation to prevent collision
    // Also used for display name if it couldn't be determined
    const idx = getNextIndex(fileContext);

    const root = path.scope.getProgramParent().path;
    const { imports } = collectExportsAndImports(root, fileContext.filename);
    try {
      const builder = getBuilderForTemplate(
        path,
        imports.filter(explicitImport),
        fileContext.filename,
        options
      );
      if (builder) {
        const [quasis, expressionValues] = collectTemplateDependencies(
          path,
          options.evaluate
        );

        const displayName = getDisplayName(path, idx, fileContext);

        const processor = builder(
          zip(quasis, expressionValues),
          displayName,
          isTagReferenced(path),
          idx,
          options,
          fileContext
        );

        cache.set(path.node, processor);
      } else {
        cache.set(path.node, null);
      }
    } catch (e) {
      if (e instanceof Error) {
        throw buildCodeFrameError(path, e.message);
      }

      throw e;
    }
  }

  return cache.get(path.node) ?? null;
}