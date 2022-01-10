"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = JSXElement;

var _core = require("@babel/core");

function getFunctionName(path) {
  if (path.isClassMethod() && _core.types.isIdentifier(path.node.key)) {
    return path.node.key.name;
  }

  return null;
}

function JSXElement(path) {
  // JSX can be safely replaced on an empty fragment because it is unnecessary for styles
  const emptyFragment = _core.types.jsxFragment(_core.types.jsxOpeningFragment(), _core.types.jsxClosingFragment(), []); // We can do even more
  // If that JSX is a result of a function, we can replace the function body.


  const scopePath = path.scope.path;

  if (scopePath.isFunction()) {
    const emptyBody = _core.types.blockStatement([_core.types.returnStatement(emptyFragment)]); // Is it not just a function, but a method `render`?


    if (getFunctionName(scopePath) === 'render') {
      const decl = scopePath.findParent(p => p.isClassDeclaration()); // Replace the whole component

      if (decl !== null && decl !== void 0 && decl.isClassDeclaration()) {
        decl.replaceWith(_core.types.functionDeclaration(decl.node.id, [], emptyBody));
        return;
      }
    }

    const body = scopePath.get('body');

    if (Array.isArray(body)) {
      throw new Error(`A body of a function is expected to be a single element but an array was returned. It's possible if JS syntax has been changed since that code was written.`);
    }

    const node = { ...scopePath.node,
      body: emptyBody,
      params: []
    };
    scopePath.replaceWith(node);
  } else {
    path.replaceWith(emptyFragment);
  }
}
//# sourceMappingURL=JSXElement.js.map