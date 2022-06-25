import generator from '@babel/generator';
import { statement } from '@babel/template';
import type { NodePath } from '@babel/traverse';
import type { Program, Expression, TemplateElement } from '@babel/types';

import type BaseProcessor from '@linaria/core/processors/BaseProcessor';
import { debug, error } from '@linaria/logger';

import type { Core } from '../babel';
import evaluate from '../evaluators';
import type {
  StrictOptions,
  Value,
  ValueCache,
  ExpressionValue,
  Dependencies,
} from '../types';

const exportsLinariaPrevalTpl = statement(
  'exports.__linariaPreval = %%expressions%%'
);

function addLinariaPreval(
  { types: t }: Core,
  path: NodePath<Program>,
  expressions: Array<Expression>
): Program {
  // Constant __linariaPreval with all dependencies
  const statements = [
    exportsLinariaPrevalTpl({
      expressions: t.arrayExpression(expressions),
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

function hasPreval(exports: unknown): exports is {
  __linariaPreval: (() => Value)[] | null | undefined;
} {
  if (!exports || typeof exports !== 'object') {
    return false;
  }

  return '__linariaPreval' in exports;
}

const wrap = <T>(fn: () => T): T | Error => {
  try {
    return fn();
  } catch (e) {
    return e as Error;
  }
};

const isLazyValue = (
  value: ExpressionValue | TemplateElement
): value is ExpressionValue => 'kind' in value;

export default function evaluateExpressions(
  babel: Core,
  program: NodePath<Program>,
  processors: BaseProcessor[],
  options: StrictOptions,
  filename: string
): Dependencies {
  const dependencies: Dependencies = [];

  const expressions: ExpressionValue[] = [];

  processors.forEach((processor) =>
    [
      ...processor.template.filter(isLazyValue),
      ...processor.dependencies,
    ].forEach((dependency) => {
      expressions.push(dependency);
    })
  );

  let lazyValues: (() => Value)[] = [];

  if (expressions.length > 0) {
    debug(
      'lazy-deps:expressions-to-eval-list',
      expressions.map((ex) => ex.source)
    );

    const programWithPreval = addLinariaPreval(
      babel,
      program,
      expressions.map((ex) => ex.ex)
    );

    const { code } = generator(programWithPreval);
    debug('lazy-deps:evaluate', '');
    try {
      const evaluation = evaluate(code, filename, options);
      debug('lazy-deps:sub-files', evaluation.dependencies);

      dependencies.push(...evaluation.dependencies);
      lazyValues = hasPreval(evaluation.value)
        ? evaluation.value.__linariaPreval || []
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

  const valueCache: ValueCache = new WeakMap();

  // eslint-disable-next-line no-restricted-syntax
  expressions.forEach((ex, idx) => {
    const value = wrap(lazyValues[idx]);
    valueCache.set(ex.ex, value);
  });

  processors.forEach((processor) => {
    processor.build(valueCache);
  });

  return dependencies;
}
