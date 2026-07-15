# Linaria TypeScript API

## Styling HTML Elements

The `styled` tag infers types automatically for HTML elements. To add custom props, pass them as a type parameter:

```typescript
import { styled } from '@linaria/react';

const Title = styled.div<{ background: string }>`
  background: ${(props) => props.background};
`;

<Title background="blue">Hello</Title>;
```

Extract prop interfaces when they'll be reused:

```typescript
interface ButtonProps {
  color: string;
  size: 'small' | 'large';
}

const Button = styled.button<ButtonProps>`
  color: ${(props) => props.color};
  font-size: ${(props) => props.size === 'small' ? '12px' : '16px'};
`;
```

## Wrapping Styled Components

You can extend an existing styled component with additional props. Both the original and new props are merged and available in template expressions:

```typescript
const Button = styled.button<{ outline: boolean }>`
  background-color: ${(props) => props.outline ? 'transparent' : 'royalblue'};
  border: 2px solid royalblue;
`;

const DangerButton = styled(Button)<{ label: string }>`
  background-color: ${(props) => props.outline ? 'transparent' : 'crimson'};
  border-color: crimson;
  color: ${(props) => props.label};
`;

// Both outline (from Button) and label (from DangerButton) are required
<DangerButton outline={false} label="Delete" />;
```

## Wrapping Custom React Components

The component being wrapped must accept `className` as an optional prop, otherwise TypeScript will error:

```typescript
// ✅ Component accepts className
const Card: React.FC<{ className?: string; title: string }> = ({
  className,
  title,
}) => <div className={className}>{title}</div>;

const StyledCard = styled(Card)`
  border: 1px solid gray;
`;

<StyledCard title="Hello" />;
```

If you're passing dynamic CSS values that resolve to inline styles, the component also needs a `style` prop:

```typescript
const Card: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  title: string;
}> = ({ className, style, title }) => (
  <div className={className} style={style}>{title}</div>
);

const StyledCard = styled(Card)<{ borderRadius: number }>`
  border: 1px solid gray;
  border-radius: ${(props) => props.borderRadius}px;
`;

<StyledCard title="Hello" borderRadius={8} />;
```

## Union Types and Discriminated Unions

Discriminated unions in component props work correctly:

```typescript
type GridProps =
  | { container?: false }
  | { container: true; spacing: number };

const Grid: React.FC<GridProps & { className?: string }> = (props) => (
  <div className={props.className} />
);

const StyledGrid = styled(Grid)`
  display: grid;
`;

<StyledGrid container spacing={8} />;   // ✅
<StyledGrid container={false} />;       // ✅
// @ts-expect-error
<StyledGrid spacing={8} />;             // ✅ correctly rejected
```

## Higher-Order Functions

When wrapping styled components in a higher-order function, constrain the generic to ensure the component accepts `className`:

```typescript
interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

const withFlexColumn = <TProps extends BaseProps>(Cmp: React.FC<TProps>) =>
  styled(Cmp)`
    display: flex;
    flex-direction: column;
  `;

interface CardProps extends BaseProps {
  title: string;
}

const Card: React.FC<CardProps> = (props) => <div {...props} />;
const FlexCard = withFlexColumn(Card);

<FlexCard title="Hello" />;  // title prop is preserved and required
```

You can compose multiple wrappers. Each wrapper injects its own props by including them in the generic constraint, then casting the component argument so inference doesn't fight the `styled` overloads:

```typescript
const withSpacing = <Props extends { className?: string; style?: React.CSSProperties; gap: number }>(
  Component: React.FC<Props>
) =>
  styled(Component as React.FC<Props>)`
    gap: ${(props) => (props as any).gap}px;
  `;

const withWidth = <Props extends { className?: string; style?: React.CSSProperties; fluid: boolean }>(
  Component: React.FC<Props>
) =>
  styled(Component as React.FC<Props>)`
    width: ${(props) => (props as any).fluid ? '100%' : 'auto'};
  `;

const Base: React.FC<{
  label: string;
  className?: string;
  style?: React.CSSProperties;
  gap: number;
  fluid: boolean;
}> = (props) => <div {...(props as any)} />;

const Enhanced = withSpacing(withWidth(Base));

<Enhanced label="Hello" gap={8} fluid />;  // all props available and type-safe
```

Whenever a wrapper uses dynamic values in template expressions, Linaria requires the component to have both `className` and `style` props. The injected props (`gap`, `fluid`) also need to live in the generic constraint rather than being intersected after the fact with `styled<Props & ...>(Component)` — that form hits a `styled` overload that expects a plain object, resolving the component to `never`.

## See Also

- [General API docs](./API.md)
- [Type definition tests](https://github.com/callstack/linaria/blob/master/packages/react/__dtslint__/styled.ts)
- [Conditional Types in the TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
