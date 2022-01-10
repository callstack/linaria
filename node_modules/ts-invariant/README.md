# ts-invariant

[TypeScript](https://www.typescriptlang.org) implementation of
[`invariant(condition, message)`](https://www.npmjs.com/package/invariant).

Supports `invariant.log`, `invariant.warn`, and `invariant.error`, which
wrap `console` methods of the same name, and may be stripped in production
by [`rollup-plugin-invariant`](../../archived/rollup-plugin-invariant).

The verbosity of these methods can be globally reconfigured using the
`setVerbosity` function:
```ts
import { setVerbosity } from "ts-invariant";

setVerbosity("log"); // display all messages (default)
setVerbosity("warn"); // display only warnings and errors
setVerbosity("error"); // display only errors
setVerbosity("silent"); // display no messages
```
