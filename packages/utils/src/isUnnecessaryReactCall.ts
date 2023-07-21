import type { NodePath } from '@babel/core';
import type { CallExpression, Program } from '@babel/types';

import type { IImport, ISideEffectImport } from './collectExportsAndImports';
import { collectExportsAndImports } from './collectExportsAndImports';
import { getScope } from './getScope';

function getCallee(p: NodePath<CallExpression>) {
  const callee = p.get('callee');
  if (callee.isSequenceExpression()) {
    const expressions = callee.get('expressions');
    if (
      expressions.length === 2 &&
      expressions[0].isNumericLiteral({ value: 0 })
    ) {
      return expressions[1];
    }

    return callee;
  }

  return callee;
}

const JSXRuntimeSource = 'react/jsx-runtime';

function isJSXRuntime(
  p: NodePath<CallExpression>,
  imports: (IImport | ISideEffectImport)[]
) {
  const jsxRuntime = imports.find((i) => i.source === JSXRuntimeSource);
  const jsxRuntimeName =
    jsxRuntime?.local?.isIdentifier() && jsxRuntime?.local?.node?.name;

  if (jsxRuntime) {
    const callee = getCallee(p);
    if (jsxRuntimeName && callee.isIdentifier({ name: jsxRuntimeName })) {
      return true;
    }

    if (
      callee.isMemberExpression() &&
      imports.find((i) => i.source === JSXRuntimeSource && i.local === callee)
    ) {
      return true;
    }
  }

  return false;
}

function isHookOrCreateElement(name: string): boolean {
  return name === 'createElement' || /use[A-Z]/.test(name);
}

function isClassicReactRuntime(
  p: NodePath<CallExpression>,
  imports: (IImport | ISideEffectImport)[]
) {
  const reactImports = imports.filter(
    (i) =>
      i.source === 'react' &&
      (i.imported === 'default' ||
        (i.imported && isHookOrCreateElement(i.imported)))
  ) as IImport[];

  if (reactImports.length === 0) return false;
  const callee = getCallee(p);
  if (callee.isIdentifier() && isHookOrCreateElement(callee.node.name)) {
    const bindingPath = getScope(callee).getBinding(callee.node.name)?.path;
    return reactImports.some((i) => bindingPath?.isAncestor(i.local));
  }

  if (callee.isMemberExpression()) {
    if (reactImports.some((i) => i.local === callee)) {
      // It's React.createElement in CJS
      return true;
    }

    const object = callee.get('object');
    const property = callee.get('property');
    const defaultImport = reactImports.find((i) => i.imported === 'default');
    if (
      !defaultImport ||
      !defaultImport.local.isIdentifier() ||
      !property.isIdentifier() ||
      !isHookOrCreateElement(property.node.name) ||
      !object.isIdentifier({ name: defaultImport.local.node.name })
    ) {
      return false;
    }

    const bindingPath = getScope(object).getBinding(object.node.name)?.path;
    return bindingPath?.isAncestor(defaultImport.local) ?? false;
  }

  return false;
}

export default function isUnnecessaryReactCall(path: NodePath<CallExpression>) {
  const programPath = path.findParent((p) => p.isProgram()) as
    | NodePath<Program>
    | undefined;
  if (!programPath) {
    return false;
  }

  const { imports } = collectExportsAndImports(programPath);

  return isJSXRuntime(path, imports) || isClassicReactRuntime(path, imports);
}
