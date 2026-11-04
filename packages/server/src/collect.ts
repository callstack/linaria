import type { AtRule, ChildNode } from 'postcss';
import postcss from 'postcss';

type CollectResult = {
  critical: string;
  other: string;
};

interface ClassnameModifiers {
  blockedClasses?: string[];
  ignoredClasses?: string[];
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
  const htmlClasses = new Set<string>();
  const regex = /\s+class="([^"]+)"/gm;
  let match = regex.exec(html);
  const ignoredClassesDeduped = new Set(ignoredClasses);

  while (match !== null) {
    match[1].split(' ').forEach((className) => {
      // eslint-disable-next-line no-param-reassign
      className = escapeRegex(className);
      if (className !== '' && !ignoredClassesDeduped.has(className)) {
        htmlClasses.add(className);
      }
    });
    match = regex.exec(html);
  }

  // No `g` flag: `test` must not carry `lastIndex` over from one selector to the next
  return new RegExp(Array.from(htmlClasses).join('|'), 'm');
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
  // No `g` flag: `test` must not carry `lastIndex` over from one selector to the next
  const blockedClassesRegExp = new RegExp(
    blockedClassesSanitized.join('|'),
    'm'
  );

  const isCritical = (rule: ChildNode) => {
    // Only check class names selectors
    if ('selector' in rule && rule.selector.startsWith('.')) {
      const isExcluded =
        blockedClasses.length > 0 && blockedClassesRegExp.test(rule.selector);
      if (isExcluded) return false;

      return htmlClassesRegExp.test(rule.selector);
    }

    return true;
  };

  // Nodes are collected first and moved to `critical` and `other` at the end. Moving a node with `append` removes
  // it from its parent with `splice`, so moving top-level rules one by one made `collect` quadratic in their number.
  const criticalNodes: ChildNode[] = [];
  const otherNodes: ChildNode[] = [];
  const handledTopLevelAtRules = new Set<AtRule>();

  const handleAtRule = (rule: AtRule) => {
    if (rule.name === 'keyframes') {
      return;
    }

    const criticalRule = rule.clone();
    const otherRule = rule.clone();

    criticalRule.each((childRule: ChildNode) => {
      if (!isCritical(childRule)) {
        childRule.remove();
      }
    });
    otherRule.each((childRule: ChildNode) => {
      if (isCritical(childRule)) {
        childRule.remove();
      }
    });

    if (rule.parent?.type === 'root') {
      // Detached together with the rest of the stylesheet below
      handledTopLevelAtRules.add(rule);
    } else {
      rule.remove();
    }

    if (criticalRule.nodes?.length) {
      criticalNodes.push(criticalRule);
    }
    if (otherRule.nodes?.length) {
      otherNodes.push(otherRule);
    }
  };

  stylesheet.walkAtRules('font-face', (rule) => {
    /**
     * @font-face rules may be defined also in CSS conditional groups (eg. @media)
     * we want only handle those from top-level, rest will be handled in stylesheet.walkRules
     */
    if (rule.parent?.type === 'root') {
      criticalNodes.push(rule);
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
      criticalNodes.push(rule);
    } else {
      otherNodes.push(rule);
    }
  });

  // Keyframes are looked up only where they used to stay in the stylesheet: in top-level at-rules that were not
  // handled. Top-level rules and handled at-rules leave the stylesheet with their contents.
  const keyframes: AtRule[] = [];
  stylesheet.each((node) => {
    if (node.type !== 'atrule' || handledTopLevelAtRules.has(node)) {
      return;
    }
    if (node.name === 'keyframes') {
      keyframes.push(node);
    } else {
      node.walkAtRules('keyframes', (rule) => {
        keyframes.push(rule);
      });
    }
  });

  // Detach all top-level nodes at once, so `append` does not remove them from the stylesheet one by one
  stylesheet.removeAll();
  // One call per root, while it is empty: postcss 8.4 gives a node appended to a root of two or more nodes the
  // whitespace of the last one, so appending one by one lost the source whitespace from the third rule on
  critical.append(criticalNodes);
  other.append(otherNodes);

  critical.walkDecls(/animation/, (decl) => {
    animations.add(decl.value.split(' ')[0]);
  });

  keyframes.forEach((rule) => {
    if (animations.has(rule.params)) {
      critical.append(rule);
    }
  });

  // The first node still has the whitespace that preceded it in the stylesheet
  if (critical.first) {
    critical.first.raws.before = '';
  }
  if (other.first) {
    other.first.raws.before = '';
  }

  return {
    critical: critical.toString(),
    other: other.toString(),
  };
}
