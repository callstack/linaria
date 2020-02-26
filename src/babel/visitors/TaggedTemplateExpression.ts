/* eslint-disable no-param-reassign */

import { basename, dirname, relative } from 'path';
import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import throwIfInvalid from '../utils/throwIfInvalid';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, ValueType, ExpressionValue } from '../types';
import toValidCSSIdentifier from '../utils/toValidCSSIdentifier';
import slugify from '../../slugify';
import getLinariaComment from '../utils/getLinariaComment';

export default function TaggedTemplateExpression(
  path: NodePath<t.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { tag } = path.node;

  const localName = state.file.metadata.localName || 'styled';

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
    tag.callee.name === localName &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      localName,
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
    tag.object.name === localName &&
    hasImport(
      t,
      path.scope,
      state.file.opts.filename,
      localName,
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

  const expressions = path.get('quasi').get('expressions');

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<t.Expression>) => {
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

  // Increment the index of the style we're processing
  // This is used for slug generation to prevent collision
  // Also used for display name if it couldn't be determined
  state.index++;

  let [slug, displayName, predefinedClassName] = getLinariaComment(path);

  const parent = path.findParent(
    p =>
      t.isObjectProperty(p) ||
      t.isJSXOpeningElement(p) ||
      t.isVariableDeclarator(p)
  );

  if (!displayName && parent) {
    const parentNode = parent.node;
    if (t.isObjectProperty(parentNode)) {
      displayName = parentNode.key.name || parentNode.key.value;
    } else if (
      t.isJSXOpeningElement(parentNode) &&
      t.isJSXIdentifier(parentNode.name)
    ) {
      displayName = parentNode.name.name;
    } else if (
      t.isVariableDeclarator(parentNode) &&
      t.isIdentifier(parentNode.id)
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

  let className = predefinedClassName
    ? predefinedClassName
    : options.displayName
    ? `${toValidCSSIdentifier(displayName!)}_${slug!}`
    : slug!;

  // Optional the className can be defined by the user
  if (typeof options.classNameSlug === 'string') {
    const { classNameSlug } = options;

    // Available variables for the square brackets used in `classNameSlug` options
    const classNameSlugVars: Record<string, string | null> = {
      hash: slug,
      title: displayName,
    };

    // Variables that were used in the config for `classNameSlug`
    const optionVariables = classNameSlug.match(/\[.*?\]/g) || [];
    let cnSlug = classNameSlug;

    for (let i = 0, l = optionVariables.length; i < l; i++) {
      const v = optionVariables[i].slice(1, -1); // Remove the brackets around the variable name

      // Replace the var if it key and value exist otherwise place an empty string
      cnSlug = cnSlug.replace(`[${v}]`, classNameSlugVars[v] || '');
    }

    className = toValidCSSIdentifier(cnSlug);
  }

  // Save evaluated slug and displayName for future usage in templateProcessor
  path.addComment('leading', `linaria ${slug} ${displayName} ${className}`);

  if (styled && 'name' in styled.component.node) {
    // It's not a real dependency.
    // It can be simplified because we need just a className.
    expressionValues.push({
      // kind: ValueType.COMPONENT,
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
