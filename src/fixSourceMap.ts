/**
 * **Linaria fixSourceMap Loader**
 *
 * Apply this loader after transforming the CSS file but before concatenating several CSS files.
 * It will extract the original file information discovered by the **attachSourceMap** loader
 * and inject it into the transformed CSS sourceMap for a high resolution mapping.
 */
export default function loader(this: any, code: string, map: any, meta: any) {
  if (meta && meta.linaria && meta.linaria.originalSourceMapConverter) {
    let origMap = meta.linaria.originalSourceMapConverter;
    if (origMap && origMap.getProperty) {
      map.sources = origMap.getProperty('sources');
      map.sourcesContent = origMap.getProperty('sourcesContent');
    }
    this.callback(null, code, map);
  } else {
    this.callback(null, code, map);
  }
}
