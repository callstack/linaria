import typescriptPlugin from 'rollup-plugin-typescript2';
import typescript from 'typescript';

const globals = {
  __proto__: null,
  tslib: "tslib",
  "@ungap/global-this": "globalThisPolyfill",
};

function external(id) {
  return id in globals;
}

const jobs = [];
export default jobs;

jobs.push({
  input: "src/invariant.ts",
  external,
  output: {
    file: "lib/invariant.esm.js",
    format: "esm",
    sourcemap: true,
    globals,
  },
  plugins: [
    typescriptPlugin({
      typescript,
      tsconfig: "./tsconfig.rollup.json",
    }),
  ],
});

jobs.push({
  input: "lib/invariant.esm.js",
  external,
  output: {
    // Intentionally overwrite the invariant.js file written by tsc:
    file: "lib/invariant.js",
    format: "cjs",
    exports: "named",
    sourcemap: true,
    name: "ts-invariant",
    globals,
  },
});

jobs.push({
  input: "process/index.js",
  external,
  output: {
    file: "process/main.js",
    format: "cjs",
    exports: "named",
    sourcemap: true,
    name: "ts-invariant/process",
    globals,
  },
});
