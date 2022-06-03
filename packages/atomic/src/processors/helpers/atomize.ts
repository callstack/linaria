import { all as knownProperties } from 'known-css-properties';
import type { Document, AtRule, Container, Rule } from 'postcss';
import postcss from 'postcss';
import stylis from 'stylis';

import { slugify } from '@linaria/utils';

import { getPropertyPriority } from './propertyPriority';

const knownPropertiesMap = knownProperties.reduce(
  (acc: { [property: string]: number }, property, i) => {
    acc[property] = i;
    return acc;
  },
  {}
);

function hashProperty(property: string) {
  const index = knownPropertiesMap[property];
  // If it's a known property, let's use the index to cut down the length of the hash.
  // otherwise, slugify
  if (index !== undefined) {
    return index.toString(36); // base 36 so that we get a-z,0-9
  }
  return slugify(property);
}

const parseCss = (cssText: string) => {
  try {
    return postcss.parse(cssText);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Error parsing CSS: ${e.message}\nCSS:\n${cssText}`);
    }

    throw new Error(`Unknown error parsing CSS.\nCSS:\n${cssText}`);
  }
};

export default function atomize(cssText: string, hasPriority = false) {
  stylis.set({
    prefix: false,
    keyframe: false,
  });
  const atomicRules: {
    className?: string;
    cssText: string;
    property: string;
  }[] = [];

  const stylesheet = parseCss(cssText);

  // We want to extract all keyframes and leave them as-is.
  // This isn't scoped locally yet
  stylesheet.walkAtRules('keyframes', (atRule) => {
    atRule.remove();
    atomicRules.push({
      property: atRule.name,
      cssText: atRule.toString(),
    });
  });

  stylesheet.walkDecls((decl) => {
    let thisParent: Document | Container | undefined = decl.parent;
    const parents: (Document | Container)[] = [];
    const atomicProperty = [decl.prop];
    let hasAtRule = false;

    // Traverse the declarations parents, and collect them all.
    while (thisParent && thisParent !== stylesheet) {
      parents.unshift(thisParent);
      if (thisParent.type === 'atrule') {
        hasAtRule = true;
        // @media queries, @supports etc.
        atomicProperty.push(
          (thisParent as AtRule).name,
          (thisParent as AtRule).params
        );
      } else if (thisParent.type === 'rule') {
        // pseudo classes etc.
        atomicProperty.push((thisParent as Rule).selector);
      }

      thisParent = thisParent.parent;
    }

    // Create a new stylesheet that contains *just* the extracted atomic rule and wrapping selectors, eg.
    // `@media (max-width: 400px) { background: red; }`, or
    // `&:hover { background: red; }`, or
    // `background: red;`
    // We do this so we can run it through stylis, to produce a full atom, eg.
    // `@media (max-width: 400px) { .atm_foo { background: red; } }`
    const root = postcss.root();
    let container: Document | Container = root;
    parents.forEach((parent) => {
      const newNode = parent.clone();
      newNode.removeAll();
      container.append(newNode);
      container = newNode;
    });
    container.append(decl.clone());

    const css = root.toString();
    const propertySlug = hashProperty([...atomicProperty].join(';'));
    const valueSlug = slugify(decl.value);
    const className = `atm_${propertySlug}_${valueSlug}`;

    const propertyPriority =
      getPropertyPriority(decl.prop) +
      (hasAtRule ? 1 : 0) +
      (hasPriority ? 1 : 0);
    const processedCss = stylis(`.${className}`.repeat(propertyPriority), css);

    atomicRules.push({
      property: atomicProperty.join(' '),
      className,
      cssText: processedCss,
    });
  });

  return atomicRules;
}
