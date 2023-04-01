import { dirname, join } from 'path';
import * as resolve from 'resolve';

import type { IPackage } from '../packages/find-package-infos';
import type { IFileData } from '../packages/find-requires';
import { packageFilter } from '../utils/resolver';

interface IPackageInfos {
  [depName: string]: IPackage;
}

interface IDependencyDependenciesInfo {
  dependencyDependencies: {
    [depName: string]: {
      parents: string[];
      semver: string;
      resolved: string;
      entries: string[];
    };
  };
  dependencyAliases: {
    [dep: string]: {
      [dep: string]: string;
    };
  };
  peerDependencies: { [depName: string]: string };
}

function rewriteContents(
  contents: IFileData,
  fromPath: string,
  dependency: string,
  version: string,
) {
  const files = Object.keys(contents).filter(p =>
    p.startsWith(`${fromPath}/`),
  );

  files.forEach((f) => {
    const info = contents[f]!;
    const relativePath = f.replace(`${fromPath}/`, '');
    delete contents[f];
    const newPath = `/node_modules/${dependency}/${version}/${relativePath}`;
    contents[newPath] = info;
  });
}

function findDependencies(
  dep: string, // This can be an aliased name, we also need the real name to look for the package in fs
  realDepName: string,
  packageInfos: IPackageInfos,
  requiresByDependencies: { [dep: string]: string[] },
  rootdir: string,
  basedir: string,
  totalObject: IDependencyDependenciesInfo,
  contents: IFileData,
) {
  const packageJSONPath = resolve.sync(join(realDepName, 'package.json'), {
    basedir,
    packageFilter,
    extensions: ['.wasm', '.mjs', '.js', '.json'],
  });

  if (!packageInfos[packageJSONPath]) {
    return;
  }

  const mainPackageInfo = packageInfos[packageJSONPath];

  if (mainPackageInfo.peerDependencies) {
    totalObject.peerDependencies = {
      ...totalObject.peerDependencies,
      ...mainPackageInfo.peerDependencies,
    };
  }

  const dependencies = mainPackageInfo.dependencies;
  if (dependencies) {
    Object.keys(dependencies).forEach((name) => {
      const depPackagePath = resolve.sync(join(name, 'package.json'), {
        basedir,
        extensions: ['.wasm', '.mjs', '.js', '.json'],
      });

      if (!packageInfos[depPackagePath]) {
        return;
      }

      const depPackageInfo = packageInfos[depPackagePath];
      const isRootDependendency
        = depPackagePath.split('/node_modules/').length === 2;

      let aliasedName = name;
      if (!isRootDependendency) {
        aliasedName += `/${depPackageInfo.version}`;
      }

      const depDep = totalObject.dependencyDependencies[aliasedName];

      if (!isRootDependendency) {
        totalObject.dependencyAliases[dep]
          = totalObject.dependencyAliases[dep] || {};

        rewriteContents(
          contents,
          depPackagePath.replace(rootdir, '').replace('/package.json', ''),
          name,
          depPackageInfo.version,
        );
        totalObject.dependencyAliases[dep][name] = aliasedName;
      }

      if (depDep) {
        if (!depDep.parents.includes(dep)) {
          depDep.parents.push(dep);
        }

        return;
      }

      totalObject.dependencyDependencies[aliasedName] = {
        semver: dependencies[name],
        resolved: depPackageInfo.version,
        parents: [dep],
        entries: (requiresByDependencies[name] || []).sort(),
      };

      findDependencies(
        aliasedName,
        name,
        packageInfos,
        requiresByDependencies,
        rootdir,
        dirname(depPackagePath),
        totalObject,
        contents,
      );
    });
  }

  return totalObject;
}

export default function findDependencyDependencies(
  dep: { name: string; version: string },
  rootPath: string,
  packageInfos: IPackageInfos,
  requires: string[],
  contents: IFileData,
) {
  const totalObject = {
    peerDependencies: {},
    dependencyDependencies: {},
    dependencyAliases: {},
  };

  const requireObject: { [dep: string]: string[] } = {};

  // We create an object that maps every dependency to the require statements
  // they are involved in. This way we know exactly what we require of dependencies
  for (const requireDep of requires) {
    if (!/^[\w|@\w]/.test(requireDep)) {
      continue;
    }

    const dependencyParts = requireDep.split('/');

    const dependencyName = requireDep.startsWith('@')
      ? `${dependencyParts[0]}/${dependencyParts[1]}`
      : dependencyParts[0];

    requireObject[dependencyName] = requireObject[dependencyName] || [];

    requireObject[dependencyName].push(requireDep);
  }

  return findDependencies(
    dep.name,
    dep.name,
    packageInfos,
    requireObject,
    rootPath,
    join(rootPath, 'node_modules', dep.name),
    totalObject,
    contents,
  );
}
