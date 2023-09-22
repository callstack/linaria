const { join } = require('path');
const LineByLine = require('n-readlines');

const workingDir = join(process.cwd(), '..', '..', 'website', 'linaria-debug');

const files = ['actions', 'dependencies', 'entrypoints'];

const rawData = {};

files.forEach((file) => {
  rawData[file] = [];

  // Read and parse JSONl file line by line
  const liner = new LineByLine(join(workingDir, `${file}.jsonl`));
  let line;
  // eslint-disable-next-line no-cond-assign
  while ((line = liner.next())) {
    if (line) {
      rawData[file].push(JSON.parse(line));
    }
  }
});

const collections = {
  entrypointEvents: [],
  files: new Set(),
};

const idToIdx = new Map();

rawData.entrypoints.forEach((entrypoint) => {
  const [id, timestamp, { type, ...data }] = entrypoint;
  if ('idx' in data) {
    idToIdx.set(id, data.idx);
    collections.files.add(`${data.idx}:${data.filename}`);
  }

  const idx = idToIdx.get(id);
  collections.entrypointEvents.push({
    id,
    idx,
    timestamp,
    type,
    data,
  });
});

module.exports = {
  ...rawData,
  ...collections,
  files: [...collections.files],
};
