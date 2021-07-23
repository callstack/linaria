import type { Node, Program } from '@babel/types';
import generator from '@babel/generator';
import { debug } from '@linaria/logger';
import { isNode, getVisitorKeys } from '@linaria/babel-preset';
import build from './graphBuilder';
import dumpNode from './dumpNode';

/*
 * Returns new tree without dead nodes
 */
function shakeNode<TNode extends Node>(node: TNode, alive: Set<Node>): Node {
  const keys = getVisitorKeys(node) as Array<keyof TNode>;
  const changes: Partial<TNode> = {};
  const isNodeAlive = (n: Node) => alive.has(n);

  for (const key of keys) {
    const subNode = node[key];

    if (Array.isArray(subNode)) {
      const list: any = [];
      let hasChanges = false;
      for (let i = 0; i < subNode.length; i++) {
        const child = subNode[i];
        const isAlive = isNodeAlive(child);
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
        changes[key] = list;
      }
    } else if (isNode(subNode)) {
      if (isNodeAlive(subNode)) {
        const shaken = shakeNode(subNode, alive);
        if (shaken && shaken !== subNode) {
          changes[key] = shaken as any;
        }
      } else {
        changes[key] = undefined;
      }
    }
  }

  return Object.keys(changes).length ? { ...node, ...changes } : node;
}

/*
 * Gets AST and a list of nodes for evaluation
 * Removes unrelated “dead” code.
 * Adds to the end of module export of array of evaluated values or evaluation errors.
 * Returns new AST and an array of external dependencies.
 */
export default function shake(
  rootPath: Program,
  exports: string[] | null
): [Program, Map<string, string[]>] {
  debug(
    'evaluator:shaker:shake',
    () =>
      `source (exports: ${(exports || []).join(', ')}):\n${
        generator(rootPath).code
      }`
  );

  const depsGraph = build(rootPath);
  const alive = new Set<Node>();
  const reexports: string[] = [];
  let deps = (exports ?? [])
    .map((token) => {
      const node = depsGraph.getLeaf(token);
      if (node) return [node];
      // We have some unknown token. Do we have `export * from …` in that file?
      if (depsGraph.reexports.length === 0) {
        return [];
      }

      // If so, mark all re-exported files as required
      reexports.push(token);
      return [...depsGraph.reexports];
    })
    .reduce<Node[]>((acc, el) => {
      acc.push(...el);
      return acc;
    }, []);
  while (deps.length > 0) {
    // Mark all dependencies as alive
    deps.forEach((d) => alive.add(d));

    // Collect new dependencies of dependencies
    deps = depsGraph.getDependencies(deps).filter((d) => !alive.has(d));
  }

  const shaken = shakeNode(rootPath, alive) as Program;
  /*
   * If we want to know what is really happen with our code tree,
   * we can print formatted tree here by setting env variable LINARIA_LOG=debug
   */
  debug('evaluator:shaker:shake', () => dumpNode(rootPath, alive));

  const imports = new Map<string, string[]>();
  for (let [source, members] of depsGraph.imports.entries()) {
    const importType = depsGraph.importTypes.get(source);
    const defaultMembers = importType === 'wildcard' ? ['*'] : [];
    const aliveMembers = new Set(
      members.filter((i) => alive.has(i)).map((i) => i.name)
    );

    if (importType === 'reexport') {
      reexports.forEach((token) => aliveMembers.add(token));
    }

    imports.set(
      source,
      aliveMembers.size > 0 ? Array.from(aliveMembers) : defaultMembers
    );
  }

  return [shaken, imports];
}
