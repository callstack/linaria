const cssLookup = new Map<string, string>();

export const addFile = (id: string, content: string) => {
  cssLookup.set(id, content);
};

export default async function outputCssLoader(this: { resourcePath: string }) {
  return cssLookup.get(this.resourcePath) ?? '';
}
