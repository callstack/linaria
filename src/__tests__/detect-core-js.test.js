import cp from 'child_process';

const waitForProcess = async (process) => {
  return new Promise((resolve) => {
    let output = '';
    process.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    process.on('close', () => {
      resolve(output);
    });
  });
};

it('Ensures that package do not include core-js dependency after build', async () => {
  const packageJSON = require('../../package.json');
  const buildScript = packageJSON.scripts['build:lib'];

  const proc = cp.exec(buildScript, {
    stdio: 'ignore',
    env: {
      ...process.env,
      DEBUG_CORE_JS: 'true',
    },
  });
  const result = await waitForProcess(proc);
  // run `DEBUG_CORE_JS=true yarn build:lib` to debug issues with introduced core-js dependency
  expect(result).not.toContain('Added following core-js polyfill');
  expect(result).toContain(
    'Based on your code and targets, core-js polyfills were not added'
  );
}, 15000);
