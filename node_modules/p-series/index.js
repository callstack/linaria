'use strict';
const pReduce = require('p-reduce');
const is = require('@sindresorhus/is');

module.exports = iterable => {
	const ret = [];

	for (const task of iterable) {
		const type = is(task);

		if (type !== 'Function') {
			return Promise.reject(new TypeError(`Expected task to be a \`Function\`, received \`${type}\``));
		}
	}

	return pReduce(iterable, (_, fn) => {
		return Promise.resolve().then(fn).then(val => {
			ret.push(val);
		});
	}).then(() => ret);
};
