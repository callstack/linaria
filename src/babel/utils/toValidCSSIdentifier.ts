export default function toValidCSSIdentifier(s: string) {
  return s.replace(/[^-_a-z0-9\u00A0-\uFFFF]/gi, '_').replace(/^\d/, '_');
}
