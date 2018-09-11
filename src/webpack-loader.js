const os = require('os');
const fs = require('fs');
const path = require('path');
const { SourceMapGenerator } = require('source-map');
const slugify = require('./slugify');

module.exports = function(content) {
  this.cacheable();

  let css = '';
  let mappings = null;
  let found = false;
  let comment = false;

  content.split('\n').forEach(line => {
    if (line === '/*') {
      comment = true;
    } else if (line === '*/') {
      comment = false;
    } else if (line === 'CSS OUTPUT START' && comment) {
      found = true;
    } else if (line === 'CSS OUTPUT END' && comment) {
      found = false;
    } else if (found) {
      css += line + '\n';
    } else if (line.startsWith('CSS MAPPINGS:')) {
      try {
        mappings = JSON.parse(line.substr(13));
      } catch (e) {
        // Ignore
      }
    }
  });

  if (css) {
    const slug = slugify(this.resourcePath);
    const filename = path.basename(this.resourcePath) + '_' + slug + '.css';
    const output = path.join(
      os.tmpdir(),
      this.resourcePath.split('/').join('_') + '_' + filename
    );

    if (mappings) {
      const generator = new SourceMapGenerator({
        file: filename,
      });

      mappings.forEach(map =>
        generator.addMapping(Object.assign(map, { source: this.resourcePath }))
      );

      generator.setSourceContent(
        this.resourcePath,
        this.fs.readFileSync(this.resourcePath).toString()
      );

      css +=
        '/*# sourceMappingURL=data:application/json;base64,' +
        Buffer.from(generator.toString()).toString('base64') +
        '*/';
    }

    fs.writeFileSync(output, css);

    return `${content}\n\nrequire("${output}")`;
  }

  return content;
};
