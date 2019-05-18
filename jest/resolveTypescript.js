const Module = require('module');

// Add same .js filename resolution mechanism to .ts files, so
// that it can properly resolve files from tests.
Module._extensions['.ts'] = Module._extensions['.js'];
