# Change Log

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Minor Changes

- 9cb4143d: Refactoring of the 1st stage of transformation. It opens the road to processing wildcard reexports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2

## 4.5.1

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.

## 4.5.0

### Patch Changes

- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.

## 4.1.5

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- e6420897: Update patch version so npm will pick up readme change

## 4.1.4

### Patch Changes

- 4c2efaa9: Only lint when file can be parsed by babel, reduce noisey errors during dev

## 4.1.3

### Patch Changes

- ce36da42: Add stylelint v14 custom syntax support
