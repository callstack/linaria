module.exports = {
  test: value => value && typeof value.linaria === 'object',
  print: ({ linaria }) => `
CSS Text: ${linaria.cssText}
Dependencies: ${
    linaria.dependencies.length ? linaria.dependencies.join(', ') : 'NA'
  }

Mappings: ${JSON.stringify(linaria.mappings)}
`,
};
