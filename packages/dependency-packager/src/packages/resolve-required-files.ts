import { dirname, join } from 'path';
import { fs } from 'mz';
import type { IPackage } from './find-package-infos';

const FALLBACK_DIRS = ['dist', 'lib', 'build'];

export default async function resolveRequiredFiles(
  packagePath: string,
  packageInfo: IPackage,
) {
  let main
    = typeof packageInfo.browser === 'string'
      ? packageInfo.browser
      : packageInfo.module || packageInfo.main;

  let entryDir;

  if (!main) {
    const indexFileExists = fs.existsSync(join(packagePath, 'index.js'));
    if (indexFileExists) {
      main = 'index.js';
      entryDir = packagePath;
    } else {
      entryDir = FALLBACK_DIRS.map(d => join(packagePath, d)).find(
        dir => fs.existsSync(dir) && fs.lstatSync(dir).isDirectory(),
      );
    }
  } else {
    entryDir = join(packagePath, dirname(main));
  }

  if (!entryDir) {
    return [];
  }

  const files: string[] = [];

  if (main) {
    [
      join(packagePath, main),
      join(packagePath, `${main}.js`),
      join(packagePath, `${main}.cjs`),
      join(packagePath, `${main}.mjs`),
      join(packagePath, main, 'index.js'),
    ].find((p) => {
      try {
        const stat = fs.statSync(p);

        if (stat.isFile()) {
          files.push(p);
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    });
  }

  return files;
}
