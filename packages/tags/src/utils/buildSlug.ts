const PLACEHOLDER = /\[(.*?)]/g;

const isValidArgName = <TArgs>(
  key: string | number | symbol,
  args: TArgs
): key is keyof TArgs => key in args;

export function buildSlug<TArgs>(pattern: string, args: TArgs) {
  return pattern.replace(PLACEHOLDER, (_, name: string) =>
    isValidArgName(name, args) ? String(args[name]) : ''
  );
}
