import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { LeaveRequest, LeaveRequestSchema } from '../../schemas/leave.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LeaveRequest.name, schema: LeaveRequestSchema }]),
    AuthModule,
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService, MongooseModule],
})
export class LeavesModule {}
