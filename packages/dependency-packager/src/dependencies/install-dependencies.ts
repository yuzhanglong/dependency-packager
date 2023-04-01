import * as path from 'path';
import * as npa from 'npm-package-arg';
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

  // 如果该依赖已经被拉取，则跳过安装步骤
  const file = await fs.pathExists(packagePath);

  if (!force && file) {
    return;
  }

  try {
    await execa('mkdir', ['-p', packagePath]);
    await execa(
      path.resolve(process.cwd(), 'node_modules', 'yarn', 'lib', 'cli.js'),
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
        env: {
          HOME: '/tmp'
        }
      }
    );
  } catch (e) {
    console.warn(`got error from install: ${e}`);
    return e.message.includes('versions') ? new Error('INVALID_VERSION') : e;
  }
}
