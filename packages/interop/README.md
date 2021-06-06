<p align="center">
  <img alt="Linaria" src="https://raw.githubusercontent.com/callstack/linaria/HEAD/website/assets/linaria-logo@2x.png" width="496">
</p>

<p align="center">
Zero-runtime CSS in JS library.
</p>

---

# `@linaria/babel-plugin-interop`

This plugin allows to interpolate Linaria components inside styled-components and Emotion:
```javascript
import styled from 'styled-components';
import { Title } from './Title.styled'; // Linaria component

const Article = () => { /* … */ };

export default styled(Article)`
  & > ${Title} {
    color: green;
  }
`;

```

## Quick start

Install the plugin first:

```
npm install --save-dev @linaria/babel-plugin-interop
```

Then add `@linaria/interop` to your babel configuration *before* `styled-components`:

```JSON
{
  "plugins": [
    ["@linaria/interop", { "library": "styled-components" }],
    "styled-components"
  ]
}
```
