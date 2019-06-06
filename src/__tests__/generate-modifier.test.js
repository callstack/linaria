import generateModifierName from '../babel/utils/generateModifierName';

/**
 * We expect the following to be true
 * - props => props.primary //-->// primary
 * - props => props.size === 'large' //-->// size-large
 * - props => props.round && props.size !== 'small' //-->// round-and-size-is-not-small
 */

it('generates simple modifier name', () => {
  const result = generateModifierName('props', 'props.primary');

  expect(result).toBe('primary');
});

it('camelCases strings', () => {
  const str = 'props["hello world"]';
  const result = generateModifierName('props', str);

  expect(result).toBe('helloWorld');
});

it('simplifies is', () => {
  const str = "props.size === 'large'";
  const result = generateModifierName('props', str);
  expect(result).toBe('size-large');
});

it('simplifies is not', () => {
  const str = "props.size !== 'large'";
  const result = generateModifierName('props', str);
  expect(result).toBe('size-not-large');
});

it('handles complex expressions', () => {
  const str = "props.round && props.size !== 'small'";
  const result = generateModifierName(undefined, str);
  expect(result).toBe('round-and-size-is-not-small');
});

it('handles bracket notation and or', () => {
  const str = `state["round"] || state['size'] == 'small'`;
  const result = generateModifierName('state', str);
  expect(result).toBe('round-or-size-is-small');
});

it('handles complex multiline expressions', () => {
  const str = `state["round"] || state['size' ] == 'small'
    !state["window is open"]

  `;
  const result = generateModifierName('state', str);
  expect(result).toBe('round-or-size-is-small-not-windowIsOpen');
});
