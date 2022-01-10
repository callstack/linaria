"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chmod = chmod;
exports.readdir = readdir;
exports.readdirForCompilable = readdirForCompilable;
exports.isCompilableExtension = isCompilableExtension;
exports.addSourceMappingUrl = addSourceMappingUrl;
exports.transform = transform;
exports.compile = compile;
exports.deleteDir = deleteDir;
exports.requireChokidar = requireChokidar;
exports.withExtension = withExtension;
exports.debounce = debounce;

function _fsReaddirRecursive() {
  const data = require("fs-readdir-recursive");

  _fsReaddirRecursive = function () {
    return data;
  };

  return data;
}

function babel() {
  const data = require("@babel/core");

  babel = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = require("path");

  _path = function () {
    return data;
  };

  return data;
}

function _fs() {
  const data = require("fs");

  _fs = function () {
    return data;
  };

  return data;
}

function _module() {
  const data = require("module");

  _module = function () {
    return data;
  };

  return data;
}

function chmod(src, dest) {
  try {
    _fs().chmodSync(dest, _fs().statSync(src).mode);
  } catch (err) {
    console.warn(`Cannot change permissions of ${dest}`);
  }
}

function readdir(dirname, includeDotfiles, filter) {
  return _fsReaddirRecursive()(dirname, (filename, _index, currentDirectory) => {
    const stat = _fs().statSync(_path().join(currentDirectory, filename));

    if (stat.isDirectory()) return true;
    return (includeDotfiles || filename[0] !== ".") && (!filter || filter(filename));
  });
}

function readdirForCompilable(dirname, includeDotfiles, altExts) {
  return readdir(dirname, includeDotfiles, function (filename) {
    return isCompilableExtension(filename, altExts);
  });
}

function isCompilableExtension(filename, altExts) {
  const exts = altExts || babel().DEFAULT_EXTENSIONS;

  const ext = _path().extname(filename);

  return exts.includes(ext);
}

function addSourceMappingUrl(code, loc) {
  return code + "\n//# sourceMappingURL=" + _path().basename(loc);
}

const CALLER = {
  name: "@babel/cli"
};

function transform(filename, code, opts) {
  opts = Object.assign({}, opts, {
    caller: CALLER,
    filename
  });
  return new Promise((resolve, reject) => {
    babel().transform(code, opts, (err, result) => {
      if (err) reject(err);else resolve(result);
    });
  });
}

function compile(filename, opts) {
  opts = Object.assign({}, opts, {
    caller: CALLER
  });
  return new Promise((resolve, reject) => {
    babel().transformFile(filename, opts, (err, result) => {
      if (err) reject(err);else resolve(result);
    });
  });
}

function deleteDir(path) {
  if (_fs().existsSync(path)) {
    _fs().readdirSync(path).forEach(function (file) {
      const curPath = path + "/" + file;

      if (_fs().lstatSync(curPath).isDirectory()) {
        deleteDir(curPath);
      } else {
        _fs().unlinkSync(curPath);
      }
    });

    _fs().rmdirSync(path);
  }
}

process.on("uncaughtException", function (err) {
  console.error(err);
  process.exitCode = 1;
});

function requireChokidar() {
  try {
    return parseInt(process.versions.node) >= 8 ? require("chokidar") : require("@nicolo-ribaudo/chokidar-2");
  } catch (err) {
    console.error("The optional dependency chokidar failed to install and is required for " + "--watch. Chokidar is likely not supported on your platform.");
    throw err;
  }
}

function withExtension(filename, ext = ".js") {
  const newBasename = _path().basename(filename, _path().extname(filename)) + ext;
  return _path().join(_path().dirname(filename), newBasename);
}

function debounce(fn, time) {
  let timer;

  function debounced() {
    clearTimeout(timer);
    timer = setTimeout(fn, time);
  }

  debounced.flush = () => {
    clearTimeout(timer);
    fn();
  };

  return debounced;
}