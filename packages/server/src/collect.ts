import type { AtRule, ChildNode } from 'postcss';
import postcss from 'postcss';

type CollectResult = {
  critical: string;
  other: string;
};

interface ClassnameModifiers {
  ignoredClasses?: string[];
  blockedClasses?: string[];
}

/**
 * Used to escape `RegExp`
 * [syntax characters](https://262.ecma-international.org/7.0/#sec-regular-expressions-patterns).
 */
function escapeRegex(string: string) {
  return string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

const extractClassesFromHtml = (
  html: string,
  ignoredClasses: string[]
): RegExp => {
  const htmlClasses: string[] = [];
  const regex = /\s+class="([^"]+)"/gm;
  let match = regex.exec(html);
  const ignoredClassesDeduped = new Set(ignoredClasses);

  while (match !== null) {
    match[1].split(' ').forEach((className) => {
      // eslint-disable-next-line no-param-reassign
      className = escapeRegex(className);
      if (className !== '' && !ignoredClassesDeduped.has(className)) {
        htmlClasses.push(className);
      }
    });
    match = regex.exec(html);
  }

  return new RegExp(htmlClasses.join('|'), 'gm');
};

/**
 * This utility extracts critical CSS from given HTML and CSS file to be used in SSR environments
 * @param {string} html the HTML from which classes will be parsed
 * @param {string} css the CSS file from which selectors will be parsed and determined as critical or other
 * @param {string[]} ignoredClasses classes that, when present in the HTML, will not be included in the regular expression used to match selectors
 * @param {string[]} blockedClasses classes that, when contained in a selector, will cause the selector to be marked as not critical
 * @returns {CollectResult} object containing the critical and other CSS styles
 */
export default function collect(
  html: string,
  css: string,
  classnameModifiers?: ClassnameModifiers
): CollectResult {
  const animations = new Set();
  const other = postcss.root();
  const critical = postcss.root();
  const stylesheet = postcss.parse(css);
  const ignoredClasses = classnameModifiers?.ignoredClasses ?? [];
  const blockedClasses = classnameModifiers?.blockedClasses ?? [];

  const htmlClassesRegExp = extractClassesFromHtml(html, ignoredClasses);
  const blockedClassesSanitized = blockedClasses.map(escapeRegex);
  const blockedClassesRegExp = new RegExp(
    blockedClassesSanitized.join('|'),
    'gm'
  );

  const isCritical = (rule: ChildNode) => {
    // Only check class names selectors
    if ('selector' in rule && rule.selector.startsWith('.')) {
      const isExcluded =
        blockedClasses.length > 0 && blockedClassesRegExp.test(rule.selector);
      if (isExcluded) return false;

      return Boolean(rule.selector.match(htmlClassesRegExp));
    }

    return true;
  };

  const handleAtRule = (rule: AtRule) => {
    if (rule.name === 'keyframes') {
      return;
    }

    const criticalRule = rule.clone();
    const otherRule = rule.clone();

    let removedNodesFromOther = 0;
    criticalRule.each((childRule: ChildNode, index: number) => {
      if (isCritical(childRule)) {
        otherRule.nodes[index - removedNodesFromOther]?.remove();
        removedNodesFromOther += 1;
      } else {
        childRule.remove();
      }
    });

    rule.remove();

    if (criticalRule.nodes.length > 0) {
      critical.append(criticalRule);
    }
    if (otherRule.nodes.length > 0) {
      other.append(otherRule);
    }
  };

  stylesheet.walkAtRules('font-face', (rule) => {
    /**
     * @font-face rules may be defined also in CSS conditional groups (eg. @media)
     * we want only handle those from top-level, rest will be handled in stylesheet.walkRules
     */
    if (rule.parent?.type === 'root') {
      critical.append(rule);
    }
  });

  const walkedAtRules = new Set();

  stylesheet.walkRules((rule) => {
    if (
      rule.parent &&
      'name' in rule.parent &&
      (rule.parent as { name: string }).name === 'keyframes'
    ) {
      return;
    }

    if (rule.parent?.type === 'atrule') {
      if (!walkedAtRules.has(rule.parent)) {
        handleAtRule(rule.parent as AtRule);
        walkedAtRules.add(rule.parent);
      }
      return;
    }

    if (isCritical(rule)) {
      critical.append(rule);
    } else {
      other.append(rule);
    }
  });

  critical.walkDecls(/animation/, (decl) => {
    animations.add(decl.value.split(' ')[0]);
  });

  stylesheet.walkAtRules('keyframes', (rule) => {
    if (animations.has(rule.params)) {
      critical.append(rule);
    }
  });

  return {
    critical: critical.toString(),
    other: other.toString(),
  };
}
