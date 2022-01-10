#!/usr/bin/env node
'use strict';
const updateNotifier = require('update-notifier');
const meow = require('meow');
const del = require('del');

const cli = meow(`
	Usage
	  $ del <path|glob> …

	Options
	  -f, --force    Allow deleting the current working directory and outside
	  -d, --dry-run  List what would be deleted instead of deleting

	Examples
	  $ del unicorn.png rainbow.png
	  $ del '*.png' '!unicorn.png'
`, {
	string: [
		'_'
	],
	boolean: [
		'force',
		'dry-run'
	],
	alias: {
		f: 'force',
		d: 'dry-run'
	}
});

updateNotifier({pkg: cli.pkg}).notify();

if (cli.input.length === 0) {
	console.error('Specify at least one path');
	process.exit(1);
}

del(cli.input, cli.flags).then(files => {
	if (cli.flags.dryRun) {
		console.log(files.join('\n'));
	}
});
