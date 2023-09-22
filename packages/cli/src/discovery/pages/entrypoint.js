const fieldsByType = {
  actionCreated: (event) => [
    {
      view: 'badge',
      data: {
        text: `${event.data.actionType}@${event.data.actionIdx}`,
        color: 'blue',
        textColor: 'white',
        href: `#action:${event.data.actionIdx}`,
      },
    },
  ],
  created: (event) => [
    {
      view: 'h4',
      content: {
        view: 'badge',
        data: {
          text: `${event.data.class} #${event.id}, gen:${event.data.generation}`,
          color: 'green',
          textColor: 'white',
        },
      },
    },
    'h4:"EvaluatedOnly"',
    'ul:$.data.evaluatedOnly',

    'h4:"RequiredOnly"',
    'ul:$.data.only',

    {
      view: 'switch',
      data: '$.data.isExportsInherited',
      content: [
        {
          when: '$',
          content: 'h5:"✔️ exports is inherited"',
        },
        {
          content: 'text:""',
        },
      ],
    },

    {
      view: 'switch',
      data: '$.data.parentId',
      content: [
        {
          when: '$',
          content: [
            {
              view: 'h4',
              content: [
                'text:"Parent "',
                {
                  view: 'badge',
                  data: {
                    text: `#${event.data.parentId}`,
                    color: 'green',
                    textColor: 'white',
                  },
                },
              ],
            },
          ],
        },
        {
          content: 'text:""',
        },
      ],
    },
  ],
  setTransformResult: (event) => [
    {
      view: 'badge',
      data: {
        text: `setResult(isNull: ${JSON.stringify(event.data.isNull)})`,
        color: 'red',
        textColor: 'white',
      },
    },
  ],
  superseded: (event) => [
    {
      view: 'badge',
      data: {
        text: `superseded by ${event.data.with}`,
        color: 'purple',
        textColor: 'white',
      },
    },
  ],
};

discovery.view.define(
  'entrypoint-event',
  (el, config, event, context) => {
    // (fieldsByType[event.type] ?? ((i) => i))(event.data)
    return discovery.view.render(
      el,
      fieldsByType[event.type](event),
      event,
      context
    );
  },
  {
    tag: 'div',
  }
);

discovery.view.define(
  'entrypoint-timeline',
  (el, config, data, context) => {
    const ids = new Set();
    data.forEach((event) => {
      ids.add(event.id);
    });

    const columns = [...ids].map((id, idx) => ({
      id,
      header: `#${id}`,
      content: {
        view: 'switch',
        data: `$[${idx + 1}]`,
        content: [
          {
            when: '$ = ""',
            content: 'text:""',
          },
          {
            content: [
              {
                view: 'entrypoint-event',
                data: `$`,
              },
            ],
          },
        ],
      },
    }));

    let lastTimestamp = 0;
    const rows = data.map((event) => {
      const row = Array(columns.length + 1).fill('');
      row[0] = lastTimestamp
        ? `+${(event.timestamp - lastTimestamp).toFixed(2)}`
        : event.timestamp.toFixed(2);
      lastTimestamp = event.timestamp;

      row[columns.findIndex((col) => col.id === event.id) + 1] = event;
      return row;
    });

    return discovery.view.render(
      el,
      [
        {
          view: 'table',
          data: rows,
          cols: [
            { header: 'Time', content: 'text:$[0]', className: 'number' },
            ...columns,
          ],
        },
      ],
      data,
      context
    );
  },
  { tag: 'div' }
);

discovery.page.define('entrypoint', {
  view: 'context',
  data: `{
    idx: #.id,
    events: @.entrypointEvents.[$.idx = #.id],
  }`,
  content: [
    'h1:"Entrypoint " + idx',
    {
      view: 'entrypoint-timeline',
      data: 'events',
    },
  ],
});
