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
import { Staff, StaffDocument } from '../../schemas/staff.schema';
import { User, UserDocument } from '../../schemas/user.schema';

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
    @InjectModel(Staff.name) private readonly staffModel: Model<StaffDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats(companyId?: string, startDate?: string, endDate?: string) {
    const filter: any = {};
    if (companyId) filter.company_id = new Types.ObjectId(companyId);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const receiptFilter: any = { ...filter };
    const expenseFilter: any = { ...filter };
    const enrollmentFilter: any = { ...filter };

    if (startDate && endDate) {
      expenseFilter.expense_date = { $gte: startDate, $lte: endDate };
      const startD = new Date(startDate);
      startD.setHours(0, 0, 0, 0);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      receiptFilter.$or = [
        { receipt_date: { $gte: startD, $lte: endD } },
        { createdAt: { $gte: startD, $lte: endD } },
      ];
      enrollmentFilter.$or = [
        { joining_date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startD, $lte: endD } },
      ];
    }

    const [totalEnrollments, totalEnquiries, receipts, expenses, pendingTasks] = await Promise.all([
      this.enrollmentModel.countDocuments(enrollmentFilter),
      this.enquiryModel.countDocuments(filter),
      this.receiptModel.find(receiptFilter).select('total_amount payment_splits receipt_date createdAt'),
      this.expenseModel.find(expenseFilter).populate('category_id', 'category_name').sort({ expense_date: -1 }),
      this.taskModel.countDocuments({ ...filter, status: { $ne: 'completed' } }),
    ]);

    const totalCollection = receipts.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const netProfit = totalCollection - totalExpenses;

    // Current month expenses
    const currentMonthExpenses = expenses
      .filter((e) => e.expense_date && e.expense_date.startsWith(currentMonthKey))
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Current month collections
    const currentMonthCollection = receipts
      .filter((r) => {
        const d = r.receipt_date ? new Date(r.receipt_date) : new Date((r as any).createdAt || Date.now());
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return k === currentMonthKey;
      })
      .reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

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
    // MANAGER, GM, MD & ADMIN DASHBOARD: REMINDERS, MOM ANALYTICS & STAFF PULSE
    // ==========================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertThreshold = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const todayStr = new Date().toISOString().slice(0, 10);

    const [
      installments,
      enrollments,
      pendingLeavesCount,
      tasksCompletedToday,
      reportsSubmittedToday,
      rawTasks,
      allEnquiries,
      totalStaffCount,
      todayStaffAttendance,
      todayLeavesOnDuty,
      approvedLeavesThisMonth,
    ] = await Promise.all([
      this.installmentModel.find(filter).sort({ enrollment_id: 1, installment_no: 1 }),
      this.enrollmentModel.find(filter).populate('course_id', 'course_name'),
      this.leaveModel.countDocuments({ ...filter, status: { $regex: /^pending$/i } }),
      this.taskModel.countDocuments({ ...filter, status: 'completed' }),
      this.dailyReportModel.countDocuments({ ...filter, report_date: todayStr }),
      this.taskModel.find(filter).populate('assigned_to', 'name username').sort({ due_date: -1 }).limit(10),
      this.enquiryModel.find(filter).select('status enquiry_date createdAt source'),
      this.staffModel.countDocuments(filter).then(async (cnt) => {
        if (cnt > 0) return cnt;
        return this.userModel.countDocuments({ ...filter, user_type: { $in: ['staff', 'manager', 'mentor', 'hr', 'gm', 'md'] } });
      }),
      this.attendanceModel.find({ ...filter, user_type: 'staff', attendance_date: todayStr }),
      this.leaveModel
        .find({
          ...filter,
          status: { $regex: /^approved$/i },
          from_date: { $lte: todayStr },
          to_date: { $gte: todayStr },
        })
        .populate('staff_id', 'staff_name name emp_code designation department'),
      this.leaveModel.countDocuments({
        ...filter,
        status: { $regex: /^approved$/i },
        from_date: { $gte: `${currentMonthKey}-01` },
      }),
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

    const totalCourseFees = enrollments.reduce((sum, e) => sum + (e.total_fees || 0), 0);
    const totalPendingFees = Math.max(0, totalCourseFees - totalCollection);

    const today_tasks = rawTasks.map((t: any) => ({
      _id: t._id,
      title: t.title,
      assigned_to: t.assigned_to?.name || t.assigned_to?.username || 'Unassigned',
      due_date: t.due_date,
      status: t.status,
      priority: t.priority,
    }));

    // ----------------------------------------------------
    // 1. Month-on-Month New Student Admissions Calculation
    // ----------------------------------------------------
    const last6MonthsKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6MonthsKeys.push(`${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`);
    }

    const monthlyStudentsMap: Record<string, number> = {};
    for (const enr of enrollments) {
      const d = enr.joining_date ? new Date(enr.joining_date) : new Date((enr as any).createdAt || Date.now());
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyStudentsMap[k] = (monthlyStudentsMap[k] || 0) + 1;
    }

    const allStudentMonthKeys = Array.from(new Set([...Object.keys(monthlyStudentsMap), ...last6MonthsKeys])).sort();

    const momNewStudents = allStudentMonthKeys.map((mKey, idx) => {
      const count = monthlyStudentsMap[mKey] || 0;
      const prevKey = idx > 0 ? allStudentMonthKeys[idx - 1] : null;
      const prevCount = prevKey ? (monthlyStudentsMap[prevKey] || 0) : 0;
      let growthRate = 0;
      if (prevCount > 0) {
        growthRate = Math.round(((count - prevCount) / prevCount) * 100);
      } else if (count > 0 && idx > 0) {
        growthRate = 100;
      }

      const [yr, mo] = mKey.split('-');
      const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: mKey,
        monthLabel,
        count,
        prevCount,
        growthRate,
      };
    });

    const currentMonthNewStudents = monthlyStudentsMap[currentMonthKey] || 0;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthNewStudents = monthlyStudentsMap[lastMonthKey] || 0;
    const studentGrowthRate = lastMonthNewStudents > 0
      ? Math.round(((currentMonthNewStudents - lastMonthNewStudents) / lastMonthNewStudents) * 100)
      : (currentMonthNewStudents > 0 ? 100 : 0);

    // ----------------------------------------------------
    // 2. Month-on-Month Student Fee Collections
    // ----------------------------------------------------
    const monthlyFeeMap: Record<string, { amount: number; receiptsCount: number }> = {};
    for (const r of receipts) {
      const d = r.receipt_date ? new Date(r.receipt_date) : new Date((r as any).createdAt || Date.now());
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyFeeMap[k]) monthlyFeeMap[k] = { amount: 0, receiptsCount: 0 };
      monthlyFeeMap[k].amount += (r.total_amount || 0);
      monthlyFeeMap[k].receiptsCount += 1;
    }

    const allFeeMonthKeys = Array.from(new Set([...Object.keys(monthlyFeeMap), ...last6MonthsKeys])).sort();

    const momFeeCollections = allFeeMonthKeys.map((mKey, idx) => {
      const item = monthlyFeeMap[mKey] || { amount: 0, receiptsCount: 0 };
      const prevKey = idx > 0 ? allFeeMonthKeys[idx - 1] : null;
      const prevItem = prevKey ? (monthlyFeeMap[prevKey] || { amount: 0, receiptsCount: 0 }) : { amount: 0, receiptsCount: 0 };
      let growthRate = 0;
      if (prevItem.amount > 0) {
        growthRate = Math.round(((item.amount - prevItem.amount) / prevItem.amount) * 100);
      } else if (item.amount > 0 && idx > 0) {
        growthRate = 100;
      }

      const [yr, mo] = mKey.split('-');
      const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: mKey,
        monthLabel,
        amount: item.amount,
        receiptsCount: item.receiptsCount,
        prevAmount: prevItem.amount,
        growthRate,
      };
    });

    const lastMonthFeeItem = monthlyFeeMap[lastMonthKey] || { amount: 0, receiptsCount: 0 };
    const currentMonthFeeItem = monthlyFeeMap[currentMonthKey] || { amount: 0, receiptsCount: 0 };
    const feeGrowthRate = lastMonthFeeItem.amount > 0
      ? Math.round(((currentMonthFeeItem.amount - lastMonthFeeItem.amount) / lastMonthFeeItem.amount) * 100)
      : (currentMonthFeeItem.amount > 0 ? 100 : 0);

    // ----------------------------------------------------
    // 3. Month-on-Month Enquiries & Conversion Calculation
    // ----------------------------------------------------
    const monthlyEnquiriesMap: Record<string, { total: number; converted: number }> = {};
    for (const enq of allEnquiries) {
      const d = enq.enquiry_date ? new Date(enq.enquiry_date) : new Date((enq as any).createdAt || Date.now());
      if (isNaN(d.getTime())) continue;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyEnquiriesMap[k]) monthlyEnquiriesMap[k] = { total: 0, converted: 0 };
      monthlyEnquiriesMap[k].total += 1;
      if (enq.status === 'converted') {
        monthlyEnquiriesMap[k].converted += 1;
      }
    }

    const allEnquiryMonthKeys = Array.from(new Set([...Object.keys(monthlyEnquiriesMap), ...last6MonthsKeys])).sort();

    const momEnquiries = allEnquiryMonthKeys.map((mKey, idx) => {
      const item = monthlyEnquiriesMap[mKey] || { total: 0, converted: 0 };
      const prevKey = idx > 0 ? allEnquiryMonthKeys[idx - 1] : null;
      const prevItem = prevKey ? (monthlyEnquiriesMap[prevKey] || { total: 0, converted: 0 }) : { total: 0, converted: 0 };
      let growthRate = 0;
      if (prevItem.total > 0) {
        growthRate = Math.round(((item.total - prevItem.total) / prevItem.total) * 100);
      } else if (item.total > 0 && idx > 0) {
        growthRate = 100;
      }
      const conversionRate = item.total > 0 ? Math.round((item.converted / item.total) * 100) : 0;

      const [yr, mo] = mKey.split('-');
      const dateObj = new Date(Number(yr), Number(mo) - 1, 1);
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: mKey,
        monthLabel,
        total: item.total,
        converted: item.converted,
        conversionRate,
        prevTotal: prevItem.total,
        growthRate,
      };
    });

    const currentMonthEnqItem = monthlyEnquiriesMap[currentMonthKey] || { total: 0, converted: 0 };
    const lastMonthEnqItem = monthlyEnquiriesMap[lastMonthKey] || { total: 0, converted: 0 };
    const enquiryGrowthRate = lastMonthEnqItem.total > 0
      ? Math.round(((currentMonthEnqItem.total - lastMonthEnqItem.total) / lastMonthEnqItem.total) * 100)
      : (currentMonthEnqItem.total > 0 ? 100 : 0);
    const totalEnquiriesCount = allEnquiries.length || totalEnquiries;
    const totalConvertedCount = allEnquiries.filter((e) => e.status === 'converted').length;
    const overallConversionRate = totalEnquiriesCount > 0 ? Math.round((totalConvertedCount / totalEnquiriesCount) * 100) : 0;

    // ----------------------------------------------------
    // 4. Staff Attendance & Leave Staff Analytics
    // ----------------------------------------------------
    const staffPresentCount = todayStaffAttendance.filter((a) => a.status === 'present').length;
    const staffAbsentCount = todayStaffAttendance.filter((a) => a.status === 'absent').length;
    const staffHalfDayCount = todayStaffAttendance.filter((a) => a.status === 'half_day').length;
    const staffOnLeaveAttendance = todayStaffAttendance.filter((a) => a.status === 'leave').length;
    const staffOnLeaveCount = Math.max(todayLeavesOnDuty.length, staffOnLeaveAttendance);

    const effectiveTotalStaff = Math.max(totalStaffCount, staffPresentCount + staffAbsentCount + staffOnLeaveCount, 1);
    const staffAttendanceRate = effectiveTotalStaff > 0
      ? Math.min(100, Math.round(((staffPresentCount + (staffHalfDayCount * 0.5)) / effectiveTotalStaff) * 100))
      : 0;

    const staffOnLeaveList = todayLeavesOnDuty.map((l: any) => ({
      _id: l._id,
      staff_name: l.staff_id?.staff_name || l.staff_id?.name || 'Staff Member',
      emp_code: l.staff_id?.emp_code || 'EMP',
      designation: l.staff_id?.designation || l.staff_id?.department || 'Staff',
      leave_type: l.leave_type,
      from_date: l.from_date,
      to_date: l.to_date,
      total_days: l.total_days || 1,
      reason: l.reason || 'Leave Approved',
    }));

    return {
      totalEnrollments,
      totalStudents: enrollments.length || totalEnrollments,
      totalEnquiries: totalEnquiriesCount,
      totalCollection,
      totalExpenses,
      currentMonthExpenses,
      currentMonthCollection,
      totalCourseFees,
      totalPendingFees,
      netProfit,
      pendingTasks,
      modeBreakdown,
      recentEnrollments,
      recentExpenses: expenses.slice(0, 10).map((e) => ({
        _id: e._id,
        expense_date: e.expense_date,
        amount: e.amount,
        payment_mode: e.payment_mode,
        description: e.description,
        category_name: (e.category_id as any)?.category_name || 'General Expense',
      })),
      pending_reminders,
      action_required_count: pending_reminders.length,

      // Enhanced MoM & Executive Pulse Metrics
      studentAnalytics: {
        totalStudents: enrollments.length || totalEnrollments,
        currentMonthNewStudents,
        lastMonthNewStudents,
        studentGrowthRate,
        momNewStudents,
      },

      feeCollectionMoM: {
        totalCollected: totalCollection,
        currentMonthCollection,
        lastMonthCollection: lastMonthFeeItem.amount,
        feeGrowthRate,
        momFeeCollections,
      },

      enquiryAnalytics: {
        totalEnquiries: totalEnquiriesCount,
        currentMonthEnquiries: currentMonthEnqItem.total,
        lastMonthEnquiries: lastMonthEnqItem.total,
        enquiryGrowthRate,
        totalConvertedCount,
        overallConversionRate,
        momEnquiries,
      },

      staffPulse: {
        totalStaff: effectiveTotalStaff,
        presentToday: staffPresentCount,
        absentToday: staffAbsentCount,
        halfDayToday: staffHalfDayCount,
        onLeaveToday: staffOnLeaveCount,
        staffAttendanceRate,
        pendingLeavesCount,
        approvedLeavesThisMonth,
        staffOnLeaveList,
      },

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

  async getFeeAnalytics(
    companyId?: string,
    financialYear?: string,
    month?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const filter: any = {};
    if (companyId) filter.company_id = new Types.ObjectId(companyId);

    const receiptFilter: any = { ...filter, status: 1 };
    const expenseFilter: any = { ...filter };
    const enrollmentFilter: any = { ...filter };
    const installmentFilter: any = { ...filter };

    if (startDate && endDate) {
      expenseFilter.expense_date = { $gte: startDate, $lte: endDate };
      const startD = new Date(startDate);
      startD.setHours(0, 0, 0, 0);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      receiptFilter.$or = [
        { receipt_date: { $gte: startD, $lte: endD } },
        { createdAt: { $gte: startD, $lte: endD } },
      ];
      enrollmentFilter.$or = [
        { joining_date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startD, $lte: endD } },
      ];
      installmentFilter.due_date = { $gte: startD, $lte: endD };
    }

    const [enrollments, receipts, installments, expenses] = await Promise.all([
      this.enrollmentModel
        .find(enrollmentFilter)
        .populate('course_id', 'course_name fees duration_days')
        .populate('company_id', 'company_name branch')
        .sort({ createdAt: -1 }),
      this.receiptModel
        .find(receiptFilter)
        .populate('enrollment_id')
        .sort({ receipt_date: -1, createdAt: -1 }),
      this.installmentModel
        .find(installmentFilter)
        .populate('followup_assigned_to', 'name username')
        .sort({ due_date: 1 }),
      this.expenseModel
        .find(expenseFilter)
        .populate('category_id', 'category_name')
        .sort({ expense_date: -1 }),
    ]);

    // 1. Overall Calculations
    const totalEnrolled = enrollments.length;
    const totalCourseFees = enrollments.reduce((sum, e) => sum + (e.total_fees || 0), 0);
    const totalFeesCollected = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalPendingFees = Math.max(0, totalCourseFees - totalFeesCollected);

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Current month collection & expense (YYYY-MM)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthCollection = receipts
      .filter((r) => {
        const d = r.receipt_date ? new Date(r.receipt_date) : new Date((r as any).createdAt || Date.now());
        const yMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return yMonth === currentMonthKey;
      })
      .reduce((sum, r) => sum + (r.total_amount || 0), 0);

    const currentMonthExpenses = expenses
      .filter((exp) => exp.expense_date && exp.expense_date.startsWith(currentMonthKey))
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 2. Monthly Collection, Pending, & Expense Graph Data
    const monthlyCollectedMap: Record<string, number> = {};
    for (const r of receipts) {
      const d = r.receipt_date ? new Date(r.receipt_date) : new Date((r as any).createdAt || Date.now());
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyCollectedMap[k] = (monthlyCollectedMap[k] || 0) + (r.total_amount || 0);
    }

    const monthlyPendingMap: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const inst of installments) {
      if (!inst.due_date) continue;
      const d = new Date(inst.due_date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dueAmt = Number(inst.due_amount || 0);
      const paidAmt = Number(inst.paid_amount || 0);
      const pendingAmt = Math.max(0, dueAmt - paidAmt);
      monthlyPendingMap[k] = (monthlyPendingMap[k] || 0) + pendingAmt;
    }

    const monthlyExpenseMap: Record<string, number> = {};
    for (const exp of expenses) {
      if (!exp.expense_date) continue;
      const k = exp.expense_date.slice(0, 7);
      monthlyExpenseMap[k] = (monthlyExpenseMap[k] || 0) + (exp.amount || 0);
    }

    const allMonthsSet = new Set<string>([
      ...Object.keys(monthlyCollectedMap),
      ...Object.keys(monthlyPendingMap),
      ...Object.keys(monthlyExpenseMap),
      currentMonthKey,
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
    ]);

    const sortedMonths = Array.from(allMonthsSet).sort();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = sortedMonths.map((mStr) => {
      const [y, m] = mStr.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const label = `${monthNames[mIdx]} ${y}`;
      return {
        month: mStr,
        label,
        year: parseInt(y, 10),
        monthNumber: parseInt(m, 10),
        collected: monthlyCollectedMap[mStr] || 0,
        pending: monthlyPendingMap[mStr] || 0,
        expense: monthlyExpenseMap[mStr] || 0,
      };
    });

    // 3. Mentor Map & Batch Determination
    const MENTOR_MAP: Record<string, string> = {
      'advanced java': 'Vignesh A',
      'core java': 'Vignesh A',
      'basic java': 'Vignesh A',
      'ai java program': 'Vignesh A',
      'intern java': 'Vignesh A',
      'basic python': 'Muthumeena',
      'advanced python': 'Dr. Suresh K (Mentor)',
      'ai python full stack program': 'Dr. Suresh K (Mentor)',
      'intern ai python': 'Dr. Suresh K (Mentor)',
      'data analytics': 'Ganesh S',
      'data science': 'Ganesh S',
      'digital marketing': 'Priya Dharshini',
      'digital marketing expert': 'Priya Dharshini',
      'video creation': 'Ramesh K',
      'photoshop': 'Ramesh K',
      'tally': 'Saravanan',
      'accounting': 'Saravanan',
      'web tech': 'Ramesh K',
      'c programming': 'Faculty Mentor',
      'core php': 'Faculty Mentor',
    };

    const getMentorForCourse = (courseTitle: string): string => {
      const c = (courseTitle || '').toLowerCase();
      for (const [key, mentor] of Object.entries(MENTOR_MAP)) {
        if (c.includes(key)) return mentor;
      }
      return 'Dr. Suresh K (Mentor)';
    };

    const BATCHES = [
      'Morning Batch (9:30 AM - 12:30 PM)',
      'Afternoon Batch (2:00 PM - 5:00 PM)',
      'Evening Batch (5:00 PM - 7:00 PM)',
    ];

    // Map receipts by enrollment_id
    const receiptsByEnrollment: Record<string, any[]> = {};
    for (const r of receipts) {
      const eId = (r.enrollment_id as any)?._id?.toString() || r.enrollment_id?.toString();
      if (eId) {
        if (!receiptsByEnrollment[eId]) receiptsByEnrollment[eId] = [];
        receiptsByEnrollment[eId].push({
          _id: r._id,
          receipt_no: r.receipt_no,
          date: r.receipt_date || (r as any).createdAt,
          amount: r.total_amount || 0,
          payment_splits: r.payment_splits || [],
          remarks: r.remarks || 'Fee payment',
        });
      }
    }

    // Map earliest pending installment due date by enrollment_id
    const installmentDueByEnrollment: Record<string, Date> = {};
    for (const inst of installments) {
      const eId = (inst.enrollment_id as any)?._id?.toString() || inst.enrollment_id?.toString();
      if (eId && inst.due_date) {
        const d = new Date(inst.due_date);
        if (!installmentDueByEnrollment[eId] || d < installmentDueByEnrollment[eId]) {
          installmentDueByEnrollment[eId] = d;
        }
      }
    }

    const pendingStudents = enrollments
      .map((e, idx) => {
        const totalFees = e.total_fees || (e.course_id as any)?.fees || 0;
        const paidAmount = e.paid_amount || 0;
        const pendingAmount = Math.max(0, totalFees - paidAmount);
        const courseName = (e.course_id as any)?.course_name || 'Professional Certification';
        const eId = e._id.toString();

        const batch = BATCHES[idx % 3];
        const mentor = getMentorForCourse(courseName);

        const dueDate = installmentDueByEnrollment[eId] ||
          (e.joining_date ? new Date(new Date(e.joining_date).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date());

        const isOverdue = dueDate < today && pendingAmount > 0;
        let paymentStatus: 'overdue' | 'partially_paid' | 'pending' | 'paid' = 'pending';
        if (pendingAmount === 0) {
          paymentStatus = 'paid';
        } else if (isOverdue) {
          paymentStatus = 'overdue';
        } else if (paidAmount > 0) {
          paymentStatus = 'partially_paid';
        } else {
          paymentStatus = 'pending';
        }

        return {
          _id: eId,
          student_id: e.enrollment_no,
          student_name: e.student_name,
          email: e.email || '',
          phone: e.phone || '',
          course_name: courseName,
          batch,
          mentor_name: mentor,
          total_fees: totalFees,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          due_date: dueDate.toISOString(),
          payment_status: paymentStatus,
          joining_date: e.joining_date || (e as any).createdAt,
          receipts: receiptsByEnrollment[eId] || [],
        };
      })
      .filter((s) => s.pending_amount > 0);

    const uniqueCourses = Array.from(new Set(pendingStudents.map((s) => s.course_name))).sort();
    const uniqueMentors = Array.from(new Set(pendingStudents.map((s) => s.mentor_name))).sort();

    return {
      summaryCards: {
        totalEnrolled,
        totalFeesCollected,
        totalPendingFees,
        currentMonthCollection,
        totalExpenses,
        currentMonthExpenses,
        netBalance: totalFeesCollected - totalExpenses,
      },
      monthlyData,
      recentExpenses: expenses.slice(0, 15).map((e) => ({
        _id: e._id,
        expense_date: e.expense_date,
        amount: e.amount,
        payment_mode: e.payment_mode,
        description: e.description,
        category_name: (e.category_id as any)?.category_name || 'General Expense',
      })),
      pendingStudents,
      filters: {
        courses: uniqueCourses,
        mentors: uniqueMentors,
        batches: BATCHES,
        financialYears: ['FY 2026-2027', 'FY 2025-2026', 'All Financial Years'],
      },
    };
  }
}

