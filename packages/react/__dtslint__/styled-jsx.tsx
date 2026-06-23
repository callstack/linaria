import * as React from 'react';

import { styled } from '..';

const Button = styled.button``;

<Button as="a" href="/" />;
// @ts-expect-error href requires an anchor-like target
<Button href="/" />;
