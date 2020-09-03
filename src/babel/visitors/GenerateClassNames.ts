/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it generates a slug that will be used as a CSS class for particular Template Expression,
 * and generates a display name for class or styled components.
 * It saves that meta data as comment above the template, to be later used in templateProcessor.
 */

import { basename, dirname, relative } from 'path';
import type { TaggedTemplateExpression } from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { State, StrictOptions } from '../types';
import toValidCSSIdentifier from '../utils/toValidCSSIdentifier';
import slugify from '../../slugify';
import getLinariaComment from '../utils/getLinariaComment';
import { debug } from '../utils/logger';
import isStyledOrCss from '../utils/isStyledOrCss';
import { Core } from '../babel';

export default function GenerateClassNames(
  babel: Core,
  path: NodePath<TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { types: t } = babel;
  const styledOrCss = isStyledOrCss(babel, path, state);
  if (!styledOrCss) {
    return;
  }

  const expressions = path.get('quasi').get('expressions');

  debug('template-parse:identify-expressions', expressions.length);

  // Increment the index of the style we're processing
  // This is used for slug generation to prevent collision
  // Also used for display name if it couldn't be determined
  state.index++;

  let [slug, displayName, predefinedClassName] = getLinariaComment(path);

  const parent = path.findParent(
    (p) =>
      t.isObjectProperty(p) ||
      t.isJSXOpeningElement(p) ||
      t.isVariableDeclarator(p)
  );

  if (!displayName && parent) {
    const parentNode = parent.node;
    if (t.isObjectProperty(parentNode)) {
      if ('name' in parentNode.key) {
        displayName = parentNode.key.name;
      } else if ('value' in parentNode.key) {
        displayName = parentNode.key.value.toString();
      } else {
        throw new Error(
          `Unexpected object property key ${parentNode.key.type}`
        );
      }
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

  // The className can be defined by the user either as fn or a string
  if (typeof options.classNameSlug === 'function') {
    try {
      className = toValidCSSIdentifier(
        options.classNameSlug(slug, displayName)
      );
    } catch {
      throw new Error(`classNameSlug option must return a string`);
    }
  }

  if (typeof options.classNameSlug === 'string') {
    const { classNameSlug } = options;

    // Available variables for the square brackets used in `classNameSlug` options
    const classNameSlugVars: Record<string, string | null> = {
      hash: slug,
      title: displayName,
    };

    // Variables that were used in the config for `classNameSlug`
    const optionVariables = classNameSlug.match(/\[.*?]/g) || [];
    let cnSlug = classNameSlug;

    for (let i = 0, l = optionVariables.length; i < l; i++) {
      const v = optionVariables[i].slice(1, -1); // Remove the brackets around the variable name

      // Replace the var if it key and value exist otherwise place an empty string
      cnSlug = cnSlug.replace(`[${v}]`, classNameSlugVars[v] || '');
    }

    className = toValidCSSIdentifier(cnSlug);
  }

  debug(
    'template-parse:generated-meta',
    `slug: ${slug}, displayName: ${displayName}, className: ${className}`
  );

  // Save evaluated slug and displayName for future usage in templateProcessor
  path.addComment('leading', `linaria ${slug} ${displayName} ${className}`);
}
