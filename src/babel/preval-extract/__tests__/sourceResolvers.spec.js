import resolveSource from '../resolveSource';

xtest('resolveSource should return null if binding source is emoty', () => {
  expect(
    resolveSource({
      node: {
        name: '',
      },
      scope: {
        getBinding() {
          return {
            kind: 'var',
            path: {
              getSource: () => '',
            },
          };
        },
      },
    })
  ).toBeNull();
});
