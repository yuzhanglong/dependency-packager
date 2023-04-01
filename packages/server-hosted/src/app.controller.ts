import { Controller, Get, Req, Request } from '@nestjs/common';
import { DependencyPackager, PackageInfo } from '@yzl/dependency-packager';

@Controller('/')
export class AppController {
  private dependencyPackager: DependencyPackager = new DependencyPackager();

  @Get('package-dependency/*')
  async packageDependency(@Req() request: Request) {
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

    return this.dependencyPackager.packageDependency(packageInfo);
  }
}
