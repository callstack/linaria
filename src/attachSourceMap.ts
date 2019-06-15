import convert from 'convert-source-map';

/**
 * **Linaria attachSourceMap Loader**
 *
 * Takes generated CSS file from Linaria and reads and removes the source map comment.
 * In instance of convert-source-map is attached as metadata to the file.
 * After processing the css with PostCSS,
 * this should be followed by the **fixSourceMap loader**,
 * which will replace the source file name and source contents in the generated source map.
 */
export default function loader(this: any, code: string, map: any, meta: any) {
  if (this.resourcePath.includes('linaria.css')) {
    let re = /\/\*# sourceMappingURL=data:application\/json;base64,.*$/m;
    if (re.test(code)) {
      let match = code.match(re);
      if (match) {
        map = convert.fromComment(match.pop());
      }
      // Overwrite map and attach meta
      code = code.replace(re, '');
      if (!meta) meta = {};
      meta.linaria = {
        originalSourceMapConverter: map,
      };
    }
    this.callback(null, code, map.toObject(), meta);
  } else {
    this.callback(null, code, map, meta);
  }
}
