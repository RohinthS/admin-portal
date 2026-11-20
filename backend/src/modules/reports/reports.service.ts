import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema';
import { Enquiry, EnquiryDocument } from '../../schemas/enquiry.schema';
import { ExpenseEntry, ExpenseEntryDocument } from '../../schemas/expense.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { Task, TaskDocument } from '../../schemas/task.schema';
import { DailyReport, DailyReportDocument } from '../../schemas/daily-report.schema';
import { Installment, InstallmentDocument } from '../../schemas/installment.schema';
import { LeaveRequest, LeaveRequestDocument } from '../../schemas/leave.schema';
import { Course, CourseDocument } from '../../schemas/course.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Receipt.name) private readonly receiptModel: Model<ReceiptDocument>,
    @InjectModel(Enquiry.name) private readonly enquiryModel: Model<EnquiryDocument>,
    @InjectModel(ExpenseEntry.name) private readonly expenseModel: Model<ExpenseEntryDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(DailyReport.name) private readonly dailyReportModel: Model<DailyReportDocument>,
    @InjectModel(Installment.name) private readonly installmentModel: Model<InstallmentDocument>,
    @InjectModel(LeaveRequest.name) private readonly leaveModel: Model<LeaveRequestDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  async getDashboardStats(companyId?: string) {
    const filter: any = {};
    if (companyId) filter.company_id = new Types.ObjectId(companyId);

    const [totalEnrollments, totalEnquiries, receipts, expenses, pendingTasks] = await Promise.all([
      this.enrollmentModel.countDocuments(filter),
      this.enquiryModel.countDocuments(filter),
      this.receiptModel.find(filter).select('total_amount payment_splits'),
      this.expenseModel.find(filter).select('amount'),
      this.taskModel.countDocuments({ ...filter, status: { $ne: 'completed' } }),
    ]);

    const totalCollection = receipts.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = totalCollection - totalExpenses;

    // Payment mode breakdown
    const modeBreakdown: Record<string, number> = { cash: 0, upi: 0, card: 0, bank_transfer: 0 };
    for (const r of receipts) {
      if (r.payment_splits) {
        for (const s of r.payment_splits) {
          modeBreakdown[s.mode] = (modeBreakdown[s.mode] || 0) + (s.amount || 0);
        }
      }
    }

    // Recent 5 enrollments
    const recentEnrollments = await this.enrollmentModel
      .find(filter)
      .populate('course_id', 'course_name')
      .sort({ createdAt: -1 })
      .limit(5);

    // ==========================================
    // MANAGER & ADMIN DASHBOARD: REMINDERS & KPIS
    // ==========================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertThreshold = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const todayStr = new Date().toISOString().slice(0, 10);

    const [installments, enrollments, pendingLeavesCount, tasksCompletedToday, reportsSubmittedToday, rawTasks] = await Promise.all([
      this.installmentModel.find(filter).sort({ enrollment_id: 1, installment_no: 1 }),
      this.enrollmentModel.find(filter).populate('course_id', 'course_name'),
      this.leaveModel.countDocuments({ ...filter, status: { $regex: /^pending$/i } }),
      this.taskModel.countDocuments({ ...filter, status: 'completed' }),
      this.dailyReportModel.countDocuments({ ...filter, report_date: todayStr }),
      this.taskModel.find(filter).populate('assigned_to', 'name username').sort({ due_date: -1 }).limit(10),
    ]);

    const enrollMap: Record<string, any> = {};
    for (const e of enrollments) {
      enrollMap[e._id.toString()] = e;
    }

    const pending_reminders: any[] = [];
    const running_totals: Record<string, number> = {};

    for (const inst of installments) {
      const enrollId = inst.enrollment_id?.toString();
      const enr = enrollMap[enrollId];
      if (!enr || enr.status === 'closed' || (enr as any).course_closed) continue;

      if (!running_totals[enrollId]) running_totals[enrollId] = 0;
      const instAmount = Number(inst.due_amount || 0);
      const paidAmount = Number(enr.paid_amount || 0);
      running_totals[enrollId] += instAmount;

      if (running_totals[enrollId] > paidAmount) {
        const paidAllocated = paidAmount - (running_totals[enrollId] - instAmount);
        let installmentPending = instAmount;
        if (paidAllocated > 0) installmentPending -= paidAllocated;

        const dueDate = new Date(inst.due_date);
        if (dueDate <= alertThreshold) {
          const courseObj = enr.course_id as any;
          pending_reminders.push({
            _id: inst._id,
            enrollment_id: enr._id,
            enrollment_no: enr.enrollment_no,
            student_name: enr.student_name,
            course_name: courseObj?.course_name || 'N/A',
            doj: enr.joining_date,
            due_date: inst.due_date,
            due_amount: installmentPending,
            total_fees: enr.total_fees || 0,
            paid_amount: enr.paid_amount || 0,
            balance_amount: enr.balance_amount ?? (enr.total_fees - enr.paid_amount),
            priority: dueDate < today ? 'overdue' : 'upcoming',
          });
        }
      }
    }

    // Sort reminders so overdue comes first, then by due date
    pending_reminders.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const today_tasks = rawTasks.map((t: any) => ({
      _id: t._id,
      title: t.title,
      assigned_to: t.assigned_to?.name || t.assigned_to?.username || 'Unassigned',
      due_date: t.due_date,
      status: t.status,
      priority: t.priority,
    }));

    return {
      totalEnrollments,
      totalEnquiries,
      totalCollection,
      totalExpenses,
      netProfit,
      pendingTasks,
      modeBreakdown,
      recentEnrollments,
      pending_reminders,
      action_required_count: pending_reminders.length,
      manager_stats: {
        pending_tasks: pendingTasks,
        tasks_completed: tasksCompletedToday,
        reports_submitted: reportsSubmittedToday,
        pending_leaves: pendingLeavesCount,
      },
      today_tasks,
    };
  }

  async getCollectionReport(companyId?: string, startDate?: string, endDate?: string) {
    const filter: any = { status: 1 };
    if (companyId) filter.company_id = new Types.ObjectId(companyId);
    if (startDate && endDate) {
      filter.receipt_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    return this.receiptModel
      .find(filter)
      .populate('enrollment_id', 'student_name phone course_type')
      .sort({ receipt_date: -1 });
  }

  async getStudentDashboardStats(user: any, companyId?: string) {
    const userId = user?.sub || user?.id || user?._id;
    const username = user?.username;
    const name = user?.name;

    // 1. Locate student's enrollment
    const lookupQueries: any[] = [];
    if (username) lookupQueries.push({ enrollment_no: username });
    if (name) lookupQueries.push({ student_name: new RegExp(`^${name}$`, 'i') });
    if (user?.phone) lookupQueries.push({ phone: user.phone });

    let enrollment: any = null;
    if (lookupQueries.length > 0) {
      enrollment = await this.enrollmentModel
        .findOne({ $or: lookupQueries })
        .populate('course_id', 'course_name duration_days syllabus')
        .populate('company_id', 'company_name branch');
    }
    if (!enrollment && name) {
      enrollment = await this.enrollmentModel
        .findOne({ student_name: new RegExp(name, 'i') })
        .populate('course_id', 'course_name duration_days syllabus')
        .populate('company_id', 'company_name branch');
    }

    const enrollmentId = enrollment?._id;
    const entityIds: any[] = [];
    if (userId && Types.ObjectId.isValid(userId)) entityIds.push(new Types.ObjectId(userId));
    if (enrollmentId) entityIds.push(enrollmentId);

    // 2. Attendance percentage (matching PHP attendance calculation)
    let attendancePercentage = 0;
    if (entityIds.length > 0) {
      const attendanceRecords = await this.attendanceModel.find({
        $or: [
          { entity_id: { $in: entityIds } },
          { user_type: 'student', entity_id: { $in: entityIds } }
        ]
      });

      if (attendanceRecords.length > 0) {
        let presentWeight = 0;
        for (const rec of attendanceRecords) {
          if (rec.status === 'present') presentWeight += 1.0;
          else if (rec.status === 'half_day' || rec.status === 'leave') presentWeight += 0.5;
        }
        attendancePercentage = Math.round((presentWeight / attendanceRecords.length) * 100);
      }
    }

    // 3. Student Tasks (matching PHP student_tasks)
    let studentTasks: any[] = [];
    if (entityIds.length > 0) {
      studentTasks = await this.taskModel
        .find({
          $or: [
            { assigned_to: { $in: entityIds } },
            { task_for: 'student', assigned_to: { $in: entityIds } },
          ],
        })
        .populate('assigned_by', 'name username')
        .sort({ createdAt: -1 });
    }

    const pendingTasksCount = studentTasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'verified'
    ).length;

    // 4. Daily Reports Submitted
    let reportsCount = 0;
    let submittedReports: any[] = [];
    if (entityIds.length > 0) {
      submittedReports = await this.dailyReportModel
        .find({ entity_id: { $in: entityIds } })
        .sort({ report_date: -1, createdAt: -1 });
      reportsCount = submittedReports.length;
    }

    // 5. Today's assigned tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = studentTasks.filter((t) => {
      if (!t.due_date) return false;
      const dueStr = new Date(t.due_date).toISOString().split('T')[0];
      return dueStr === todayStr;
    });

    // 6. Payment receipts history
    let receipts: any[] = [];
    if (enrollmentId) {
      receipts = await this.receiptModel
        .find({ enrollment_id: enrollmentId })
        .sort({ receipt_date: -1 });
    }

    return {
      student: {
        id: userId,
        username: username || enrollment?.enrollment_no || 'Student',
        name: name || enrollment?.student_name || 'Student',
        enrollment_no: enrollment?.enrollment_no || username || 'WGF26012',
        course_name: enrollment?.course_id?.course_name || 'Professional Certification',
        course_duration: enrollment?.course_id?.duration_days ? `${enrollment.course_id.duration_days} Days` : '90 Days',
        company_name: enrollment?.company_id?.company_name || 'WeGrow Skill Campus',
        branch: enrollment?.company_id?.branch || 'Main Campus',
        joining_date: enrollment?.joining_date || enrollment?.createdAt || null,
        phone: enrollment?.phone || user?.phone || '',
        address: enrollment?.address || '',
        total_fees: enrollment?.total_fees || 0,
        paid_amount: enrollment?.paid_amount || 0,
        balance_amount: enrollment?.balance_amount || 0,
        status: enrollment?.status || 'active',
      },
      attendance_percentage: attendancePercentage,
      pending_tasks_count: pendingTasksCount,
      reports_submitted_count: reportsCount,
      today_tasks: todayTasks,
      all_tasks: studentTasks,
      daily_reports: submittedReports,
      receipts: receipts,
    };
  }
}

