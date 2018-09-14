const fs = require('fs');

const writeFileSync = fs.writeFileSync;

let buffer = '';
const filenames = [];

fs.writeFileSync = (filename, data, opts) => {
  if (/\.css$/.test(filename)) {
    filenames.push(filename);
    buffer += data;
    return;
  }
  writeFileSync(filename, data, opts);
};

const transpile = require('./transpile');

const code = transpile(
  JSON.parse(process.argv[2]),
  JSON.parse(process.argv[3])
);

console.log(JSON.stringify(buffer));
console.log(JSON.stringify(filenames));
console.log(JSON.stringify(code || ''));
