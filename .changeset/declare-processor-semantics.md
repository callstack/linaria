---
'@linaria/atomic': patch
'@linaria/core': patch
'@linaria/react': patch
---

Declare built-in WyW semantics for the `css` and `styled` processors so static processor values can be resolved without evaluating their modules. Atomic `styled` uses the same target semantics, while atomic `css` keeps its post-extraction JS contract.
