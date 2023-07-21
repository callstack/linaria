import type { Location } from '@linaria/utils';

// Stripping away the new lines ensures that we preserve line numbers
// This is useful in case of tools such as the stylelint pre-processor
// This should be safe because strings cannot contain newline: https://www.w3.org/TR/CSS2/syndata.html#strings
export default function stripLines(
  loc: { end: Location; start: Location },
  text: string | number
) {
  let result = String(text)
    .replace(/[\r\n]+/g, ' ')
    .trim();

  // If the start and end line numbers aren't same, add new lines to span the text across multiple lines
  if (loc.start.line !== loc.end.line) {
    result += '\n'.repeat(loc.end.line - loc.start.line);

    // Add extra spaces to offset the column
    result += ' '.repeat(loc.end.column);
  }

  return result;
}
