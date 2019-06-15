declare module 'convert-source-map' {
  const convert: {
    toJSON: (space: any) => string;
    fromComment: (comment?: string) => typeof convert | null;
    toObject: () => any;
  };
  export default convert;
}
