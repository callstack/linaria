/*
  Copyright © 2019 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { existsSync } = require('fs');

const chalk = require('chalk');
const execa = require('execa');

const { info } = console;
const key = 'webpack-plugin-ramdisk';

const getRoot = (name) => {
  const { platform } = process;

  return platform === 'darwin' ? `/Volumes/${name}` : `/mnt/${name}`;
};

const create = (options) => {
  const { platform } = process;
  const { blocks, root } = options;
  const commands = {
    darwin: `hdiutil attach -nomount ram://${blocks}`,
    linux: `sudo mkdir -p ${root}`
  };
  info(chalk.blue(`⬡ ${key}:`), 'Initializing RAMdisk. You may be prompted for credentials');
  const { stdout: diskPath } = execa.commandSync(commands[platform]);

  return diskPath.trim();
};

const mount = (options) => {
  const { platform } = process;
  const { bytes, diskPath, name, root } = options;
  const commands = {
    darwin: `diskutil erasevolume HFS+ ${name} ${diskPath}`,
    linux: `sudo mount -t tmpfs -o size=${bytes} tmpfs ${root}`
  };
  return execa.commandSync(commands[platform]);
};

module.exports = {
  cleanup(diskPath) {
    const command =
      process.platform === 'darwin' ? `hdiutil detach ${diskPath}` : `sudo umount ${diskPath}`;
    return execa.commandSync(command);
  },

  init(opts) {
    const root = getRoot(opts.name);
    const blocks = opts.bytes / opts.blockSize;
    const options = Object.assign({}, opts, { blocks, root });

    if (!existsSync(root)) {
      options.diskPath = create(options);
      mount(options);
    }

    return root;
  }
};
