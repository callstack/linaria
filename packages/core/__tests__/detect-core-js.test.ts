import cp from 'child_process';

const waitForProcess = async (process: cp.ChildProcess) => {
  return new Promise((resolve) => {
    let output = '';
    process.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    process.on('close', () => {
      resolve(output);
    });
  });
};

it('Ensures that package do not include core-js dependency after build', async () => {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const packageJSON = require('@linaria/core/package.json');
  const buildScript = packageJSON.scripts['build:corejs-test'];

  const proc = cp.exec(buildScript, {
    env: {
      ...process.env,
      DEBUG_CORE_JS: 'true',
    },
  });
  const result = await waitForProcess(proc);
  // run `DEBUG_CORE_JS=true yarn build:lib` to debug issues with introduced core-js dependency
  expect(result).not.toContain(
    'The corejs3 polyfill added the following polyfills'
  );
  expect(result).toContain(
    'Based on your code and targets, the corejs3 polyfill did not add any polyfill'
  );
}, 15000);
