import LRUCache from 'lru-cache';
import type { PackageInfo } from '../types';
import { hashPackageInfo } from '../utils/get-hash';
import { packageDependency } from './package-dependency';

export class DependencyPackager {
  private static PACKAGE_RESULT_CACHE_MAX_CAPACITY = 500;

  private readonly packageResultLRUCache: LRUCache<string, Record<any, any>>;

  constructor() {
    this.packageResultLRUCache = new LRUCache({
      max: DependencyPackager.PACKAGE_RESULT_CACHE_MAX_CAPACITY
    });
  }

  async packageDependency(dependency: PackageInfo) {
    const packageHash = hashPackageInfo(dependency);
    if (this.packageResultLRUCache.has(packageHash)) {
      return this.packageResultLRUCache.get(packageHash);
    } else {
      const result = await packageDependency(dependency);
      this.packageResultLRUCache.set(packageHash, result);
      return result;
    }
  }

  getPackageResultLRUCache() {
    return this.packageResultLRUCache;
  }
}
