module.exports = class RequireModuleError extends Error {
  constructor(error, moduleName) {
    super(error.message);

    this.name = 'RequireModuleError';

    const stack = error.stack.split('\n').slice(1);
    stack.unshift(this.toString());

    this.stack = stack.join('\n');
    this.meta = { moduleName };
  }
};
