import { basename, dirname, extname, relative, sep } from 'path';

import { debug } from '@linaria/logger';
import type { ClassNameSlugVars } from '@linaria/utils';
import { slugify } from '@linaria/utils';

import toValidCSSIdentifier from './toValidCSSIdentifier';
import type { IFileContext, IOptions } from './types';

const isSlugVar = (
  key: string,
  slugVars: ClassNameSlugVars
): key is keyof ClassNameSlugVars => key in slugVars;

export default function getClassNameAndSlug(
  displayName: string,
  idx: number,
  options: IOptions,
  context: IFileContext
): { className: string; slug: string } {
  const relativeFilename =
    context.root && context.filename
      ? relative(context.root, context.filename)
      : context.filename ?? 'unknown';
  // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file
  const slug = toValidCSSIdentifier(
    `${displayName.charAt(0).toLowerCase()}${slugify(
      `${relativeFilename}:${idx}`
    )}`
  );

  // Collect some useful replacement patterns from the filename
  // Available variables for the square brackets used in `classNameSlug` options
  const ext = extname(relativeFilename);
  const slugVars: ClassNameSlugVars = {
    hash: slug,
    title: displayName,
    file: relativeFilename,
    ext,
    name: basename(relativeFilename, ext),
    dir: dirname(relativeFilename).split(sep).pop() as string,
  };

  let className = options.displayName
    ? `${toValidCSSIdentifier(displayName!)}_${slug!}`
    : slug!;

  // The className can be defined by the user either as fn or a string
  if (typeof options.classNameSlug === 'function') {
    try {
      className = toValidCSSIdentifier(
        options.classNameSlug(slug, displayName, slugVars)
      );
    } catch {
      throw new Error('classNameSlug option must return a string');
    }
  }

  if (typeof options.classNameSlug === 'string') {
    const { classNameSlug } = options;

    // Variables that were used in the config for `classNameSlug`
    const optionVariables = classNameSlug.match(/\[.*?]/g) || [];
    let cnSlug = classNameSlug;

    for (let i = 0, l = optionVariables.length; i < l; i++) {
      const v = optionVariables[i].slice(1, -1); // Remove the brackets around the variable name

      // Replace the var if it key and value exist otherwise place an empty string
      cnSlug = cnSlug.replace(
        `[${v}]`,
        isSlugVar(v, slugVars) ? slugVars[v] : ''
      );
    }

    className = toValidCSSIdentifier(cnSlug);
  }

  debug(
    'template-parse:generated-meta',
    `slug: ${slug}, displayName: ${displayName}, className: ${className}`
  );

  return { className, slug };
}
