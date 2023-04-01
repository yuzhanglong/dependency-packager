import * as path from 'path';
import * as npa from 'npm-package-arg';
import * as execa from 'execa';

export async function installDependencies(
  dependency: { name: string; version: string },
  packagePath: string,
) {
  const depString = `${dependency.name}@${dependency.version}`;
  const spec = npa(depString);

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
