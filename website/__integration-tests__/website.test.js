/* @flow */

const path = require('path');
const child_process = require('child_process'); // eslint-disable-line camelcase
const puppeteer = require('puppeteer'); // eslint-disable-line import/no-extraneous-dependencies
const { toMatchImageSnapshot } = require('jest-image-snapshot'); // eslint-disable-line import/no-extraneous-dependencies
const config = require('../serve.config');

expect.extend({ toMatchImageSnapshot });

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // eslint-disable-line no-undef

let server;

beforeAll(async () => {
  server = child_process.spawn('yarn', ['server'], {
    cwd: path.join(__dirname, '..'),
    detached: true,
  });

  await new Promise((resolve, reject) => {
    server.stdout.on('data', data => {
      if (
        data.toString().includes(`Listening on http://localhost:${config.port}`)
      ) {
        resolve(data.toString());
      }
    });

    server.stderr.on('data', data => {
      reject(data.toString());
    });
  });
});

afterAll(() => {
  process.kill(-server.pid);
});

it('should launch website with webpack', async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(`http://localhost:${config.port}`, {
    waitUntil: 'networkidle2',
  });

  const screenshot = await page.screenshot();

  await browser.close();

  /* $FlowFixMe */
  expect(screenshot).toMatchImageSnapshot();
});
