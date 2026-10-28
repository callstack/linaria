import * as React from 'react';

import { styled } from '..';

const Button = styled.button``;

<Button as="a" href="/" />;
// @ts-expect-error href requires an anchor-like target
<Button href="/" />;
// @ts-expect-error href is not a button property
<Button as="button" href="/" />;

declare function getProps<
  T extends React.InputHTMLAttributes<HTMLInputElement>,
>(props?: T): T;

const Input = styled.input``;

// A spread of a generic call must not depend on the `as` overload.
<Input {...getProps()} disabled />;
