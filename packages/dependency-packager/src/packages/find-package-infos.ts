import { basename, join } from 'path';
import { flatten } from 'lodash';
import { fs } from 'mz';

export interface IPackage {
  name: string;
  main?: string;
  browser?: string | { [path: string]: string | false };
  unpkg?: string;
  module?: string;
  es2015?: string;
  version: string;
  dependencies?: {
    [depName: string]: string;
  };
  peerDependencies?: {
    [depName: string]: string;
  };
  [key: string]: any;
}

function getDirectories(path: string): string[] {
  const directories = fs
    .readdirSync(path)
    .filter(file => !file.startsWith('.'))
    .filter(file => fs.lstatSync(join(path, file)).isDirectory())
    .map(file => join(path, file));

  return flatten(
    directories.map((directory) => {
      if (basename(directory).startsWith('@')) {
        // We will check what inside this directory if it starts with an @, because
        // this means that it's under an organization

        return getDirectories(directory);
      }

      const directoriesInDirectory = getDirectories(directory);
      // There is a chance of a recursive node_modules, make sure to add it as well
      const nodeModulesInside = directoriesInDirectory.find(
        d => basename(d) === 'node_modules',
      );

      if (nodeModulesInside) {
        return [directory, ...getDirectories(nodeModulesInside)];
      }

      return directory;
    }),
  );
}

export default async function findPackageInfos(
  packageName: string,
  rootPath: string,
): Promise<{ [depName: string]: IPackage }> {
  const directories = getDirectories(join(rootPath, 'node_modules'));

  const result: { [depName: string]: IPackage } = {};

  await Promise.all(
    directories.map(async (path) => {
      const pkgPath = join(path, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const contents = (await fs.readFile(pkgPath)).toString();
        result[pkgPath] = JSON.parse(contents);
      }
    }),
  );

  return result;
}
