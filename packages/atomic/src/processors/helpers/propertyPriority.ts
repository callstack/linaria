const shorthandProperties = {
  // The `all` property resets everything, and should effectively have priority zero.
  // In practice, this can be achieved by using: div { all: ... }  to have even less specificity, but to avoid duplicating all selectors, we just let it be
  // 'all': []
  animation: [
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
  ],
  background: [
    'background-attachment',
    'background-clip',
    'background-color',
    'background-image',
    'background-origin',
    'background-position',
    'background-repeat',
    'background-size',
  ],
  border: ['border-color', 'border-style', 'border-width'],
  'border-block-end': [
    'border-block-end-color',
    'border-block-end-style',
    'border-block-end-width',
  ],
  'border-block-start': [
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
  ],
  'border-bottom': [
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
  ],
  'border-color': [
    'border-bottom-color',
    'border-left-color',
    'border-right-color',
    'border-top-color',
  ],
  'border-image': [
    'border-image-outset',
    'border-image-repeat',
    'border-image-slice',
    'border-image-source',
    'border-image-width',
  ],
  'border-inline-end': [
    'border-inline-end-color',
    'border-inline-end-style',
    'border-inline-end-width',
  ],
  'border-inline-start': [
    'border-inline-start-color',
    'border-inline-start-style',
    'border-inline-start-width',
  ],
  'border-left': [
    'border-left-color',
    'border-left-style',
    'border-left-width',
  ],
  'border-radius': [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ],
  'border-right': [
    'border-right-color',
    'border-right-style',
    'border-right-width',
  ],
  'border-style': [
    'border-bottom-style',
    'border-left-style',
    'border-right-style',
    'border-top-style',
  ],
  'border-top': ['border-top-color', 'border-top-style', 'border-top-width'],
  'border-width': [
    'border-bottom-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
  ],
  'column-rule': [
    'column-rule-width',
    'column-rule-style',
    'column-rule-color',
  ],
  columns: ['column-count', 'column-width'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  font: [
    'font-family',
    'font-size',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'line-height',
  ],
  gap: ['row-gap', 'column-gap'],
  grid: [
    'grid-auto-columns',
    'grid-auto-flow',
    'grid-auto-rows',
    'grid-template-areas',
    'grid-template-columns',
    'grid-template-rows',
  ],
  'grid-area': [
    'grid-row-start',
    'grid-column-start',
    'grid-row-end',
    'grid-column-end',
  ],
  'grid-column': ['grid-column-end', 'grid-column-start'],
  'grid-row': ['grid-row-end', 'grid-row-start'],
  'grid-template': [
    'grid-template-areas',
    'grid-template-columns',
    'grid-template-rows',
  ],
  'list-style': ['list-style-image', 'list-style-position', 'list-style-type'],
  margin: ['margin-bottom', 'margin-left', 'margin-right', 'margin-top'],
  mask: [
    'mask-clip',
    'mask-composite',
    'mask-image',
    'mask-mode',
    'mask-origin',
    'mask-position',
    'mask-repeat',
    'mask-size',
  ],
  offset: [
    'offset-anchor',
    'offset-distance',
    'offset-path',
    'offset-position',
    'offset-rotate',
  ],
  outline: ['outline-color', 'outline-style', 'outline-width'],
  overflow: ['overflow-x', 'overflow-y'],
  padding: ['padding-bottom', 'padding-left', 'padding-right', 'padding-top'],
  'place-content': ['align-content', 'justify-content'],
  'place-items': ['align-items', 'justify-items'],
  'place-self': ['align-self', 'justify-self'],
  'scroll-margin': [
    'scroll-margin-bottom',
    'scroll-margin-left',
    'scroll-margin-right',
    'scroll-margin-top',
  ],
  'scroll-padding': [
    'scroll-padding-bottom',
    'scroll-padding-left',
    'scroll-padding-right',
    'scroll-padding-top',
  ],
  'text-decoration': [
    'text-decoration-color',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-thickness',
  ],
  'text-emphasis': ['text-emphasis-color', 'text-emphasis-style'],
  transition: [
    'transition-delay',
    'transition-duration',
    'transition-property',
    'transition-timing-function',
  ],
};

// Get the property priority: the higher the priority, the higher the resulting
// specificity of the atom. For example, if we had:
//
// import { css } from '@linaria/atomic';
// css`
//   background-color: blue;
//   background: red;
// `;
//
// we would produce:
//
// .atm_a.atm_a { background-color: blue }
// .atm_b { background: red }
//
// and so the more specific selector (.atm_a.atm_a) would win
export function getPropertyPriority(property: string) {
  const longhands = Object.values(shorthandProperties).reduce(
    (a, b) => [...a, ...b],
    []
  );

  return longhands.includes(property) ? 2 : 1;
}
