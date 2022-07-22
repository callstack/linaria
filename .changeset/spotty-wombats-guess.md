---
'@linaria/babel-preset': patch
'@linaria/core': patch
'@linaria/griffel': patch
'@linaria/react': patch
'@linaria/server': patch
'@linaria/tags': patch
'@linaria/testkit': patch
---

Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
