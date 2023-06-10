import { Module } from '@nestjs/common';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => new Redis(process.env["REDIS_URL"]),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisClientModule {}
