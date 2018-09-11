const os = require('os');
const fs = require('fs');
const path = require('path');
const slugify = require('./slugify');

module.exports = function(content) {
  this.cacheable();

  let css = '';
  let found = false;

  content.split('\n').forEach(line => {
    if (line === '/*CSS OUTPUT START') {
      found = true;
    } else if (line === 'CSS OUTPUT END*/') {
      found = false;
    } else if (found) {
      css += line;
    }
  });

  if (css) {
    const slug = slugify(this.resourcePath);
    const filename = path.basename(this.resourcePath) + '_' + slug + '.css';
    const output = path.join(
      os.tmpdir(),
      this.resourcePath.split('/').join('_') + '_' + filename
    );

    fs.writeFileSync(output, css);

    return `${content}\n\nrequire("${output}")`;
  }

  return content;
};
