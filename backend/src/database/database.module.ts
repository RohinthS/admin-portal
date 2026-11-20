import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://127.0.0.1:27017/wegrow_admin',
        autoIndex: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SupabaseService],
  exports: [MongooseModule, SupabaseService],
})
export class DatabaseModule {}
