/* @flow */

import path from 'path';
import child_process from 'child_process'; // eslint-disable-line camelcase
import puppeteer from 'puppeteer'; // eslint-disable-line import/no-extraneous-dependencies

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // eslint-disable-line no-undef

describe('website', () => {
  let server;
  let browser;
  let page;

  beforeAll(async () => {
    server = child_process.spawn('yarn', ['start'], {
      cwd: path.join(__dirname, '..'),
    });

    await new Promise((resolve, reject) => {
      server.stdout.on('data', data => {
        if (data.toString().includes('webpack: Compiled successfully.')) {
          resolve(data);
        }
      });

      server.stderr.on('data', data => {
        reject(data);
      });
    });
  });

  afterAll(async () => {
    server.kill();
  });

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    browser.close();
  });

  it('should launch website with webpack', async () => {
    await page.setViewport({ width: 800, height: 3260 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    const screenshot = await page.screenshot();

    /* $FlowFixMe */
    expect(screenshot).toMatchImageSnapshot();
  });

  it('should have babel preset configured', async done => {
    page.on('console', message => {
      if (
        message.args.some(m =>
          String(m).includes('Babel preset for Linaria is not configured')
        )
      ) {
        done.fail('Babel preset is not configured');
      }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    done();
  });
});
