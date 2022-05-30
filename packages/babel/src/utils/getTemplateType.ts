import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { debug, warn } from '@linaria/logger';
import type {
  CallExpression,
  Identifier,
  StringLiteral,
  MemberExpression,
  TaggedTemplateExpression,
} from '@babel/types';
import type { NodePath, Binding } from '@babel/traverse';
import findUp from 'find-up';
import type { TemplateExpression } from '../types';
import type { Core } from '../babel';
import unwrapSequence from './unwrapSequence';
import isRequire from './isRequire';
import type { IImport } from './collectExportsAndImports';
import collectExportsAndImports from './collectExportsAndImports';

type Result =
  | NonNullable<TemplateExpression['styled']>
  | 'css'
  | 'atomic-css'
  | null;

interface ITagProcessor {
  getType(node?: unknown): Result;
}

const definedTagsCache = new Map<string, Record<string, string> | undefined>();
const getDefinedTagsFromPackage = (
  pkgName: string
): Record<string, string> | undefined => {
  if (definedTagsCache.has(pkgName)) {
    return definedTagsCache.get(pkgName);
  }

  const pkgPath = require.resolve(pkgName);
  const packageJSONPath = findUp.sync('package.json', { cwd: pkgPath });
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
            : require.resolve(value),
        }),
        {} as Record<string, string>
      )
    : undefined;

  definedTagsCache.set(pkgName, normalizedTags);

  return normalizedTags;
};

const getValue = (node: Identifier | StringLiteral): string => {
  if (node.type === 'Identifier') {
    return node.name;
  }

  return node.value;
};

function isRequireCall(path: NodePath<CallExpression>): boolean {
  const callee = path.get('callee');
  return isRequire(callee);
}

function getRelatedPackageName(binding: Binding): string | undefined {
  if (binding.path.isVariableDeclarator()) {
    const init = binding.path.get('init');
    if (!init.isCallExpression() || !isRequireCall(init)) {
      return undefined;
    }
    const firstArgument = init.get('arguments')[0];
    if (!firstArgument.isStringLiteral()) {
      return undefined;
    }

    return firstArgument.node.value;
  }

  if (binding.path.isImportSpecifier()) {
    // It is something that is imported from a module
    const { parentPath } = binding.path;
    if (parentPath.isImportDeclaration()) {
      return parentPath.node.source.value;
    }
  }

  return undefined;
}

function isValidProcessor(module: unknown): module is ITagProcessor {
  return (
    typeof module === 'object' &&
    typeof (module as ITagProcessor).getType === 'function'
  );
}

function getProcessor(
  packageName: string,
  tagName: string
): ITagProcessor | null {
  const definedTags = getDefinedTagsFromPackage(packageName);
  const processorPath = definedTags?.[tagName];
  if (!processorPath) {
    return null;
  }

  const processor = require(processorPath);
  if (!isValidProcessor(processor)) {
    return null;
  }

  return processor;
}

function getResult(
  binding: Binding,
  tagName: string,
  node?: unknown
): Result | null {
  const packageName = getRelatedPackageName(binding);
  if (!packageName) {
    return null;
  }

  return getProcessor(packageName, tagName)?.getType(node) ?? null;
}

function getForIdentifier(
  identifier: NodePath<Identifier>,
  node: unknown,
  imports: IImport[]
): Result | null {
  const binding = identifier.scope.getBinding(identifier.node.name);
  if (!binding) return null;

  const matchedImport = imports.find(
    (i) => i.local.node === binding.identifier
  );
  if (
    !matchedImport ||
    matchedImport.imported === '=' ||
    matchedImport.imported === '*'
  ) {
    return null;
  }

  return (
    getProcessor(matchedImport.source, matchedImport.imported)?.getType(node) ??
    null
  );
}

function getForMemberExpression(
  member: NodePath<MemberExpression>,
  node?: unknown
) {
  const obj = member.get('object');
  const prop = member.get('property');
  if (
    !obj.isIdentifier() ||
    (!prop.isIdentifier() && !prop.isStringLiteral())
  ) {
    return null;
  }

  const binding = obj.scope.getBinding(obj.node.name);
  if (!binding) {
    return null;
  }

  const propName = getValue(prop.node);
  return getResult(binding, propName, node);
}

function getTemplateTypeByTag(
  t: Core['types'],
  path: NodePath<TaggedTemplateExpression>,
  imports: IImport[]
): Result {
  const tag = unwrapSequence(path.get('tag'));
  if (!tag) {
    return null;
  }

  if (tag.isCallExpression()) {
    // It's either styled(Cmp)`` or (0, react.styled)(Cmp)``
    const callee = unwrapSequence(tag.get('callee'));
    const Cmp = tag.get('arguments')[0];

    if (callee?.isIdentifier()) {
      // It's a simple styled(Cmp)``
      return getForIdentifier(callee, Cmp, imports);
    }

    if (callee?.isMemberExpression()) {
      // It's a react.styled(Cmp)``
      return getForMemberExpression(callee, Cmp);
    }

    return null;
  }

  if (tag.isMemberExpression()) {
    // react_1.styled.div``, styled.div``, styled['div']`` or core_1.css``

    const mayBeCss = getForMemberExpression(tag);
    if (mayBeCss) {
      // Ok, it's a core_1.css`` call
      return mayBeCss;
    }

    const obj = tag.get('object');
    const prop = tag.get('property');
    if (!prop.isIdentifier() && !prop.isStringLiteral()) {
      return null;
    }

    const Cmp = { node: t.stringLiteral(getValue(prop.node)) };

    if (obj.isIdentifier()) {
      // styled.div``, styled['div']``
      return getForIdentifier(obj, Cmp, imports);
    }

    if (obj.isMemberExpression()) {
      // react_1.styled.div``
      return getForMemberExpression(obj, Cmp);
    }

    return null;
  }

  if (tag.isIdentifier()) {
    // css``
    return getForIdentifier(tag, null, imports);
  }

  return null;
}

const cache = new WeakMap<NodePath<TaggedTemplateExpression>, Result>();

export default function getTemplateType(
  { types: t }: { types: Core['types'] },
  path: NodePath<TaggedTemplateExpression>
): Result {
  if (!cache.has(path)) {
    const root = path.findParent((p) => p.isProgram() || p.isFile());
    if (!root) {
      // How is this possible?
      warn(
        'get-template-type:template-type',
        'Could not find root node for template tag'
      );
      return null;
    }

    const { imports } = collectExportsAndImports(root);
    const templateType = getTemplateTypeByTag(t, path, imports);

    debug('get-template-type:template-type', templateType);

    cache.set(path, templateType);
  }

  return cache.get(path) ?? null;
}
