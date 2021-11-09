import postcss from 'postcss';
import { slugify } from '@linaria/utils';

export default function atomize(cssText: string) {
  const atomicRules: {
    className: string;
    cssText: string;
    property: string;
  }[] = [];

  const stylesheet = postcss.parse(cssText);

  stylesheet.walkDecls((decl) => {
    const parent = decl.parent;
    if (parent === stylesheet) {
      const line = `${decl.prop}: ${decl.value};`;
      const className = `atm_${slugify(line)}`;
      atomicRules.push({
        property: decl.prop,
        className,
        cssText: line,
      });
    }
  });
  // Things like @media rules
  stylesheet.walkAtRules((atRule) => {
    atRule.walkDecls((decl) => {
      const slug = slugify(
        [atRule.name, atRule.params, decl.prop, decl.value].join(';')
      );
      const className = `atm_${slug}`;
      atomicRules.push({
        // For @ rules we want the unique property we do merging on to contain
        // the atrule params, eg. `media only screen and (max-width: 600px)`
        // But not the value. That way, our hashes will match when the media rule +
        // the declaration property match, and we can merge atomic media rules
        property: [atRule.name, atRule.params, decl.prop].join(' '),
        className,
        cssText: `@${atRule.name} ${atRule.params} { .${className} { ${decl.prop}: ${decl.value}; } }`,
      });
    });
  });

  return atomicRules;
}
