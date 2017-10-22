/* eslint-env node */

const path = require('path');
const glob = require('glob');
const fs = require('fs');
const babel = require('babel-core');
const Benchmark = require('benchmark');
const Table = require('cli-table');

const resultsTable = new Table({
  head: ['Suite', 'ops/sec', 'avg [ms]'],
  colWidths: [60, 10, 10],
});

const outDir = path.join(__dirname, 'suites/_temp');
fs.mkdirSync(outDir);

function transpile(filename, opts = {}) {
  babel.transformFileSync(path.join(__dirname, filename), {
    presets: ['env', 'stage-2'],
    plugins: [
      [require.resolve('../build/babel/index.js'), opts],
    ],
    babelrc: false,
  });
}

function appendResults({ target: { name, stats, hz } }) {
  resultsTable.push([name, hz.toFixed(2), (stats.mean * 1000).toFixed(2)]);
}

function setupSuites(suite) {
  glob.sync('suites/*.js', { cwd: __dirname }).forEach(filename => {
    const name = /suites\/([a-z-_]+)\.js/.exec(filename)[1];
    suite.add(`${name} (multiple)`, () => {
      transpile(filename);
    });
    suite.add(`${name} (single)`, () => {
      transpile(filename, {
        single: true,
        filename: `${(Math.random() * 100000).toFixed(0)}.css`,
        outDir,
      });
    });
  });
}

function cleanUp() {
  glob.sync('suites/**/*.css', { cwd: __dirname }).forEach(filename => {
    fs.unlinkSync(path.join(__dirname, filename));
  });
  fs.rmdirSync(outDir);
}

const suite = new Benchmark.Suite();

setupSuites(suite);

suite
  .on('cycle', appendResults)
  .on('complete', () => {
    console.log(resultsTable.toString());
    cleanUp();
  })
  .run();
