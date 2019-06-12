/* eslint-disable no-param-reassign */

import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';
import calcExpressionStats from '../utils/calcExpressionStats';

function makeArrow(ex: NodePath<t.Expression>, propsName = 'props') {
  let loc = ex.node.loc;
  let ident = t.identifier(propsName);
  let fn = t.arrowFunctionExpression([ident], ex.node);
  fn.loc = loc;
  ex.replaceWith(fn);
}

export default function TaggedTemplateExpression(
  path: NodePath<t.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { tag } = path.node;

  let styled: {
    component: {
      node: t.Expression | NodePath<t.Expression>;
    };
  } | null = null;
  let css: boolean = false;

  if (
    t.isCallExpression(tag) &&
    t.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === 'styled' &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    const tagPath = path.get('tag') as NodePath<t.CallExpression>;
    styled = {
      component: tagPath.get('arguments')[0] as NodePath<t.Expression>,
    };
  } else if (
    t.isMemberExpression(tag) &&
    t.isIdentifier(tag.object) &&
    t.isIdentifier(tag.property) &&
    tag.object.name === 'styled' &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    styled = {
      component: { node: t.stringLiteral(tag.property.name) },
    };
  } else if (
    hasImport(t, path.scope, state.file.opts.filename, 'css', 'linaria')
  ) {
    css = t.isIdentifier(tag) && tag.name === 'css';
  }

  if (!styled && !css) {
    return;
  }

  let propsName = 'props';
  let parentWasArrow = false;

  if (path.state) {
    propsName = path.state.propsName;
    parentWasArrow = path.state.parentWasArrow;
  }

  /**
   *  Transform Styled Components wrapped in an arrow function:
   * `const A = props => styled.a` becomes `const A = styled.a`
   */
  const parentIsArrow = t.isArrowFunctionExpression(path.parentPath);

  // Remove Arrow Function Wrapper
  if (!parentWasArrow && parentIsArrow) {
    const params = path.parentPath.get('params') as any[];
    if (!params || params.length !== 1) {
      throw path.parentPath.buildCodeFrameError(
        'Styled component arrow function can only accept one props argument or things may break from rewrite.\n' +
          'If this is not an error, wrap it in another arrow function:\n' +
          'const Button = config => (props => styled.button``)({})'
      );
    }
    const param = params[0];
    if (!t.isIdentifier(param.node)) {
      throw param.buildCodeFrameError(
        'Unexpected element. Expected props argument name. Rest spread and destructuring are not supported here.'
      );
    }
    // Ensure arrow function is immediately called with an empty object
    let callExpPath = path.parentPath.parentPath;
    let callExpNode = path.parentPath.parentPath.node;
    if (!t.isCallExpression(callExpNode)) {
      throw path.parentPath.buildCodeFrameError(
        "A styled component's wrapping function must be called immediately"
      );
    }
    let args = callExpPath.get('arguments');
    const isEmptyObjExpression = (theArgs: NodePath<t.Node>[]) =>
      theArgs.length === 1 &&
      t.isObjectExpression(theArgs[0].node) &&
      theArgs[0].node.properties.length === 0;

    if (!Array.isArray(args)) {
      throw callExpPath.buildCodeFrameError(
        "A styled component's wrapping function must be called immediately with an empty expression"
      );
    }
    if (!isEmptyObjExpression(args)) {
      throw args[0].buildCodeFrameError(
        "A styled component's wrapping function must be called immediately with an empty expression"
      );
    }
    //
    let propsName;
    if (param && param.node && param.node.name) {
      propsName = param.node.name;
    }
    // Save metadata for next visit.
    callExpPath.state = {};
    callExpPath.state.parentWasArrow = true;
    callExpPath.state.propsName = propsName;
    callExpPath.replaceWith(path.node);
    return;
  }

  const expressions = path.get('quasi').get('expressions');
  const quasis = path.get('quasi').get('quasis');
  // Evaluate CSS comment location and nesting depth
  const expMeta = calcExpressionStats(quasis, expressions);
  // Validate and transform all expressions
  expressions.forEach((ex, i) => {
    if (t.isStringLiteral(ex)) {
      return;
    } else if (t.isArrayExpression(ex)) {
      // Validate
      let elements = ex.get('elements') as NodePath<any>[];
      if (elements.length !== 1) {
        throw ex.buildCodeFrameError(
          'Modifier expression array must contain only 1 element'
        );
      }

      let el1 = elements[0];
      if (!el1 || (propsName && !el1.getSource().includes(propsName))) {
        throw ex.buildCodeFrameError(
          `Expected modifier condition to access ${propsName}`
        );
      }
      if (!t.isExpression(el1.node)) {
        throw ex.buildCodeFrameError(
          'Expected modifier condition to be an expression'
        );
      }

      if (expMeta[i].nestLevel > 0 && !expMeta[i].inComment) {
        throw ex.buildCodeFrameError('Modifier expression must not be nested.');
      }

      if (!expMeta[i].valid && !expMeta[i].inComment) {
        throw ex.buildCodeFrameError(
          'Modifier expressions must target the root selector and may not be preceded by a dot.'
        );
      }

      if (
        !t.isFunctionExpression(el1.node) &&
        !t.isArrowFunctionExpression(el1.node)
      ) {
        if (parentWasArrow) {
          makeArrow(el1, propsName);
        } else {
          throw el1.buildCodeFrameError(
            'You must wrap the styled tag in an arrow function or this condition must be a function.'
          );
        }
      }

      // Transform to arrow function if props are referenced
    } else if (
      parentWasArrow &&
      ex.getSource().includes(propsName) &&
      !t.isFunctionExpression(ex.node) &&
      !t.isArrowFunctionExpression(ex.node)
    ) {
      makeArrow(ex, propsName);
    }
  });

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<t.Expression>, i) => {
      if (expMeta[i].inComment) {
        return { kind: ValueType.VALUE, value: expMeta[i].placeholder };
      }
      const result = ex.evaluate();
      if (result.confident) {
        throwIfInvalid(result.value, ex);
        return { kind: ValueType.VALUE, value: result.value };
      }

      if (
        options.evaluate &&
        !(t.isFunctionExpression(ex) || t.isArrowFunctionExpression(ex))
      ) {
        return { kind: ValueType.LAZY, ex };
      }

      return { kind: ValueType.FUNCTION, ex };
    }
  );

  if (styled && 'name' in styled.component.node) {
    expressionValues.push({
      kind: ValueType.LAZY,
      ex: styled.component.node.name,
    });
  }

  // Add expression metadata to state
  if (!path.state) {
    path.state = {};
  }
  path.state.expMeta = expMeta;

  state.queue.push({
    styled: styled || undefined,
    path,
    expressionValues,
  });
}
