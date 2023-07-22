---
'@linaria/utils': patch
---

All references in unary operators should be treated as references, not as bindings. That fixes usages of `+exp` in interpolations.
