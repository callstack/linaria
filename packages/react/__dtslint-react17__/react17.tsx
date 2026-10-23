// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'tstyche';

import { styled } from '..';

const Button = styled.button``;

// Should not require `children` for intrinsic elements on React 17 projects.
expect(Button).type.toBeCallableWith({});
<Button />;
<Button>ok</Button>;
