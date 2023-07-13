---
'@linaria/babel-preset': patch
'@linaria/react': patch
'@linaria/tags': patch
'@linaria/testkit': patch
---

Variables in props-based interpolation functions are no longer required for the evaluation stage.
Here's an example:
```
import { getColor } from "very-big-library";

export const Box = styled.div\`
  color: ${props => getColor(props.kind)};
\`;
```

In versions prior to and including 4.5.0, the evaluator would attempt to import `getColor` from `very-big-library`, despite it having no relevance to style generation. However, in versions greater than 4.5.0, `very-big-library` will be ignored.
