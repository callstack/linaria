/**
 * Styled Components created by 'styled' from linaria/react have type
 * 'React.ComponentType & StyledMeta'. We allow these values in `css()`
 * interpolations to support cases like this:
 *
 *     const Button = styled.button`color: red;`;
 *     const className = css`& .${Button} {color: blue;}`;
 *
 * Users of the linaria library are not expected to create values of this
 * type manually.
 */
export interface StyledMeta {
  __linaria: {
    className: string;
    extends: null | StyledMeta;
  };
}

export const isStyledMeta = (x: unknown): x is StyledMeta =>
  typeof (x as any)?.__linaria === 'object';
