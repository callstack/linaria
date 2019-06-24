/* eslint-disable no-param-reassign */

import { basename, dirname, relative } from 'path';
import { types } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';
import toValidCSSIdentifier from '../utils/toValidCSSIdentifier';
import slugify from '../../slugify';
import getLinariaComment from '../utils/getLinariaComment';

export default function TaggedTemplateExpression(
  path: NodePath<types.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { tag } = path.node;

  let styled: {
    component: {
      node: types.Expression | NodePath<types.Expression>;
    };
  } | null = null;
  let css: boolean = false;

  if (
    types.isCallExpression(tag) &&
    types.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    const tagPath = path.get('tag') as NodePath<types.CallExpression>;
    styled = {
      component: tagPath.get('arguments')[0] as NodePath<types.Expression>,
    };
  } else if (
    types.isMemberExpression(tag) &&
    types.isIdentifier(tag.object) &&
    types.isIdentifier(tag.property) &&
    tag.object.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    styled = {
      component: { node: types.stringLiteral(tag.property.name) },
    };
  } else if (
    hasImport(types, path.scope, state.file.opts.filename, 'css', 'linaria')
  ) {
    css = types.isIdentifier(tag) && tag.name === 'css';
  }

  if (!styled && !css) {
    return;
  }

  const expressions = path.get('quasi').get('expressions');

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<types.Expression>) => {
      const result = ex.evaluate();
      if (result.confident) {
        throwIfInvalid(result.value, ex);
        return { kind: ValueType.VALUE, value: result.value };
      }

      if (
        options.evaluate &&
        !(types.isFunctionExpression(ex) || types.isArrowFunctionExpression(ex))
      ) {
        return { kind: ValueType.LAZY, ex };
      }

      return { kind: ValueType.FUNCTION, ex };
    }
  );

  // Increment the index of the style we're processing
  // This is used for slug generation to prevent collision
  // Also used for display name if it couldn't be determined
  state.index++;

  let [slug, displayName] = getLinariaComment(path);

  const parent = path.findParent(
    p =>
      types.isObjectProperty(p) ||
      types.isJSXOpeningElement(p) ||
      types.isVariableDeclarator(p)
  );

  if (!displayName && parent) {
    const parentNode = parent.node;
    if (types.isObjectProperty(parentNode)) {
      displayName = parentNode.key.name || parentNode.key.value;
    } else if (
      types.isJSXOpeningElement(parentNode) &&
      types.isJSXIdentifier(parentNode.name)
    ) {
      displayName = parentNode.name.name;
    } else if (
      types.isVariableDeclarator(parentNode) &&
      types.isIdentifier(parentNode.id)
    ) {
      displayName = parentNode.id.name;
    }
  }

  if (!displayName) {
    // Try to derive the path from the filename
    displayName = basename(state.file.opts.filename);

    if (/^index\.[a-z0-9]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = basename(dirname(state.file.opts.filename));
    }

    // Remove the file extension
    displayName = displayName.replace(/\.[a-z0-9]+$/, '');

    if (displayName) {
      displayName += state.index;
    } else {
      throw path.buildCodeFrameError(
        "Couldn't determine a name for the component. Ensure that it's either:\n" +
          '- Assigned to a variable\n' +
          '- Is an object property\n' +
          '- Is a prop in a JSX element\n'
      );
    }
  }

  // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file
  slug =
    slug ||
    toValidCSSIdentifier(
      `${displayName.charAt(0).toLowerCase()}${slugify(
        `${relative(state.file.opts.root, state.file.opts.filename)}:${
          state.index
        }`
      )}`
    );

  // Save evaluated slug and displayName for future usage in templateProcessor
  path.addComment('leading', `linaria ${slug} ${displayName}`);

  if (styled && 'name' in styled.component.node) {
    expressionValues.push({
      kind: ValueType.LAZY,
      ex: styled.component.node.name,
    });
  }

  state.queue.push({
    styled: styled || undefined,
    path,
    expressionValues,
  });
}
