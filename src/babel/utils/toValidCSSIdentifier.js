/* @flow */

export default function toValidCSSIdentifier(s: string) {
  return s.replace(/[^_0-9a-z]/gi, '_');
}
