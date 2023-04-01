import { Controller, Get } from '@nestjs/common';
import { DependencyPackager } from '@yzl/dependency-packager';

@Controller()
export class AppController {
  private dependencyPackager: DependencyPackager = new DependencyPackager();

  @Get()
  async getHello() {
    return this.dependencyPackager.packageDependency({
      name: '@babel/core',
      version: 'latest',
    });
  }
}
