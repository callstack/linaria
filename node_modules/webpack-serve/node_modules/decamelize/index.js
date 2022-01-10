'use strict';
const xRegExp = require('xregexp');

const decamelize = (text, separator = '_') => {
	if (!(typeof text === 'string' && typeof separator === 'string')) {
		throw new TypeError('The `text` and `separator` arguments should be of type `string`');
	}

	const regex1 = xRegExp('([\\p{Ll}\\d])(\\p{Lu})', 'g');
	const regex2 = xRegExp('(\\p{Lu}+)(\\p{Lu}[\\p{Ll}\\d]+)', 'g');

	return text
		// TODO: Use this instead of `xregexp` when targeting Node.js 10:
		// .replace(/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu, `$1${separator}$2`)
		// .replace(/(\p{Lowercase_Letter}+)(\p{Uppercase_Letter}[\p{Lowercase_Letter}\d]+)/gu, `$1${separator}$2`)
		.replace(regex1, `$1${separator}$2`)
		.replace(regex2, `$1${separator}$2`)
		.toLowerCase();
};

module.exports = decamelize;
// TODO: Remove this for the next major release
module.exports.default = decamelize;
