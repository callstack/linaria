import ScopeManager from './scope';
import isNode from '../utils/isNode';
import { types as t } from '@babel/core';

const peek = <T>(stack: T[], offset = 1): T => stack[stack.length - offset];

type Node = t.Node;
type ActionFn = (
  builder: GraphBuilder,
  node: t.Identifier,
  parent: Node,
  parentKey: string,
  listIdx: number | null
) => void;
type Action = 'declare' | 'keep' | 'refer' | ActionFn;

export type ExternalDep = {
  source: string;
  local: t.Identifier;
  imported: t.Identifier | null;
};

const identifierActions: {
  [key: string]: Action;
} = {};

const defineAction = (typeOrAlias: string, field: string, action: Action) => {
  // FLIPPED_ALIAS_KEYS is not defined in babel typings
  const types = (t as any).FLIPPED_ALIAS_KEYS[typeOrAlias] || [typeOrAlias];
  types.forEach((type: string) => {
    identifierActions[`${type}:${field}`] = action;
  });
};

class Graph {
  public readonly externalDeps: ExternalDep[] = [];

  private readonly edges: Array<[Node, Node]> = [];
  private readonly dependencies: Map<Node, Node[]> = new Map();
  private readonly dependents: Map<Node, Node[]> = new Map();
  private readonly bindingsDependencies: Map<string, Node[]> = new Map();
  private readonly bindingsDependents: Map<string, Node[]> = new Map();

  constructor(private scope: ScopeManager) {}

  addEdge(a: Node, b: Node) {
    this.edges.push([a, b]);
    if (!this.dependencies.has(a)) {
      this.dependencies.set(a, []);
    }

    if (!this.dependents.has(b)) {
      this.dependents.set(b, []);
    }

    this.dependencies.get(a)!.push(b);
    this.dependents.get(b)!.push(a);

    if (t.isIdentifier(a)) {
      const scopeId = this.scope.whereIsDeclared(a);
      if (scopeId !== undefined) {
        const key = `${scopeId}:${a.name}`;
        if (!this.bindingsDependencies.has(key)) {
          this.bindingsDependencies.set(key, []);
        }

        this.bindingsDependencies.get(key)!.push(b);
      }
    }

    if (t.isIdentifier(b)) {
      const scopeId = this.scope.whereIsDeclared(b);
      if (scopeId !== undefined) {
        const key = `${scopeId}:${b.name}`;
        if (!this.bindingsDependents.has(key)) {
          this.bindingsDependents.set(key, []);
        }

        this.bindingsDependents.get(key)!.push(a);
      }
    }
  }

  getDependenciesByBinding(id: string) {
    return this.bindingsDependencies.get(id) || [];
  }

  getDependentsByBinding(id: string) {
    return this.bindingsDependents.get(id) || [];
  }

  findDependencies(like: object) {
    return (
      this.edges
        // shallowEqual is not defined
        .filter(([a]) => (t as any).shallowEqual(a, like))
        .map(([, b]) => b)
    );
  }

  findDependents(like: object) {
    return (
      this.edges
        // shallowEqual is not defined
        .filter(([, b]) => (t as any).shallowEqual(b, like))
        .map(([a]) => a)
    );
  }

  getDependencies(nodes: Node[]) {
    return nodes.reduce(
      (acc, node) => acc.concat(this.dependencies.get(node) || []),
      [] as Node[]
    );
  }

  getDependents(nodes: Node[]) {
    return nodes.reduce(
      (acc, node) => acc.concat(this.dependents.get(node) || []),
      [] as Node[]
    );
  }

  getLeafs(required: Array<t.Expression | string>): t.Expression[] {
    return required
      .map(node =>
        typeof node === 'string' ? this.scope.getDeclaration(`0:${node}`) : node
      )
      .filter(n => n) as t.Expression[];
  }

  isDeclared(name: string) {
    return this.scope.isDeclared(`0:${name}`);
  }
}

class GraphBuilder {
  static build(root: Node): Graph {
    const builder = new GraphBuilder();
    builder.visit(root);
    return builder.graph;
  }

  /*
   * Special handler for { foo: bar } in different contexts
   */
  static IdentifierInObjectProperty(builder: GraphBuilder, node: t.Identifier) {
    const context = peek(builder.context);
    if (context === 'pattern') {
      builder.scope.declare(node);
    } else {
      const declaration = builder.scope.addReference(node);
      if (declaration) {
        builder.graph.addEdge(node, declaration);
      }
    }
  }

  private readonly graph: Graph;
  private readonly scope: ScopeManager;
  private readonly meta: Map<string, any>;

  /*
   * For expressions like `{ foo: bar }` we need to now context
   *
   * const obj = { foo: bar };
   * Here context is `expression`, `bar` is a variable which depends from its declaration.
   *
   * const { foo: bar } = obj;
   * Here context is `pattern` and `bar` is a variable declaration itself.
   */
  private readonly context: Array<'expression' | 'pattern' | 'lval'> = [];

  private readonly fnStack: Node[] = [];

  constructor() {
    this.scope = new ScopeManager();
    this.graph = new Graph(this.scope);

    this.meta = new Map();
  }

  baseVisit<T extends Node>(node: T, ignoreDeps = false) {
    const { type } = node;
    const dependencies = [];

    const isExpression = t.isExpression(node);
    // VISITOR_KEYS is not defined in babel typings
    const keys: [keyof T] = (t as any).VISITOR_KEYS[type] || [];
    for (const key of keys) {
      const subNode: T[keyof T] = node[key];

      if (Array.isArray(subNode)) {
        for (let i = 0; i < subNode.length; i++) {
          const child = subNode[i];
          if (child) {
            this.visit(child, node, key, i);
            dependencies.push(child);
          }
        }
      } else if (isNode(subNode)) {
        this.visit(subNode, node, key);
        dependencies.push(subNode);
      }
    }

    if (isExpression && !ignoreDeps) {
      dependencies.forEach(dep => this.graph.addEdge(node, dep));
    }
  }

  visit<T extends Node, TP extends Node>(
    node: T,
    parent: TP | null = null,
    parentKey: keyof TP | null = null,
    listIdx: number | null = null
  ) {
    const { type } = node;
    const isScopable = t.isScopable(node);
    const isFunction = t.isFunction(node);

    if (isScopable) this.scope.new();
    if (isFunction) this.fnStack.push(node);

    if (type in this) {
      // we can define a base class with empty methods but… no
      (this as any)[type](node, parent, parentKey, listIdx);
    } else {
      this.baseVisit(node);
    }

    if (isFunction) this.fnStack.pop();
    if (isScopable) this.scope.dispose();
  }

  Identifier(
    node: t.Identifier,
    parent: Node,
    parentKey: string,
    listIdx: number | null = null
  ) {
    const action = identifierActions[`${parent.type}:${parentKey}`];

    if (typeof action === 'function') {
      action(this, node, parent, parentKey, listIdx);
      return;
    }

    if (action === 'keep') {
      return;
    }

    if (action === 'declare') {
      this.scope.declare(node);
      return;
    }

    if (action === 'refer') {
      const declaration = this.scope.addReference(node);
      // Let's check that it's not a global variable
      if (declaration) {
        // usage of a variable depends on its declaration
        this.graph.addEdge(node, declaration);

        const context = peek(this.context);
        if (context === 'lval') {
          // This is an identifier in the left side of an assignment expression and a variable value depends on that.
          this.graph.addEdge(declaration, node);
        }
      }

      return;
    }

    // Uncaught case. Just show some debug information here.
    // console.log(node.name, parent.type, parentKey, listIdx);
  }

  ReturnStatement(node: t.ReturnStatement) {
    this.baseVisit(node);
    if (node.argument) {
      this.graph.addEdge(node, node.argument);
    }

    // Closest function depends on the return statement
    this.graph.addEdge(peek(this.fnStack), node);
  }

  ThrowStatement(node: t.ThrowStatement) {
    this.baseVisit(node);
    this.graph.addEdge(node, node.argument);

    // Closest function depends on the throw statement
    this.graph.addEdge(peek(this.fnStack), node);
  }

  ExpressionStatement(node: t.ExpressionStatement) {
    this.baseVisit(node);
    this.graph.addEdge(node.expression, node);
  }

  Program(node: t.Program) {
    this.baseVisit(node);
    node.body.forEach(exp => {
      this.graph.addEdge(exp, node);
    });
  }

  ObjectExpression(node: t.ObjectExpression) {
    this.context.push('expression');
    this.baseVisit(node);
    node.properties.forEach(prop => {
      this.graph.addEdge(node, prop);
      if (t.isObjectMethod(prop)) {
        this.graph.addEdge(prop, prop.key);
        this.graph.addEdge(prop, prop.body);
      } else if (t.isObjectProperty(prop)) {
        this.graph.addEdge(prop, prop.key);
        this.graph.addEdge(prop, prop.value);
      } else if (t.isSpreadElement(prop)) {
        this.graph.addEdge(prop, prop.argument);
      }
    });
    this.context.pop();
  }

  ObjectPattern(node: t.ObjectPattern) {
    this.context.push('pattern');
    this.baseVisit(node);
    node.properties.forEach(prop => {
      this.graph.addEdge(prop, node);
      if (t.isObjectProperty(prop)) {
        this.graph.addEdge(prop.value, prop.key);
        this.graph.addEdge(prop.value, prop);
      } else if (t.isSpreadElement(prop)) {
        this.graph.addEdge(prop.argument, prop);
      }
    });
    this.context.pop();
  }

  MemberExpression(node: t.MemberExpression) {
    this.baseVisit(node);
    this.graph.addEdge(node.object, node);
  }

  AssignmentExpression(node: t.AssignmentExpression) {
    this.context.push('lval');
    this.visit(node.left, node, 'left');
    this.context.pop();

    this.visit(node.right, node, 'right');

    this.graph.addEdge(node, node.left);
    this.graph.addEdge(node, node.right);
    this.graph.addEdge(node.left, node.right);
    this.graph.addEdge(node.left, node);
  }

  AssignmentPattern(node: t.AssignmentPattern) {
    this.baseVisit(node);
    if (t.isIdentifier(node.left)) {
      this.graph.addEdge(node.left, node.right);
    } else if (t.isMemberExpression(node.left)) {
      this.graph.addEdge(node.left.property, node.right);
    }
  }

  ExportNamedDeclaration(node: t.ExportNamedDeclaration) {
    this.baseVisit(node);
    if (node.declaration) {
      this.graph.addEdge(node.declaration, node);
      this.graph.addEdge(node, node.declaration);
    }
  }

  ImportDeclaration(node: t.ImportDeclaration) {
    this.baseVisit(node);
    node.specifiers.forEach(specifier => {
      this.graph.addEdge(specifier, node);
      this.graph.externalDeps.push({
        source: node.source.value,
        local: specifier.local,
        imported: t.isImportSpecifier(specifier) ? specifier.imported : null,
      });
    });
  }

  ImportDefaultSpecifier(node: t.ImportDefaultSpecifier) {
    this.baseVisit(node);
    this.graph.addEdge(node.local, node);
  }

  ImportSpecifier(node: t.ImportSpecifier) {
    this.baseVisit(node);
    this.graph.addEdge(node.local, node.imported);
    this.graph.addEdge(node.imported, node);
  }

  VariableDeclarator(node: t.VariableDeclarator, parent: Node) {
    /*
     * declared is used for detecting external dependencies in cases like
     * const { a, b, c } = require('module');
     *
     * We are remembering all declared variables in order to use it later in CallExpression visitor
     */
    const declared: t.Identifier[] = [];
    this.meta.set('declared', declared);
    const deregister = this.scope.addDeclareHandler(identifier =>
      declared.push(identifier)
    );
    this.baseVisit(node);
    this.meta.delete('declared');
    deregister();

    if (node.init) {
      this.graph.addEdge(node.id, node.init);
      this.graph.addEdge(node, node.init);
    }

    this.graph.addEdge(node.id, node);
    this.graph.addEdge(node, parent);
  }

  CallExpression(node: t.CallExpression) {
    this.baseVisit(node);

    if (t.isIdentifier(node.callee) && node.callee.name === 'require') {
      // It looks like a module import …
      if (this.scope.whereIsDeclared(node.callee) !== 'global') {
        // … but it is just a user defined function
        return;
      }

      const [firstArg] = node.arguments;
      if (!t.isStringLiteral(firstArg)) {
        // dynamic import? Maybe someday we can do something about it
        return;
      }

      const { value: source } = firstArg;
      const declared = this.meta.get('declared') as t.Identifier[];
      declared.forEach(n =>
        this.graph.externalDeps.push({
          source,
          local: n,
          imported: null,
        })
      );
    }
  }

  SequenceExpression(node: t.SequenceExpression) {
    // Sequence value depends on only last expression in the list
    this.baseVisit(node, true);
    if (node.expressions.length > 0) {
      this.graph.addEdge(node, node.expressions[node.expressions.length - 1]);
    }
  }
}

[
  ['ArrayPattern', 'elements'],
  ['AssignmentPattern', 'left'],
  ['Function', 'params'],
  ['ImportDefaultSpecifier', 'local'],
  ['ImportSpecifier', 'local'],
  ['RestElement', 'argument'],
  ['VariableDeclarator', 'id'],
].forEach(([type, field]) => defineAction(type, field, 'declare'));

[
  ['ExportSpecifier', 'exported'],
  ['ImportSpecifier', 'imported'],
  ['MemberExpression', 'property'],
  ['ObjectProperty', 'key'],
].forEach(([type, field]) => defineAction(type, field, 'keep'));

[
  ['AssignmentExpression', 'left'],
  ['AssignmentExpression', 'right'],
  ['AssignmentPattern', 'right'],
  ['BinaryExpression', 'left'],
  ['BinaryExpression', 'right'],
  ['CallExpression', 'arguments'],
  ['CallExpression', 'callee'],
  ['ExportDefaultDeclaration', 'declaration'],
  ['ExportSpecifier', 'local'],
  ['Function', 'body'],
  ['LogicalExpression', 'left'],
  ['LogicalExpression', 'right'],
  ['MemberExpression', 'object'],
  ['NewExpression', 'callee'],
  ['ReturnStatement', 'argument'],
  ['SequenceExpression', 'expressions'],
  ['SpreadElement', 'argument'],
  ['TaggedTemplateExpression', 'tag'],
  ['TemplateLiteral', 'expressions'],
  ['VariableDeclarator', 'init'],
].forEach(([type, field]) => defineAction(type, field, 'refer'));

defineAction(
  'ObjectProperty',
  'value',
  GraphBuilder.IdentifierInObjectProperty
);

export default GraphBuilder.build;
