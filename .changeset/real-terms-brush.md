---
'@linaria/babel-preset': patch
---

React hooks aren't needed for evaluation so we can replace them as we already do with react components (fixes compatability with [ariakit](https://github.com/ariakit/ariakit) and some other libraries).
