/* eslint-disable import/no-unresolved */

import { collect } from 'linaria/server';

// $ExpectType { critical: string; other: string; }
collect('<div class="foo">Hello</div>', '.foo { color: blue; }');
