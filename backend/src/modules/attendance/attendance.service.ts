import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { CreditTransaction, CreditTransactionDocument } from '../../schemas/credit-transaction.schema';
import { CreditRule, CreditRuleDocument } from '../../schemas/credit-rule.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(CreditTransaction.name) private readonly txModel: Model<CreditTransactionDocument>,
    @InjectModel(CreditRule.name) private readonly ruleModel: Model<CreditRuleDocument>,
  ) {}

  async getAttendance(companyId: string, date: string, userType: 'staff' | 'student') {
    return this.attendanceModel.find({
      company_id: new Types.ObjectId(companyId),
      attendance_date: date,
      user_type: userType,
    });
  }

  async markAttendance(data: {
    company_id: string;
    user_type: 'staff' | 'student';
    records: Array<{
      entity_id: string;
      status: 'present' | 'absent' | 'half_day' | 'holiday' | 'leave';
      in_time?: string;
      out_time?: string;
      remarks?: string;
    }>;
    attendance_date: string;
  }) {
    const operations = data.records.map((rec) => ({
      updateOne: {
        filter: {
          company_id: new Types.ObjectId(data.company_id),
          entity_id: new Types.ObjectId(rec.entity_id),
          attendance_date: data.attendance_date,
        },
        update: {
          $set: {
            user_type: data.user_type,
            status: rec.status,
            in_time: rec.in_time,
            out_time: rec.out_time,
            remarks: rec.remarks,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await this.attendanceModel.bulkWrite(operations);
    }

    let autoAwardedCount = 0;

    // AUTOMATIC ATTENDANCE CREDIT CALCULATION (STUDENTS ONLY)
    // When staff marks attendance in the portal, calculate student attendance and reward credits if criteria met
    if (data.user_type === 'student' && Array.isArray(data.records) && data.records.length > 0) {
      try {
        const companyObjId = data.company_id ? new Types.ObjectId(data.company_id) : null;
        let threshold = 85;
        let bonusCredits = 25;

        // Retrieve campus attendance credit rules if configured
        if (companyObjId) {
          const ruleDoc = await this.ruleModel.findOne({ company_id: companyObjId });
          if (ruleDoc && Array.isArray(ruleDoc.categories)) {
            for (const cat of ruleDoc.categories) {
              if (Array.isArray(cat?.items)) {
                for (const it of cat.items) {
                  if (it?.id === 'attendance_bonus' || (it?.title && it.title.toLowerCase().includes('attendance'))) {
                    bonusCredits = Number(it.credits) || 25;
                    if (it.thresholdValue) threshold = Number(it.thresholdValue) || 85;
                    break;
                  }
                }
              }
            }
          }
        }

        const currentMonthKey = (data.attendance_date || new Date().toISOString()).substring(0, 7);

        for (const rec of data.records) {
          if (!rec.entity_id || !Types.ObjectId.isValid(rec.entity_id)) continue;
          const studentObjId = new Types.ObjectId(rec.entity_id);

          // 1. Calculate cumulative verified attendance for this student
          const allStudentRecords = await this.attendanceModel.find({
            entity_id: studentObjId,
            user_type: 'student',
          });

          const validSessions = allStudentRecords.filter((r) => r.status !== 'holiday');
          // Criterion 1: Must have at least 3 completed attendance sessions for valid data sample
          if (validSessions.length < 3) continue;

          let presentWeight = 0;
          for (const s of validSessions) {
            if (s.status === 'present') presentWeight += 1.0;
            else if (s.status === 'half_day' || s.status === 'leave') presentWeight += 0.5;
          }

          const attendancePct = Math.round((presentWeight / validSessions.length) * 100);

          // Criterion 2: Attendance percentage must reach or exceed required threshold (e.g. >= 85%)
          if (attendancePct >= threshold) {
            const sourceId = `att_bonus_${rec.entity_id}_${currentMonthKey}`;

            // Criterion 3: Must not have already received attendance credit for this monthly cycle
            const existingTx = await this.txModel.findOne({
              $or: [
                { source_id: sourceId },
                { student_id: studentObjId, category: 'attendance_bonus', source_id: sourceId },
              ],
            });

            if (!existingTx) {
              await this.txModel.create({
                company_id: companyObjId,
                student_id: studentObjId,
                category: 'attendance_bonus',
                title: `Attendance Milestone (${attendancePct}% Achieved)`,
                credits: bonusCredits,
                awarded_by: 'Staff Attendance System (Automated)',
                notes: `Automatically awarded upon staff attendance entry. Achieved ${attendancePct}% attendance across ${validSessions.length} recorded sessions (Required: ≥${threshold}% for cycle ${currentMonthKey}).`,
                source_id: sourceId,
                date: new Date().toISOString(),
              });
              autoAwardedCount++;
            }
          }
        }
      } catch (err) {
        console.error('Failed to auto-evaluate attendance credits upon attendance submission:', err);
      }
    }

    return {
      success: true,
      count: operations.length,
      autoAwardedCount,
    };
  }

  async getMonthlySummary(companyId: string, monthYear: string, userType: 'staff' | 'student') {
    // monthYear: 'YYYY-MM'
    const records = await this.attendanceModel.find({
      company_id: new Types.ObjectId(companyId),
      user_type: userType,
      attendance_date: { $regex: `^${monthYear}` },
    });

    return records;
  }
}
