import { Controller, Get, Req, Request } from '@nestjs/common';
import { DependencyPackager, PackageInfo } from '@yzl/dependency-packager';
import { Response } from 'express';
import * as semver from 'semver';
import { hashPackageInfo } from '@yzl/dependency-packager/lib/utils/get-hash';
import { Res } from './utils/response';
import { redisInstance } from './utils/redis';

@Controller('/')
export class AppController {
  private dependencyPackager: DependencyPackager = new DependencyPackager();

  @Get('package-dependency/*')
  async packageDependency(@Req() request: Request, @Res() response: Response) {
    const packageURL = request.url.replace('/package-dependency/', '');
    const packageParts = packageURL.split('@');

    const packageInfo: PackageInfo = { name: '', version: '' };
    if (packageParts.length === 3) {
      // 形如 @babel/runtime@version 格式
      const [, name, version] = packageParts;
      packageInfo.name = `@${name}`;
      packageInfo.version = version;
    } else if (packageParts.length === 2) {
      // 形如 react@version 格式
      const [name, version] = packageParts;
      packageInfo.name = name;
      packageInfo.version = version;
    } else {
      throw new Error('Invalid package name');
    }

    // 如果为 semver 版本，可以认为该 package 永远不会发生变化，此时通过浏览器的 Cache 机制来优化性能 + Redis 缓存机制
    if (semver.valid(packageInfo.version)) {
      // 浏览器 Cache
      response.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');

      // Redis Cache
      const cachedDependencyInfo = await redisInstance.get(hashPackageInfo(packageInfo));
      if (cachedDependencyInfo) {
        // eslint-disable-next-line no-console
        console.log('redis cache hit: ', packageInfo.name, packageInfo.version);
        return cachedDependencyInfo;
      } else {
        const dependencyInfo = await this.dependencyPackager.packageDependency(packageInfo, false);
        await redisInstance.set(hashPackageInfo(packageInfo), JSON.stringify(dependencyInfo));
        return dependencyInfo;
      }
    } else {
      return this.dependencyPackager.packageDependency(packageInfo, false);
    }
  }
}
