const selectors = ['a', 'b'];

const Block = styled.div`
  ${
    selectors.map(
      c => String.raw`${c} { content: "\u000A"; }`
    ).join('\n')
  };
`;
