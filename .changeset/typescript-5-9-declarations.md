---
'@linaria/atomic': patch
'@linaria/postcss-linaria': patch
---

Build the type declarations with TypeScript 5.9, which writes the optional `className` of the atomize helper as `className?: string` and names the postcss `Document` and `Root` types through the `postcss` entry point instead of `postcss/lib/*`.
