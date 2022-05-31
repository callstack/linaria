import generator from '@babel/generator';
import { expression, statement } from '@babel/template';
import type { NodePath } from '@babel/traverse';
import type { Program, Expression } from '@babel/types';

import { debug, error } from '@linaria/logger';

import type { Core } from '../babel';
import evaluate from '../evaluators';
import type {
  LazyValue,
  State,
  StrictOptions,
  TemplateExpression,
  Value,
  ValueCache,
  ExpressionValue,
  EvaluatedValue,
} from '../types';
import { ValueType } from '../types';

import throwIfInvalid from './throwIfInvalid';
import unwrapNode from './unwrapNode';

function isLazyValue(v: ExpressionValue): v is LazyValue {
  return v.kind === ValueType.LAZY;
}

function isEvaluatedValue(v: ExpressionValue): v is EvaluatedValue {
  return v.kind === ValueType.VALUE;
}

// All exported values will be wrapped with this function
const expressionWrapperTpl = statement(`
  const %%wrapName%% = (fn) => {
    try {
      return fn();
    } catch (e) {
      return e;
    }
  };
`);

const expressionTpl = expression('%%wrapName%%(() => %%expression%%)');
const exportsLinariaPrevalTpl = statement(
  'exports.__linariaPreval = %%expressions%%'
);

function addLinariaPreval(
  { types: t }: Core,
  path: NodePath<Program>,
  lazyDeps: Array<Expression>
): Program {
  // Constant __linariaPreval with all dependencies
  const wrapName = path.scope.generateUidIdentifier('wrap');
  const statements = [
    expressionWrapperTpl({ wrapName }),
    exportsLinariaPrevalTpl({
      expressions: t.arrayExpression(
        lazyDeps.map((exp) => expressionTpl({ expression: exp, wrapName }))
      ),
    }),
  ];

  const programNode = path.node;
  return t.program(
    [...programNode.body, ...statements],
    programNode.directives,
    programNode.sourceType,
    programNode.interpreter
  );
}

const getExpression = (
  value:
    | {
        originalEx: NodePath<Expression>;
        ex: NodePath<Expression> | Expression;
      }
    | {
        ex: NodePath<Expression>;
      }
): NodePath<Expression> =>
  'originalEx' in value ? value.originalEx : value.ex;

export default function evaluateExpressions(
  babel: Core,
  program: NodePath<Program>,
  templateExpressions: TemplateExpression[],
  options: StrictOptions,
  filename: string
): [dependencies: State['dependencies'], valueCache: ValueCache] {
  const dependencies: State['dependencies'] = [];

  const lazyDeps: Omit<LazyValue, 'kind'>[] = [];
  const evaluatedDeps: Omit<EvaluatedValue, 'kind'>[] = [];

  templateExpressions.forEach(({ expressions, dependencies: deps }) => {
    lazyDeps.push(...expressions.filter(isLazyValue));
    evaluatedDeps.push(...expressions.filter(isEvaluatedValue));

    deps.forEach((dep) => {
      if (dep.value !== undefined) {
        evaluatedDeps.push({
          ex: dep.ex,
          source: dep.source,
          value: dep.value,
        });
      } else {
        lazyDeps.push({
          ex: dep.ex,
          originalEx: dep.ex,
          source: dep.source,
        });
      }
    });
  });

  const expressionsToEvaluate = lazyDeps.map((v) => unwrapNode(v.ex));
  const originalLazyExpressions = lazyDeps.map((v) =>
    unwrapNode(getExpression(v))
  );

  debug('lazy-deps:count', lazyDeps.length);

  let lazyValues: Value[] = [];

  if (expressionsToEvaluate.length > 0) {
    debug(
      'lazy-deps:original-expressions-list',
      originalLazyExpressions.map((node) => generator(node).code)
    );
    debug(
      'lazy-deps:expressions-to-eval-list',
      expressionsToEvaluate.map((node) => generator(node).code)
    );

    const programWithPreval = addLinariaPreval(
      babel,
      program,
      expressionsToEvaluate
    );
    const { code } = generator(programWithPreval);
    debug('lazy-deps:evaluate', '');
    try {
      const evaluation = evaluate(code, filename, options);
      debug('lazy-deps:sub-files', evaluation.dependencies);

      dependencies.push(...evaluation.dependencies);
      lazyValues =
        evaluation.value && typeof evaluation.value !== 'string'
          ? (evaluation.value?.__linariaPreval as Value[]) || []
          : [];
      debug('lazy-deps:values', lazyValues);
    } catch (e: unknown) {
      error('lazy-deps:evaluate:error', code);
      if (e instanceof Error) {
        throw new Error(
          `An unexpected runtime error occurred during dependencies evaluation: \n${e.stack}\n\nIt may happen when your code or third party module is invalid or uses identifiers not available in Node environment, eg. window. \n` +
            'Note that line numbers in above stack trace will most likely not match, because Linaria needed to transform your code a bit.\n'
        );
      } else {
        throw e;
      }
    }
  }

  const valueCache: ValueCache = new Map();

  originalLazyExpressions.forEach((key, idx) => {
    throwIfInvalid(lazyValues[idx], getExpression(lazyDeps[idx]));
    return valueCache.set(key, lazyValues[idx]);
  });

  evaluatedDeps.forEach((dep) => {
    throwIfInvalid(dep.value, dep.ex);
    return valueCache.set(dep.ex.node, dep.value);
  });

  return [dependencies, valueCache];
}
