import cp from 'child_process';

const waitForProcess = async process => {
  return new Promise(resolve => {
    let output = '';
    process.stdout.on('data', chunk => {
      output += chunk.toString();
    });
    process.on('close', () => {
      resolve(output);
    });
  });
};

it('Ensures that package do not include core-js dependency after build', async () => {
  const packageJSON = require('../../package.json');
  const buildScript = packageJSON.scripts.build;

  const proc = cp.exec(`NODE_ENV=debug ${buildScript}`, {
    stdio: 'ignore',
  });
  const result = await waitForProcess(proc);
  // run `NODE_ENV=debug yarn build` to debug issues with introduced core-js dependency
  expect(result).not.toContain('Added following core-js polyfill');
  expect(result).toContain('Successfully compiled');
});
