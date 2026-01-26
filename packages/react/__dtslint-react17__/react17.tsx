import { styled } from '..';

const Button = styled.button``;

// Should not require `children` for intrinsic elements on React 17 projects.
Button({});
<Button />;
<Button>ok</Button>;
