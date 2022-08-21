# CLI

Linaria CLI (`@linaria/cli`) allows you to extract CSS from your source files using a command line.

### Usage

```bash
yarn linaria [options] <file1> [<fileN>...]
```

Option `-o, --out-dir <dir>` __is always required__.

You can also use glob for specifying files to process:

```bash
yarn linaria -o styles src/component/**/*.js
# or multiple globs
yarn linaria -o styles src/component/**/*.js src/screens/**/*.js
```

CLI supports adding a require statement for generated CSS file automatically:

```bash
yarn linaria -o out-dir --source-root src --insert-css-requires dist src/**/*.js
```

where `source-root` is directory with source JS files and `insert-css-requires` has directory with transpiled/compiled JS files.

### Options

* `-o, --out-dir <dir>` (__required__) - Output directory for the extracted CSS files
* `-s, --source-maps` - Generate source maps for the CSS files
* `-r, --source-root <dir>` - Directory containing the source JS files
* `-i, --insert-css-requires <dir>` - Directory containing JS files to insert require statements for the CSS files (__works only if `-r, --source-root` is provided__)
* `-c, --config-file <filepath>` - Path to the configuration file. If a relative path is given, it'll be resolved relative to the current working directory.
* `-x, --ignore "<pattern>"` - Pattern of files to ignore. Be sure to wrap with quotes.
* `-m, --modules <type>` - Specifies a type of used imports.
* `-t, --transform <boolean>` - Replace template tags with evaluated values.
 
