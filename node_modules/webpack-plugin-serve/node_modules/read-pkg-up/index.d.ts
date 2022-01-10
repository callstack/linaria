import {Omit} from 'type-fest';
import readPkg = require('read-pkg');

declare namespace readPkgUp {
	type Options = {
		/**
		Directory to start looking for a package.json file.

		@default process.cwd()
		*/
		cwd?: string;
	} & Omit<readPkg.Options, 'cwd'>;

	type NormalizeOptions = {
		/**
		Directory to start looking for a package.json file.

		@default process.cwd()
		*/
		cwd?: string;
	} & Omit<readPkg.NormalizeOptions, 'cwd'>;

	type PackageJson = readPkg.PackageJson;
	type NormalizedPackageJson = readPkg.NormalizedPackageJson;

	interface ReadResult {
		package: PackageJson;
		path: string;
	}

	interface NormalizedReadResult {
		package: NormalizedPackageJson;
		path: string;
	}
}

declare const readPkgUp: {
	/**
	Read the closest `package.json` file.

	@example
	```
	import readPkgUp = require('read-pkg-up');

	(async () => {
		console.log(await readPkgUp());
		// {
		// 	package: {
		// 		name: 'awesome-package',
		// 		version: '1.0.0',
		// 		…
		// 	},
		// 	path: '/Users/sindresorhus/dev/awesome-package/package.json'
		// }
	})();
	```
	*/
	(options?: readPkgUp.NormalizeOptions): Promise<
		readPkgUp.NormalizedReadResult | undefined
	>;
	(options: readPkgUp.Options): Promise<readPkgUp.ReadResult | undefined>;

	/**
	Synchronously read the closest `package.json` file.

	@example
	```
	import readPkgUp = require('read-pkg-up');

	console.log(readPkgUp.sync());
	// {
	// 	package: {
	// 		name: 'awesome-package',
	// 		version: '1.0.0',
	// 		…
	// 	},
	// 	path: '/Users/sindresorhus/dev/awesome-package/package.json'
	// }
	```
	*/
	sync(
		options?: readPkgUp.NormalizeOptions
	): readPkgUp.NormalizedReadResult | undefined;
	sync(options: readPkgUp.Options): readPkgUp.ReadResult | undefined;
};

export = readPkgUp;
