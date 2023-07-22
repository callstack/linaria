import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';

import { types as t } from '@babel/core';
import { addDefault, addNamed } from '@babel/helper-module-imports';
import type { NodePath } from '@babel/traverse';
import type {
  Expression,
  SourceLocation,
  Identifier,
  MemberExpression,
  Program,
} from '@babel/types';

import { BaseProcessor } from '@linaria/tags';
import type { Param, Params, IFileContext, TagSource } from '@linaria/tags';
import type { ExpressionValue, IImport, StrictOptions } from '@linaria/utils';
import {
  collectExportsAndImports,
  collectTemplateDependencies,
  explicitImport,
  extractExpression,
  findPackageJSON,
  getSource,
  isNotNull,
  mutate,
} from '@linaria/utils';

type BuilderArgs = ConstructorParameters<typeof BaseProcessor> extends [
  Params,
  TagSource,
  typeof t,
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

function getProcessorForIdentifier(
  path: NodePath<Identifier>,
  imports: IImport[],
  filename: string | null | undefined,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
):
  | [ProcessorClass, TagSource, NodePath<Identifier | MemberExpression>]
  | [null, null, null] {
  const pathBinding = path.scope.getBinding(path.node.name);
  if (!pathBinding) {
    // It's not a binding, so it's not a tag
    return [null, null, null];
  }

  const tagResolver = options.tagResolver ?? (() => null);

  // FIXME: can be simplified
  const relatedImports = imports
    .map(
      (i): [IImport, NodePath<Identifier | MemberExpression> | null] | null => {
        const { local } = i;

        if (local === path) {
          return [i, null];
        }

        if (!local.isIdentifier()) {
          if (path.isDescendant(local)) {
            return [i, local];
          }

          return null;
        }

        const binding = local.scope.getBinding(local.node.name);
        if (pathBinding === binding) {
          return [i, path];
        }

        return null;
      }
    )
    .filter(isNotNull)
    .filter((i) => i[1] === null || i[1].isExpression());

  if (relatedImports.length === 0) {
    return [null, null, null];
  }

  const [Processor = null, tagSource = null, tagPath = null] =
    relatedImports
      .map(
        ([{ imported, source }, p]): [
          ProcessorClass | null,
          TagSource,
          NodePath<Identifier | MemberExpression> | null
        ] => {
          const customFile = tagResolver(source, imported);
          const processor = customFile
            ? getProcessorFromFile(customFile)
            : getProcessorFromPackage(source, imported, filename);
          return [processor, { imported, source }, p];
        }
      )
      .find(([proc]) => proc) ?? [];

  return Processor === null || tagSource === null || tagPath === null
    ? [null, null, null]
    : [Processor, tagSource, tagPath];
}

function getBuilderForIdentifier(
  path: NodePath<Identifier>,
  imports: IImport[],
  filename: string | null | undefined,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
): Builder | null {
  const [Processor, tagSource, tagPath] = getProcessorForIdentifier(
    path,
    imports,
    filename,
    options
  );

  if (!Processor || !tagSource || !tagPath) {
    return null;
  }

  const params: Param[] = [['callee', tagPath.node]];
  let prev: NodePath = tagPath;
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

    if (current?.isCallExpression({ callee: prev.node })) {
      const args = current.get('arguments');
      const cookedArgs = args
        .map((arg) => {
          const buildError = arg.buildCodeFrameError.bind(arg);
          if (!arg.isExpression()) {
            throw buildError(`Unexpected type of an argument ${arg.type}`);
          }
          const source = getSource(arg);
          const extracted = extractExpression(arg, options.evaluate, imports);
          return {
            ...extracted,
            source,
            buildCodeFrameError: buildError,
          } as ExpressionValue;
        })
        .filter(isNotNull);

      params.push(['call', ...cookedArgs]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (current?.isMemberExpression({ object: prev.node })) {
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

    if (current?.isTaggedTemplateExpression({ tag: prev.node })) {
      const [quasis, expressionValues] = collectTemplateDependencies(
        current,
        options.evaluate
      );
      params.push(['template', zip(quasis, expressionValues)]);

      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }

    break;
  }

  const replacer = (replacement: Expression, isPure: boolean) => {
    mutate(prev, (p) => {
      p.replaceWith(replacement);
      if (isPure) {
        p.addComment('leading', '#__PURE__');
      }
    });
  };

  const astService = {
    ...t,
    addDefaultImport: (importedSource: string, nameHint?: string) =>
      addDefault(path, importedSource, { nameHint }),
    addNamedImport: (
      name: string,
      importedSource: string,
      nameHint: string = name
    ) => addNamed(path, name, importedSource, { nameHint }),
  };

  return (...args: BuilderArgs) =>
    new Processor(
      params,
      tagSource,
      astService,
      tagPath.node.loc ?? null,
      replacer,
      ...args
    );
}

function getDisplayName(
  path: NodePath<Identifier>,
  idx: number,
  filename?: string | null
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
    displayName = basename(filename ?? 'unknown');

    if (filename && /^index\.[a-z\d]+$/.test(displayName)) {
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

const cache = new WeakMap<Identifier, BaseProcessor | null>();

export default function getTagProcessor(
  path: NodePath<Identifier>,
  fileContext: IFileContext,
  options: Pick<
    StrictOptions,
    'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'
  >
): BaseProcessor | null {
  if (!cache.has(path.node)) {
    const root = path.scope.getProgramParent().path as NodePath<Program>;
    const { imports } = collectExportsAndImports(root);
    try {
      const builder = getBuilderForIdentifier(
        path,
        imports.filter(explicitImport),
        fileContext.filename,
        options
      );
      if (builder) {
        // Increment the index of the style we're processing
        // This is used for slug generation to prevent collision
        // Also used for display name if it couldn't be determined
        const idx = getNextIndex(fileContext);

        const displayName = getDisplayName(path, idx, fileContext.filename);

        const processor = builder(
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
      if (e === BaseProcessor.SKIP) {
        cache.set(path.node, null);
        return null;
      }

      if (e instanceof Error) {
        throw buildCodeFrameError(path, e.message);
      }

      throw e;
    }
  }

  return cache.get(path.node) ?? null;
}
