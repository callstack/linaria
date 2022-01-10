declare const decamelize: {
	/**
	Convert a camelized string into a lowercased one with a custom separator: `unicornRainbow` → `unicorn_rainbow`.

	@param string - The camelcase string to decamelize.
	@param separator - The separator to use to put in between the words from `string`. Default: `'_'`.

	@example
	```
	import decamelize = require('decamelize');

	decamelize('unicornRainbow');
	//=> 'unicorn_rainbow'

	decamelize('unicornRainbow', '-');
	//=> 'unicorn-rainbow'
	```
	*/
	(string: string, separator?: string): string;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function decamelize(string: string, separator?: string): string;
	// export = decamelize;
	default: typeof decamelize;
};

export = decamelize;
