/**
 * This file is used to extract statements required to evaluate dependencies.
 * Starting from the exports.__linariaPreval passed as argument to static method on class RequirementsResolver,
 * it recursively extracts paths that contains identifiers that are needed to evaluate the dependency.
 */

import { types as t } from '@babel/core';
import type {
  Identifier,
  Node,
  Statement,
  VariableDeclarator,
} from '@babel/types';
import type { Binding, NodePath } from '@babel/traverse';

type Requirement = {
  result: Statement;
  path: NodePath<Node>;
  requirements: Set<NodePath>;
};

export default class RequirementsResolver {
  public static resolve(path: NodePath<Node> | NodePath<Node>[]): Statement[] {
    const resolver = new RequirementsResolver();
    if (Array.isArray(path)) {
      path.forEach((p) => this.resolve(p));
    } else {
      resolver.resolve(path);
    }

    return resolver.statements;
  }

  private requirements: Requirement[] = [];

  /**
   * Checks that specified node or one of its ancestors is already added
   */
  private isAdded(path: NodePath<Node>): boolean {
    if (this.requirements.some((req) => req.path === path)) {
      return true;
    }

    if (path.parentPath) {
      return this.isAdded(path.parentPath);
    }

    return false;
  }

  /**
   * Makes a declaration statement, finds dependencies
   * and adds all of it to the list of requirements.
   */
  private resolveBinding(binding: Binding) {
    let result: Statement;
    const startPosition = binding.path.node.start;

    switch (binding.kind) {
      case 'module':
        if (
          binding.path.isImportSpecifier() &&
          binding.path.parentPath.isImportDeclaration()
        ) {
          result = t.importDeclaration(
            [binding.path.node],
            binding.path.parentPath.node.source
          );
        } else {
          result = binding.path.parentPath.node as Statement;
        }
        break;
      case 'const':
      case 'let':
      case 'var': {
        let decl = (binding.path as NodePath<VariableDeclarator>).node;
        if (
          binding.path.isVariableDeclarator() &&
          t.isSequenceExpression(binding.path.node.init)
        ) {
          // Replace SequenceExpressions (expr1, expr2, expr3, ...) with the last one
          decl = t.variableDeclarator(
            binding.path.node.id,
            binding.path.node.init.expressions[
              binding.path.node.init.expressions.length - 1
            ]
          );
        }

        result = t.variableDeclaration(binding.kind, [decl]);
        break;
      }
      default:
        result = binding.path.node as Statement;
        break;
    }
    // result may be newly created node that not have start/end/loc info
    // which is needed to sort statements
    result.start = startPosition;

    const req: Requirement = {
      result,
      path: binding.path,
      requirements: new Set(),
    };

    this.requirements.push(req);

    req.requirements = this.resolve(binding.path);
  }

  /**
   * Checks that a specified identifier has a binding and tries to resolve it
   * @return `Binding` or null if there is no binding, or it is already added, or it has useless type
   */
  private resolveIdentifier(path: NodePath<Identifier>): Binding | null {
    const binding = path.scope.getBinding(path.node.name);

    if (
      path.isReferenced() &&
      binding &&
      !this.isAdded(binding.path) &&
      // @ts-ignore binding.kind can be param
      binding.kind !== 'param'
    ) {
      this.resolveBinding(binding);
      return binding;
    }

    return null;
  }

  /**
   * Finds all identifiers in a specified path, finds all related bindings
   * and recursively calls `resolve` for each of them.
   * @return `Set` with related bindings
   */
  private resolve(path: NodePath<Node>): Set<NodePath> {
    const set = new Set<NodePath>();
    if (path.isIdentifier()) {
      const binding = this.resolveIdentifier(path);
      if (binding !== null) {
        set.add(binding.path);
      }

      return set;
    }

    path.traverse({
      Identifier: (p) => {
        const binding = this.resolveIdentifier(p);
        if (binding !== null) {
          set.add(binding.path);
        }
      },
    });

    return set;
  }

  /**
   * Returns sorted list of required statements
   */
  private get statements(): Statement[] {
    const statements: Statement[] = [];
    let requirements = this.requirements;
    while (requirements.length > 0) {
      // On each step, we add to the result list only that statements
      // which don't have any dependencies (`zeroDeps`)
      const [zeroDeps, rest] = requirements.reduce(
        (acc, req) => {
          if (req.requirements.size === 0) {
            acc[0].push(req);
          } else {
            acc[1].push(req);
          }

          return acc;
        },
        [[], []] as [Requirement[], Requirement[]]
      );

      if (zeroDeps.length === 0) {
        // That means that we are in the endless loop.
        // I don't know how it's possible, but if it's ever happened, we at least would be notified.
        throw new Error('Circular dependency');
      }

      statements.push(...zeroDeps.map((req) => req.result));
      // Let's remove already added statements from the requirements of the rest of the list.
      requirements = rest.map((req) => {
        const reqs = new Set(req.requirements);
        zeroDeps.forEach((r) => reqs.delete(r.path));
        return {
          ...req,
          requirements: reqs,
        };
      });
    }

    // preserve original statements order, but reversed
    statements.sort((a, b) => {
      if (a.start && b.start) {
        return b.start - a.start;
      } else {
        return 0;
      }
    });

    return statements;
  }
}
