import * as path from 'path';
import npa from 'npm-package-arg';
import execa from 'execa';
import * as fs from 'fs-extra';
import type { PackageInfo } from '../types';

export async function installDependencies(
  dependency: PackageInfo,
  packagePath: string,
  force?: boolean
) {
  const depString = `${dependency.name}@${dependency.version}`;
  const spec = npa(depString);

  console.log(packagePath);

  const file = await fs.pathExists(packagePath);

  // 如果该依赖已经被拉取，则跳过安装步骤
  // TODO: 处理 babel@6 、latest 这种动态决定最新版本的情况，否则会导致本地缓存的不是最新版本
  if (!force && file) {
    console.log('Skip install --', depString);
    return;
  }

  try {
    await execa('mkdir', ['-p', packagePath]);
    await execa(
      path.resolve(__dirname, '../..', 'node_modules', 'yarn', 'lib', 'cli.js'),
      [
        'add',
        depString,
        spec.type === 'git' ? '' : '--ignore-scripts',
        '--registry', 'https://registry.npmmirror.com',
        '--no-lockfile',
        '--non-interactive',
        '--no-bin-links',
        '--ignore-engines',
        '--skip-integrity-check',
        '--cache-folder',
        './'
      ],
      {
        cwd: packagePath,
        stderr: 'inherit',
        env: {
          HOME: '/tmp'
        }
      }
    );
  } catch (e) {
    console.warn(`got error from install: ${e}`);
    await fs.remove(packagePath);
    return e.message.includes('versions') ? new Error('INVALID_VERSION') : e;
  }
}
