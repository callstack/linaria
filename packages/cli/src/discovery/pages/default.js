discovery.page.define('default', [
  {
    view: 'inline-list',
    data: [
      { label: 'Action events', value: 'actions' },
      { label: 'Dependencies', value: 'dependencies' },
      { label: 'Entrypoint events', value: 'entrypoints' },
      {
        label: 'Time (ms)',
        data: `
        actions
          .group(=> $.actionId)
          .[value.size() = 2]
          .group(=> $.value[0].type)
          .({ key, diffs: value.([value[1].finishedAt - value[0].startedAt]) })
          .diffs
          .sum()
          .round()
      `,
      },
    ],
    item: `indicator:{
      label,
      value: value ? value.query(#.data, #).size() : data.query(#.data, #),
      href: value ? pageLink('report', { query: value, title: label }),
    }`,
  },
  'h2:"Files"',
  {
    view: 'content-filter',
    content: {
      view: 'table',
      data: `
        files
          .[no #.filter or $~=#.filter]
          .sort($ asc)
          .map(=> [$.split(':')])
          .({ id: $[0], name: $[1] })
      `,
      cols: [
        { header: 'Index', content: 'text:id' },
        {
          header: 'File',
          content:
            'link:{text: name, href: id.pageLink("entrypoint"), match: #.filter }',
        },
      ],
    },
  },
]);
