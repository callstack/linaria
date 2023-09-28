---
'@linaria/utils': patch
---

Browser-specific code can now be wrapped in `if (typeof window !== 'undefined') { /* will be deleted */ }`.
