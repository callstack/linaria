declare module 'react-html-attributes' {
  interface IElements {
    html: string[];
    svg: string[];
  }

  interface IAttributes {
    [tag: string]: string[];
  }

  const result: IAttributes & {
    elements: IElements;
  };

  export = result;
}
