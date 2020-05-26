import {
  mergeOrAppendPlugin,
  mergeOrPrependPlugin,
} from '../../babel/evaluators/buildOptions';

describe('mergeOrPrependPlugin', () => {
  it('when no duplicates, prepends the new target', () => {
    const result = mergeOrPrependPlugin(
      ['bogus/already-in-plugins'],
      'bogus/add-to-plugin'
    );
    expect(result).toEqual(['bogus/add-to-plugin', 'bogus/already-in-plugins']);
  });

  it('when duplicated, merges options, preferring the new plugin, and moves to the front', () => {
    const result = mergeOrPrependPlugin(
      [
        'bogus/already-in-plugins',
        [
          'bogus/add-to-plugin',
          {
            existing: 'should not be overwritten',
            overwrite: 'should be overwritten',
          },
        ],
      ],
      [
        'bogus/add-to-plugin',
        { overwrite: 'was overwritten', added: 'was added' },
      ]
    );
    expect(result).toEqual([
      [
        'bogus/add-to-plugin',
        {
          existing: 'should not be overwritten',
          overwrite: 'was overwritten',
          added: 'was added',
        },
      ],
      'bogus/already-in-plugins',
    ]);
  });
});

describe('mergeOrAppendPlugin', () => {
  it('when no duplicates, appends the new target', () => {
    const result = mergeOrAppendPlugin(
      ['bogus/already-in-plugins'],
      'bogus/add-to-plugin'
    );
    expect(result).toEqual(['bogus/already-in-plugins', 'bogus/add-to-plugin']);
  });

  it('when duplicated, merges options, preferring the new plugin, and moves to the front', () => {
    const result = mergeOrAppendPlugin(
      [
        [
          'bogus/add-to-plugin',
          {
            existing: 'should not be overwritten',
            overwrite: 'should be overwritten',
          },
        ],
        'bogus/already-in-plugins',
      ],
      [
        'bogus/add-to-plugin',
        { overwrite: 'was overwritten', added: 'was added' },
      ]
    );
    expect(result).toEqual([
      'bogus/already-in-plugins',
      [
        'bogus/add-to-plugin',
        {
          existing: 'should not be overwritten',
          overwrite: 'was overwritten',
          added: 'was added',
        },
      ],
    ]);
  });
});
