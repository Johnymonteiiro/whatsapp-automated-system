import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get_data_cached<T>(key: string): Promise<T | undefined> {
    const data = await this.cacheManager.get<T>(key);
    return data;
  }

  async store_data_cache<T>(key: string, data: T, ttl?: number): Promise<void> {
    const timeExpire = ttl ? ttl : 300;
    await this.cacheManager.set<T>(key, data, timeExpire);
  }
}
