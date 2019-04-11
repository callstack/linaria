import { parseSync, types as t } from '@babel/core';
import build, { ExternalDep } from './depsGraph';
import isNode from '../utils/isNode';
// import dumpNode from './dumpNode';

/*
 * Returns new tree without dead nodes
 */
function shakeNode<T extends t.Node>(node: T, alive: Set<t.Node>): T {
  if (t.isExportNamedDeclaration(node)) {
    /*
     * We don't need exports so just replace it by declaration
     * - export const a = 42;
     * + const a = 42;
     */

    return shakeNode(node.declaration!, alive) as T;
  }

  const { type } = node;
  // VISITOR_KEYS is not defined in babel typings
  const keys: [keyof T] = (t as any).VISITOR_KEYS[type] || [];
  const changes: Partial<T> = {};
  for (const key of keys) {
    const subNode = node[key];

    if (Array.isArray(subNode)) {
      const list = [];
      let hasChanges = false;
      for (let i = 0; i < subNode.length; i++) {
        const child = subNode[i];
        const isAlive = alive.has(child);
        hasChanges = hasChanges || !isAlive;
        if (child && isAlive) {
          const shaken = shakeNode(child, alive);
          if (shaken) {
            list.push(shaken);
          }

          hasChanges = hasChanges || shaken !== child;
        }
      }
      if (hasChanges) {
        (changes as any)[key] = list;
      }
    } else if (isNode(subNode) && alive.has(subNode)) {
      const shaken = shakeNode(subNode, alive);
      if (shaken && shaken !== subNode) {
        (changes as any)[key] = shaken;
      }
    }
  }

  return Object.keys(changes).length ? Object.assign({}, node, changes) : node;
}

// All exported values will be wrapped with this function
const file = parseSync(`
  fn => {
    try {
      return fn();
    } catch (e) {
      return e;
    }
  };
`) as t.File;
const exprStatement = file.program.body[0] as t.ExpressionStatement;
const expWrapper = exprStatement.expression;

/*
 * Gets AST and a list of nodes for evaluation
 * Removes unrelated “dead” code.
 * Adds to the end of module export of array of evaluated values or evaluation errors.
 * Returns new AST and an array of external dependencies.
 */
function shake(
  rootPath: t.Program,
  nodes: Array<t.Expression | string>
): [t.Program, ExternalDep[]] {
  const depsGraph = build(rootPath);
  const topLevelDeps = depsGraph.getLeafs(nodes);
  const alive = new Set<t.Node>();
  let deps: t.Node[] = topLevelDeps;
  while (deps.length > 0) {
    // Mark all dependencies as alive
    deps.forEach(d => alive.add(d));

    // Collect new dependencies of dependencies
    deps = depsGraph.getDependencies(deps).filter(d => !alive.has(d));
  }

  const shaken = shakeNode(rootPath, alive) as t.Program;
  // dumpNode(program, alive);

  // By default `wrap` is used as a name of the function …
  let wrapName = 'wrap';
  let wrapNameIdx = 0;
  while (depsGraph.isDeclared(wrapName)) {
    // … but if there is an already defined variable with this name …
    // … we are trying to use a name like wrap_N
    wrapNameIdx += 1;
    wrapName = `wrap_${wrapNameIdx}`;
  }

  const forExport = topLevelDeps
    // Shake each exported node to avoid dead code in it …
    .map(ex => shakeNode(ex, alive))

    // … and wrap it with the function
    .map(ex =>
      t.callExpression(t.identifier(wrapName), [
        t.arrowFunctionExpression([], ex, false),
      ])
    );

  if (forExport.length) {
    // Add wrapper function definition
    shaken.body.push(
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(wrapName), expWrapper),
      ])
    );
  }

  // Add export of all evaluated expressions
  shaken.body.push(
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(t.identifier('module'), t.identifier('exports')),
        t.arrayExpression(forExport)
      )
    )
  );

  return [
    shaken,
    depsGraph.externalDeps.filter(({ local }) => alive.has(local)),
  ];
}

export default shake;
