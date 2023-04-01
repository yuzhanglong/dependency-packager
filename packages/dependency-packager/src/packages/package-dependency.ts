import * as path from 'path';
import * as fs from 'fs';
import findDependencyDependencies from '../dependencies/find-dependency-dependencies';
import { installDependencies } from '../dependencies/install-dependencies';
import type { PackageInfo } from '../types';
import { hashPackageInfo } from '../utils/get-hash';
import type { IPackage } from './find-package-infos';
import findPackageInfos from './find-package-infos';
import type { IFileData } from './find-requires';
import findRequires from './find-requires';

async function getContents(
  dependency: PackageInfo,
  packagePath: string,
  packageInfos: { [p: string]: IPackage },
): Promise<IFileData> {
  const contents = await findRequires(
    dependency.name,
    packagePath,
    packageInfos,
  );

  const packageJSONFiles = Object.keys(packageInfos).reduce(
    (total, next) => ({
      ...total,
      [next.replace(packagePath, '')]: {
        content: JSON.stringify(packageInfos[next]),
      },
    }),
    {},
  );

  return { ...contents, ...packageJSONFiles };
}

function verifyModuleField(pkg: IPackage, pkgLoc: string) {
  if (!pkg.module) {
    return;
  }

  try {
    const basedir = path.dirname(pkgLoc);

    const found = [
      path.join(basedir, pkg.module),
      path.join(basedir, `${pkg.module}.js`),
      path.join(basedir, `${pkg.module}.cjs`),
      path.join(basedir, `${pkg.module}.mjs`),
      path.join(basedir, pkg.module, 'index.js'),
      path.join(basedir, pkg.module, 'index.mjs'),
    ].find((p) => {
      try {
        const l = fs.statSync(p);
        return l.isFile();
      } catch (e) {
        return false;
      }
    });

    if (!found) {
      pkg.csbInvalidModule = pkg.module;
      delete pkg.module;
    }
  } catch (e) {
    /* */
  }
}

export const packageDependency = async (dependency: PackageInfo) => {
  const hash = hashPackageInfo(dependency);

  const startTime = Date.now();

  if (!dependency) {
    throw new Error('Please provide a dependency');
  }

  if (!hash) {
    throw new Error('Could not get hash');
  }

  const packagePath = path.resolve('/tmp', hash);

  await installDependencies(dependency, packagePath, false);
  const packageInfos = await findPackageInfos(dependency.name, packagePath);

  Object.keys(packageInfos).forEach((pkgJSONPath) => {
    const pkg = packageInfos[pkgJSONPath];
    verifyModuleField(pkg, pkgJSONPath);
  });

  const contents = await getContents(dependency, packagePath, packageInfos);

  const requireStatements: string[] = [];

  Object.keys(contents).forEach((p) => {
    const c = contents[p];

    if (c.requires) {
      c.requires.forEach((r) => {
        requireStatements.push(r);
      });
    }
  });

  const dependencyDependencies = findDependencyDependencies(
    dependency,
    packagePath,
    packageInfos,
    requireStatements,
    contents
  );

  // eslint-disable-next-line no-console
  console.log(`Done - ${Date.now() - startTime} - ${dependency.name}@${dependency.version}`);

  return {
    contents,
    dependency,
    ...dependencyDependencies
  };
};
