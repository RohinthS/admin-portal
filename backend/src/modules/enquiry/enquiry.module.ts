import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnquiryService } from './enquiry.service';
import { EnquiryController } from './enquiry.controller';
import { Enquiry, EnquirySchema, EnquiryFollowup, EnquiryFollowupSchema } from '../../schemas/enquiry.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enquiry.name, schema: EnquirySchema },
      { name: EnquiryFollowup.name, schema: EnquiryFollowupSchema },
    ]),
    AuthModule,
  ],
  controllers: [EnquiryController],
  providers: [EnquiryService],
  exports: [EnquiryService, MongooseModule],
})
export class EnquiryModule {}
