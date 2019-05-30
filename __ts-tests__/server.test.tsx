/* eslint-disable import/no-unresolved */
// eslint-disable-next-line import/no-extraneous-dependencies
import { collect } from 'linaria/server';

// $ExpectType { critical: string; other: string; }
collect('<div class="foo">Hello</div>', '.foo { color: blue; }');
