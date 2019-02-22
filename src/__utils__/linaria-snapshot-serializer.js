module.exports = {
  test: value => value && typeof value.linaria === 'object',
  print: ({ linaria }) => `
CSS:

${Object.keys(linaria.rules)
  .map(selector => `${selector} {${linaria.rules[selector].cssText}}`)
  .join('\n')}

Dependencies: ${
    linaria.dependencies.length ? linaria.dependencies.join(', ') : 'NA'
  }
`,
};
