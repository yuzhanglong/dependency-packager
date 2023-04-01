import { join } from 'path';
import JSON5 from 'json5';
import { flatten } from 'lodash';
import { fs } from 'mz';
import * as recursiveReaddir from 'recursive-readdir';
import type { IPackage } from './find-package-infos';
import type { IFileData } from './find-requires';

export function isReason(packageName: string, rootPath: string) {
  const bsConfigPath = join(
    rootPath,
    'node_modules',
    packageName,
    'bsconfig.json',
  );

  return fs.existsSync(bsConfigPath);
}

interface DirSpec {
  dir: string;
  type?: 'src' | 'dev';
  subdirs?: boolean | Array<string | DirSpec>;
}

export async function getReasonFiles(
  rootPath: string,
  packageInfos: { [dep: string]: IPackage },
): Promise<IFileData> {
  const reasonDependencies = Object.keys(packageInfos)
    .map(x => packageInfos[x].name)
    .filter(x => isReason(x, rootPath));

  const files: IFileData = {};

  await Promise.all(
    reasonDependencies.map(async (packageName) => {
      const packagePath = join(rootPath, 'node_modules', packageName);
      const bsConfigPath = join(packagePath, 'bsconfig.json');

      const bsConfig = await fs
        .readFile(bsConfigPath)
        .then(data => JSON5.parse(data.toString()));

      const sources: Array<string | DirSpec>
        = typeof bsConfig.sources === 'string'
          ? [bsConfig.sources]
          : bsConfig.sources;

      const sourcePaths: Array<string | string[]> = (
        await Promise.all(
          sources.map(async (srcSpec) => {
            if (typeof srcSpec === 'string') {
              return join(packagePath, srcSpec);
            }

            if (!srcSpec.type || srcSpec.type === 'src') {
              if (!('subdirs' in srcSpec) || srcSpec.subdirs === false) {
                return join(packagePath, srcSpec.dir);
              }

              if (srcSpec.subdirs && Array.isArray(srcSpec.subdirs)) {
                return srcSpec.subdirs.map((subdir) => {
                  if (typeof subdir === 'string') {
                    return join(packagePath, srcSpec.dir, subdir);
                  }

                  return join(packagePath, srcSpec.dir, subdir.dir);
                });
              } else {
                // Read all subdirs
                return recursiveReaddir(packagePath).then(f =>
                  f.filter(p => fs.lstatSync(p).isDirectory()),
                );
              }
            } else {
              return undefined;
            }
          }),
        )
      ).filter(Boolean) as Array<string | string[]>;

      const flattenedSources = flatten(sourcePaths);

      return Promise.all(
        flattenedSources.map(async (directory) => {
          const reFiles = (await fs.readdir(directory))
            .map(x => join(directory, x))
            .filter(x => fs.lstatSync(x).isFile())
            .filter(x => /\.rei?$/.test(x) || /\.mli?$/.test(x));

          return Promise.all(
            reFiles.map(async (filePath) => {
              const fileContents = await fs.readFile(filePath);
              files[filePath] = {
                content: fileContents.toString(),
                isModule: false,
              };
            }),
          );
        }),
      );
    }),
  );

  return files;
}
