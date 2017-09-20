/* @flow */

import type { RequirementSource } from '../types';

export default function getReplacement(
  requirements: RequirementSource[]
): string {
  const output = [];

  const addLines = (lines, startIndex) => {
    lines.forEach((line, i) => {
      output[startIndex + i] = line;
    });
  };

  requirements.forEach(requirement => {
    const { code, loc: { line } } = requirement;
    const lineIndex = line - 1;
    const linesToAdd = code.split('\n');
    addLines(linesToAdd, lineIndex);
  });

  output.push('/* linaria-preval */');

  return output.join('\n');
}
