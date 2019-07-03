/* @flow */

const React = require('react'); // eslint-disable-line import/no-extraneous-dependencies
const { default: validAttr } = require('@emotion/is-prop-valid');
const { cx } = require('../index');

type Options = {
  name: string,
  class: string,
  vars?: {
    [string]: [
      string | number | ((props: *) => string | number),
      string | void,
    ],
  },
};

const warnIfInvalid = (value: any, componentName) => {
  if (process.env.NODE_ENV !== 'production') {
    if (
      typeof value === 'string' ||
      // eslint-disable-next-line no-self-compare
      (typeof value === 'number' && isFinite(value))
    ) {
      return;
    }

    const stringified =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    // eslint-disable-next-line no-console
    console.warn(
      `An inteprolation evaluated to '${stringified}' in the component '${componentName}', which is probably a mistake. You should explicitly cast or transform the value to a string.`
    );
  }
};

let ieRulesCache;
let ieRulesSheet: CSSStyleSheet;
let ieRulesCacheInited: boolean;

function ieInitRulesCache() {
  if (ieRulesCacheInited) {
    return;
  }
  ieRulesCacheInited = true;

  document.head.appendChild(document.createElement('style'));
  // Last style sheet is ours.
  ieRulesSheet = document.styleSheets[document.styleSheets.length - 1];
}

function ieInsertRule(id: string, rule: string) {
  ieInitRulesCache();
  ieRulesSheet.insertRule(rule, 0);
}

function ieDeleteRule(id: string) {}

function handleIE(comp, options, filteredProps, name, value, unit) {
  // IE does not support CSS variables. We need to replace every instance of
  // the CSS variable ourselves for all rulesets on filteredProps.className.
  // We keep track of which rules we've inserted in a map from className
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];

    for (let j = 0; j < sheet.rules.length; j++) {
      const rule = sheet.rules[j];

      // If the selector contains our class name and the css text includes the variable,
      // then we need to adjust our rule for this particular component instance.
      if (
        rule.selectorText.includes(options.class) &&
        rule.cssText.includes(name)
      ) {
        const transformedClassName = `${options.class}-${name}`;
        // eslint-disable-next-line no-param-reassign
        filteredProps.className = cx(options.class, transformedClassName);

        let transformedRule = rule.cssText.replace(
          options.class,
          transformedClassName
        );
        transformedRule = transformedRule.replace(
          `var(--${name})`,
          `${value}${unit}`
        );

        // Used by lifecycle methods in Component in styled.
        // eslint-disable-next-line no-param-reassign
        comp.ieInsertRule = () => {
          ieInsertRule(transformedClassName, transformedRule);
        };
        // eslint-disable-next-line no-param-reassign
        comp.ieDeleteRule = () => {
          ieDeleteRule(transformedClassName);
        };
        // Only one rule can ever match.
        return;
      }
    }
  }
}

function styled(tag: React.ComponentType<*> | string) {
  return (options: Options) => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly. See https://github.com/callstack/linaria#setup'
        );
      }
    }

    class Component extends React.Component {
      componentDidMount() {
        if (this.ieInsertRule) {
          this.ieInsertRule();
        }
      }

      componentDidUpdate() {
        if (this.ieInsertRule) {
          this.ieInsertRule();
        }
      }

      componentWillUnmount() {
        if (this.ieDeleteRule) {
          this.ieDeleteRule();
        }
      }

      render() {
        const { props } = this;
        const ref = props.innerRef;
        const { as: component = tag, class: className, ...rest } = props;

        let filteredProps;

        // Check if it's an HTML tag and not a custom element
        if (typeof component === 'string' && component.indexOf('-') === -1) {
          filteredProps = {};

          // eslint-disable-next-line guard-for-in
          for (const key in rest) {
            if (key === 'as' || validAttr(key)) {
              // Don't pass through invalid attributes to HTML elements
              filteredProps[key] = rest[key];
            }
          }
        } else {
          filteredProps = rest;
        }

        filteredProps.ref = ref;
        filteredProps.className = cx(
          filteredProps.className || className,
          options.class
        );

        const { vars } = options;

        if (vars) {
          const style = {};

          // eslint-disable-next-line guard-for-in
          for (const name in vars) {
            const [result, unit = ''] = vars[name];
            const value = typeof result === 'function' ? result(props) : result;

            warnIfInvalid(value, options.name);

            style[`--${name}`] = `${value}${unit}`;

            if (!onInternetExplorer()) {
              handleIE(this, options, filteredProps, name, value, unit);
            }
          }

          filteredProps.style = Object.assign(style, filteredProps.style);
        }

        /* $FlowFixMe */
        if (tag.__linaria && tag !== component) {
          // If the underlying tag is a styled component, forward the `as` prop
          // Otherwise the styles from the underlying component will be ignored
          filteredProps.as = component;

          return React.createElement(tag, filteredProps);
        }

        return React.createElement(component, filteredProps);
      }
    }

    // const Result = React.forwardRef(Component);
    const Result = Component;

    Result.displayName = options.name;

    // These properties will be read by the babel plugin for interpolation
    /* $FlowFixMe */
    Result.__linaria = {
      className: options.class,
      extends: tag,
    };

    return Result;
  };
}

if (process.env.NODE_ENV !== 'production') {
  module.exports = new Proxy(styled, {
    get(o, prop) {
      return o(prop);
    },
  });
} else {
  module.exports = styled;
}

type CSSProperties = {
  [key: string]: string | number | CSSProperties,
};

type StyledComponent<T> = React.ComponentType<T & { as?: React$ElementType }>;

type StyledTag<T> = (
  strings: string[],
  ...exprs: Array<string | number | CSSProperties | (T => string | number)>
) => StyledComponent<T>;

type StyledJSXIntrinsics = $ObjMap<
  $JSXIntrinsics,
  () => StyledTag<{ children?: React$Node, [key: string]: any }>
>;

declare module.exports: StyledJSXIntrinsics & {|
  <T>(T): StyledTag<React.ElementConfig<T>>,
|};

function onInternetExplorer(): boolean {
  const ua = window.navigator.userAgent;
  return ua.includes('MSI ') || ua.includes('Trident/');
}
