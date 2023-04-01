import { Controller, Get, Req, Request } from '@nestjs/common';
import { DependencyPackager } from '@yzl/dependency-packager';

@Controller('/')
export class AppController {
  private dependencyPackager: DependencyPackager = new DependencyPackager();

  @Get('package-dependency/*')
  async packageDependency(@Req() request: Request) {
    const packageParts = request.url.replace('/package-dependency/', '').split('@');
    console.log(packageParts);
    return this.dependencyPackager.packageDependency({
      name: 'react',
      version: 'latest',
    });
  }
}
