/* @flow */

import sheet from './sheet';

export default function include(...classNames: string[]): string {
  const styles = sheet.styles();
  return classNames.reduce((cssText, className) => {
    const selector = `.${className}`;
    if (selector in styles) {
      return `${cssText}\n${styles[selector]}`;
    }
    throw new Error(`Unable to find CSS for the class name: ${className}`);
  }, '');
}
