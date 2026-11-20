import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('dummy-id')) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
          },
        });
        this.logger.log(`Supabase client initialized successfully with URL: ${supabaseUrl}`);
      } catch (error) {
        this.logger.error('Failed to initialize Supabase client:', error.message);
      }
    } else {
      this.logger.warn('Supabase credentials not configured or set to dummy values. Supabase integration is in mock/standby mode.');
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'https://placeholder.supabase.co';
      const supabaseKey = this.configService.get<string>('SUPABASE_KEY') || 'placeholder-key';
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
    }
    return this.client;
  }

  isConfigured(): boolean {
    const url = this.configService.get<string>('SUPABASE_URL');
    return !!(url && !url.includes('dummy-id') && !url.includes('placeholder'));
  }

  async uploadFile(bucket: string, filePath: string, fileBuffer: Buffer, contentType: string) {
    if (!this.isConfigured()) {
      this.logger.warn(`Mock upload for ${filePath} in bucket ${bucket}`);
      return { path: filePath, publicUrl: `/uploads/${filePath}` };
    }
    const { data, error } = await this.getClient().storage.from(bucket).upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;
    const { data: urlData } = this.getClient().storage.from(bucket).getPublicUrl(filePath);
    return { path: data.path, publicUrl: urlData.publicUrl };
  }

  async syncRecordToSupabase(table: string, payload: Record<string, any>) {
    if (!this.isConfigured()) return null;
    const { data, error } = await this.getClient().from(table).upsert(payload).select();
    if (error) {
      this.logger.error(`Error syncing record to Supabase table ${table}:`, error.message);
      return null;
    }
    return data;
  }
}
