module.exports = ({ types: t }) => ({
  name: 'transform-import-meta-url',
  visitor: {
    MemberExpression(path) {
      const { object, property, computed } = path.node;
      if (computed) return;
      if (!t.isMetaProperty(object)) return;
      if (!t.isIdentifier(object.meta, { name: 'import' })) return;
      if (!t.isIdentifier(object.property, { name: 'meta' })) return;
      if (!t.isIdentifier(property, { name: 'url' })) return;
      const requireUrl = t.callExpression(
        t.memberExpression(t.identifier('module'), t.identifier('require')),
        [t.stringLiteral('url')]
      );
      const pathToFileURL = t.memberExpression(
        requireUrl,
        t.identifier('pathToFileURL')
      );
      const fileUrl = t.callExpression(pathToFileURL, [
        t.identifier('__filename'),
      ]);
      path.replaceWith(t.memberExpression(fileUrl, t.identifier('href')));
    },
  },
});
