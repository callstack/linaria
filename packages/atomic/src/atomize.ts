import postcss, { Document, AtRule, Container, Rule } from 'postcss';
import { slugify } from '@linaria/utils';
import stylis from 'stylis';

export default function atomize(cssText: string) {
  stylis.set({
    prefix: false,
    keyframe: false,
  });
  const atomicRules: {
    className?: string;
    cssText: string;
    property: string;
  }[] = [];

  const stylesheet = postcss.parse(cssText);

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

    // Traverse the declarations parents, and collect them all.
    while (thisParent && thisParent !== stylesheet) {
      parents.unshift(thisParent);
      if (thisParent.type === 'atrule') {
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
    const slug = slugify([...atomicProperty, decl.value].join(';'));
    const className = `atm_${slug}`;

    const processedCss = stylis(`.${className}`, css);

    atomicRules.push({
      property: atomicProperty.join(' '),
      className,
      cssText: processedCss,
    });
  });

  // The most common reason for sorting these rules is so that @media queries appear after rules that they might override. For example,
  // .atm_foo { background: red; }
  // @media (max-width: 500px) { .atm_bar { background: white; } }
  // it's very likely that the media atom should come after the other background atom.
  // This is necessary because media queries don't add specificity to the rules.
  // In general also, this deterministic ordering is helpful.
  return atomicRules.sort((a, b) => (a.cssText > b.cssText ? 1 : -1));
}
