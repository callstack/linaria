/* @flow weak */
/* eslint-disable class-methods-use-this, import/no-extraneous-dependencies */

const babel = require('babel-core');
const { Asset } = require('parcel-bundler');
const transform = require('../transform');

module.exports = class LinariaAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options);

    this.type = 'js';
  }

  getBabelFile() {
    this.babelFile =
      this.babelFile ||
      new babel.File({ filename: this.name }, new babel.Pipeline());

    return this.babelFile;
  }

  parse(code) {
    return this.getBabelFile().parser(code);
  }

  async pretransform() {
    const { ast, code } = await babel.transformFromAst(
      this.ast,
      this.contents,
      {
        filename: this.name,
        sourceMaps: true,
        presets: [require.resolve('../../../babel.js')],
        parserOpts: this.getBabelFile().parserOpts,
        babelrc: false,
      }
    );

    this.ast = ast;
    this.isAstDirty = true;
    this.outputCode = code;
    this.transformedResult = transform(
      this.name,
      code,
      this.options.sourceMaps
    );
  }

  collectDependencies() {
    const { dependencies } = this.transformedResult;

    if (dependencies) {
      dependencies.forEach(dep => {
        this.addDependency(dep);
      });
    }
  }

  generate() {
    const { css, map } = this.transformedResult;

    if (map) {
      map.setSourceContent(this.name, this.contents);
    }

    return [
      {
        type: 'js',
        value: this.outputCode,
      },
      {
        type: 'css',
        value: css,
        sourceMap: map,
      },
    ];
  }
};
