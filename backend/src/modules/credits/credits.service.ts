import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreditRule, CreditRuleDocument } from '../../schemas/credit-rule.schema';
import { CreditTransaction, CreditTransactionDocument } from '../../schemas/credit-transaction.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';

export const DEFAULT_DYNAMIC_CATEGORIES = [
  {
    id: 'academics',
    title: 'Academics & Tests',
    iconName: 'FileCheck',
    items: [
      {
        id: 'monthly_test',
        title: 'Monthly Internal Test Credits',
        credits: 15,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 60,
      },
      {
        id: 'fourth_month_test',
        title: '4th Month Overall Test Credits',
        credits: 50,
        hasThreshold: true,
        thresholdLabel: 'Min Score %',
        thresholdValue: 65,
      },
    ],
  },
  {
    id: 'video_attendance',
    title: 'Portal Video & Attendance',
    iconName: 'Video',
    items: [
      {
        id: 'video',
        title: 'Video Watch Level Milestone',
        credits: 10,
        hasThreshold: true,
        thresholdLabel: 'Required Watch %',
        thresholdValue: 80,
      },
      {
        id: 'attendance_bonus',
        title: 'Staff Attendance Percentage Bonus',
        credits: 25,
        hasThreshold: true,
        thresholdLabel: 'Staff Target %',
        thresholdValue: 85,
      },
    ],
  },
  {
    id: 'co_curricular',
    title: 'Co-Curricular Activities',
    iconName: 'Presentation',
    items: [
      { id: 'workshop', title: 'Workshop', credits: 20 },
      { id: 'hackathon', title: 'Hackathon', credits: 40 },
      { id: 'presentation', title: 'Presentation', credits: 15 },
      { id: 'communication', title: 'Communication', credits: 10 },
    ],
  },
  {
    id: 'capstone',
    title: 'Capstone & Programs',
    iconName: 'Sparkles',
    items: [
      { id: 'capstone_project', title: 'Capstone Project Done Credits', credits: 50 },
      { id: 'saturday_program', title: 'Saturday & Special Program Attendance', credits: 20 },
    ],
  },
  {
    id: 'events_placement',
    title: 'Events & Placement',
    iconName: 'Briefcase',
    items: [
      { id: 'event_volunteer', title: 'Event Volunteering & Willingness', credits: 15 },
      { id: 'interview_attended', title: 'Applied & Attended Job Interview', credits: 30 },
    ],
  },
];

@Injectable()
export class CreditsService {
  constructor(
    @InjectModel(CreditRule.name) private readonly ruleModel: Model<CreditRuleDocument>,
    @InjectModel(CreditTransaction.name) private readonly txModel: Model<CreditTransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  // 1. Fetch or initialize rules for active company/campus
  async getRules(companyId: string) {
    if (!companyId) return DEFAULT_DYNAMIC_CATEGORIES;
    try {
      const companyObjId = new Types.ObjectId(companyId);
      let ruleDoc = await this.ruleModel.findOne({ company_id: companyObjId });
      if (!ruleDoc || !ruleDoc.categories || ruleDoc.categories.length === 0) {
        ruleDoc = await this.ruleModel.findOneAndUpdate(
          { company_id: companyObjId },
          { $setOnInsert: { categories: DEFAULT_DYNAMIC_CATEGORIES } },
          { upsert: true, new: true },
        );
      }
      return ruleDoc?.categories || DEFAULT_DYNAMIC_CATEGORIES;
    } catch (e) {
      return DEFAULT_DYNAMIC_CATEGORIES;
    }
  }

  // 2. Save dynamic rules configured by Admin
  async saveRules(companyId: string, categories: any[]) {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const companyObjId = new Types.ObjectId(companyId);
    const updated = await this.ruleModel.findOneAndUpdate(
      { company_id: companyObjId },
      { categories },
      { upsert: true, new: true },
    );
    return updated.categories;
  }

  // 3. Reset rules to system defaults
  async resetRules(companyId: string) {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const companyObjId = new Types.ObjectId(companyId);
    const updated = await this.ruleModel.findOneAndUpdate(
      { company_id: companyObjId },
      { categories: DEFAULT_DYNAMIC_CATEGORIES },
      { upsert: true, new: true },
    );
    return updated.categories;
  }

  // 4. Award credits with validation and strict duplicate prevention
  async awardCredits(companyId: string, data: any, currentUser: any) {
    const {
      student_id,
      category,
      title,
      credits,
      notes,
      source_id,
      certificateVerified,
      certificateTitle,
      certificateNumber,
      certificateDate,
      certificateFileUrl,
    } = data;

    if (!student_id) throw new BadRequestException('Student ID is required');
    if (!title) throw new BadRequestException('Credit title is required');

    // Strict Guard: Attendance and Video credits cannot be manually awarded by Staff/Admin
    const catLower = (category || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();
    if (
      catLower === 'attendance_bonus' ||
      catLower.includes('attendance') ||
      titleLower.includes('attendance milestone')
    ) {
      throw new BadRequestException(
        'Attendance credits are automatically computed from classroom attendance logs and cannot be manually awarded by staff.',
      );
    }
    if (catLower === 'video' || titleLower.includes('video watch level milestone')) {
      throw new BadRequestException(
        'Video learning credits are automatically tracked and awarded upon lesson completion and cannot be manually awarded by staff.',
      );
    }

    const creditAmount = Number(credits);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      throw new BadRequestException('Credits must be a positive number');
    }

    // Verify recipient in existing Users table or Enrollments table
    let resolvedUserId: Types.ObjectId | null = null;
    let studentCompanyId = companyId ? new Types.ObjectId(companyId) : null;

    if (Types.ObjectId.isValid(student_id)) {
      const idObj = new Types.ObjectId(student_id);
      const studentUser = await this.userModel.findById(idObj);
      if (studentUser) {
        resolvedUserId = studentUser._id;
        studentCompanyId = studentCompanyId || studentUser.company_id;
      } else {
        const enrollment = await this.enrollmentModel.findById(idObj);
        if (enrollment) {
          const matchedUser = await this.userModel.findOne({
            $or: [
              { phone: enrollment.phone },
              { email: enrollment.email && enrollment.email.trim() ? enrollment.email : 'NON_EXISTENT_EMAIL' },
            ],
          });
          if (matchedUser) {
            resolvedUserId = matchedUser._id;
            studentCompanyId = studentCompanyId || matchedUser.company_id || enrollment.company_id;
          } else {
            resolvedUserId = enrollment._id;
            studentCompanyId = studentCompanyId || enrollment.company_id;
          }
        }
      }
    }

    // Fallback: If not valid ObjectId or not resolved, match student by student_name or title
    if (!resolvedUserId) {
      const searchName = data.student_name || (typeof student_id === 'string' && !student_id.startsWith('STU_') ? student_id : '');
      if (searchName) {
        const matchedUserByName = await this.userModel.findOne({
          user_type: 'student',
          name: { $regex: new RegExp(searchName.trim(), 'i') },
        });
        if (matchedUserByName) {
          resolvedUserId = matchedUserByName._id;
          studentCompanyId = studentCompanyId || matchedUserByName.company_id;
        } else {
          const matchedEnrollment = await this.enrollmentModel.findOne({
            student_name: { $regex: new RegExp(searchName.trim(), 'i') },
          });
          if (matchedEnrollment) {
            const matchedU = await this.userModel.findOne({
              $or: [
                { phone: matchedEnrollment.phone },
                { email: matchedEnrollment.email && matchedEnrollment.email.trim() ? matchedEnrollment.email : 'NON_EXISTENT_EMAIL' },
              ],
            });
            resolvedUserId = matchedU ? matchedU._id : matchedEnrollment._id;
            studentCompanyId = studentCompanyId || matchedEnrollment.company_id;
          }
        }
      }
    }

    if (!resolvedUserId) {
      throw new NotFoundException('Selected student account not found');
    }

    // Campus isolation check (except superadmin)
    if (currentUser?.user_type !== 'admin' && studentCompanyId && studentCompanyId.toString() !== companyId) {
      throw new ForbiddenException('Cannot award credits to students belonging to another campus');
    }

    // STRICT DUPLICATE PREVENTION:
    // Once credits are given for a video/milestone, never give credits again if they rewatch
    if (source_id) {
      const existing = await this.txModel.findOne({
        student_id: resolvedUserId,
        source_id: source_id,
      });
      if (existing) {
        // Already awarded: return existing record without adding duplicate credits
        return existing;
      }
    }

    // Certificate details verification
    if (certificateVerified) {
      if (!certificateTitle || !certificateNumber) {
        throw new BadRequestException('Certificate Title and Number are mandatory for verified certificate records');
      }
    }

    // ACTIVITY CAP ENFORCEMENT:
    // If Admin configured fixed credits for this individual activity, enforce that students
    // cannot be awarded more credits once they reach the configured activity cap.
    try {
      const activeRules = await this.getRules(companyId || (studentCompanyId ? studentCompanyId.toString() : ''));
      let configuredItem: any = null;
      if (Array.isArray(activeRules)) {
        for (const cat of activeRules) {
          if (Array.isArray(cat?.items)) {
            for (const it of cat.items) {
              const itId = (it?.id || '').toLowerCase();
              const itTitle = (it?.title || '').toLowerCase();
              const catQuery = (category || '').toLowerCase();
              const titleQuery = (title || '').toLowerCase();
              if (
                (itId && catQuery && itId === catQuery) ||
                (itTitle && titleQuery && itTitle === titleQuery) ||
                (catQuery && itId && catQuery.includes(itId)) ||
                (titleQuery && itTitle && titleQuery.includes(itTitle))
              ) {
                configuredItem = it;
                break;
              }
            }
          }
          if (configuredItem) break;
        }
      }

      if (configuredItem && typeof configuredItem.credits === 'number' && configuredItem.credits > 0) {
        const maxAllowed = configuredItem.credits;
        const itId = (configuredItem.id || '').toLowerCase();
        const itTitle = (configuredItem.title || '').toLowerCase();
        const catQuery = (category || '').toLowerCase();
        const titleQuery = (title || '').toLowerCase();

        const studentTxs = await this.txModel.find({
          student_id: resolvedUserId,
        });

        const matchingTxs = studentTxs.filter((tx) => {
          const tCat = (tx.category || '').toLowerCase();
          const tTitle = (tx.title || '').toLowerCase();
          return (
            tCat === itId ||
            tCat === catQuery ||
            tTitle === itTitle ||
            tTitle === titleQuery ||
            (itId && tCat.includes(itId)) ||
            (itTitle && tTitle.includes(itTitle))
          );
        });

        const alreadyEarned = matchingTxs.reduce((sum, tx) => sum + (Number(tx.credits) || 0), 0);
        if (alreadyEarned >= maxAllowed) {
          throw new BadRequestException(
            `Maximum credit limit reached for "${configuredItem.title || title}". This student has already earned ${alreadyEarned} of ${maxAllowed} credits for this activity.`,
          );
        }
        if (alreadyEarned + creditAmount > maxAllowed) {
          const remaining = maxAllowed - alreadyEarned;
          throw new BadRequestException(
            `Cannot allocate ${creditAmount} credits: Maximum configured cap is ${maxAllowed} pts, and student already has ${alreadyEarned} pts. Only ${remaining} pts remaining.`,
          );
        }
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      console.warn('Activity cap verification check failed:', e?.message || e);
    }

    const companyObjId = studentCompanyId || (companyId ? new Types.ObjectId(companyId) : null);
    const awardedByName = currentUser?.name || currentUser?.username || 'System';

    const transaction = new this.txModel({
      company_id: companyObjId,
      student_id: resolvedUserId,
      category: category || 'General',
      title,
      credits: creditAmount,
      awarded_by: `${awardedByName} (${currentUser?.user_type || 'admin'})`,
      notes: notes || '',
      source_id: source_id || null,
      date: new Date().toISOString(),
      certificateVerified: !!certificateVerified,
      certificateTitle: certificateTitle || null,
      certificateNumber: certificateNumber || null,
      certificateDate: certificateDate || new Date().toISOString().substring(0, 10),
      certificateFileUrl: certificateFileUrl || null,
    });

    return transaction.save();
  }

  // 5. Get student transactions and calculated balance
  async getStudentCredits(studentId: string) {
    if (!studentId) return { totalCredits: 0, transactions: [] };
    try {
      const queryIds: Types.ObjectId[] = [];
      if (Types.ObjectId.isValid(studentId)) {
        const idObj = new Types.ObjectId(studentId);
        queryIds.push(idObj);

        // Cross-resolve User <-> Enrollment so both IDs are covered
        const user = await this.userModel.findById(idObj);
        if (user) {
          const enrollment = await this.enrollmentModel.findOne({
            $or: [
              { phone: user.phone },
              { email: user.email && user.email.trim() ? user.email : 'NON_EXISTENT_EMAIL' },
            ],
          });
          if (enrollment) queryIds.push(enrollment._id);
        } else {
          const enrollment = await this.enrollmentModel.findById(idObj);
          if (enrollment) {
            const u = await this.userModel.findOne({
              $or: [
                { phone: enrollment.phone },
                { email: enrollment.email && enrollment.email.trim() ? enrollment.email : 'NON_EXISTENT_EMAIL' },
              ],
            });
            if (u) queryIds.push(u._id);
          }
        }
      }

      const transactions = await this.txModel
        .find({ student_id: { $in: queryIds } })
        .sort({ createdAt: -1 });

      const mappedTransactions = transactions.map((t: any) => {
        const obj = t.toObject ? t.toObject() : t;
        const resolvedDate = obj.date || obj.createdAt || (obj.certificateDate ? new Date(obj.certificateDate).toISOString() : new Date().toISOString());
        return {
          ...obj,
          id: obj._id ? obj._id.toString() : obj.id,
          date: resolvedDate,
        };
      });

      const totalCredits = transactions.reduce((acc, curr) => acc + (curr.credits || 0), 0);
      return { totalCredits, transactions: mappedTransactions };
    } catch (e) {
      return { totalCredits: 0, transactions: [] };
    }
  }

  // 6. Get entire credit ledger for admin/staff view
  async getLedger(companyId: string, search?: string) {
    const query: any = {};
    if (companyId && Types.ObjectId.isValid(companyId)) {
      const companyObjId = new Types.ObjectId(companyId);

      // Find all campus student accounts (both Users and Enrollments)
      const campusUsers = await this.userModel.find({ company_id: companyObjId }).select('_id');
      const campusEnrollments = await this.enrollmentModel.find({ company_id: companyObjId }).select('_id');
      const campusStudentIds = [
        ...campusUsers.map((u) => u._id),
        ...campusEnrollments.map((e) => e._id),
      ];

      // Re-align any legacy/orphaned transactions for students of this campus
      if (campusStudentIds.length > 0) {
        await this.txModel.updateMany(
          { student_id: { $in: campusStudentIds }, company_id: { $ne: companyObjId } },
          { $set: { company_id: companyObjId } },
        );
      }

      query.$or = [
        { company_id: companyObjId },
        { student_id: { $in: campusStudentIds } },
      ];
    }

    let transactions = await this.txModel
      .find(query)
      .populate('student_id', 'name email phone username avatar')
      .sort({ createdAt: -1 })
      .limit(300);

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      transactions = transactions.filter((tx: any) => {
        const student = tx.student_id;
        const studentName = student?.name?.toLowerCase() || '';
        const title = tx.title?.toLowerCase() || '';
        const cat = tx.category?.toLowerCase() || '';
        const certNum = tx.certificateNumber?.toLowerCase() || '';
        return (
          studentName.includes(term) ||
          title.includes(term) ||
          cat.includes(term) ||
          certNum.includes(term)
        );
      });
    }

    const mappedTransactions = transactions.map((t: any) => {
      const obj = t.toObject ? t.toObject() : t;
      const resolvedDate = obj.date || obj.createdAt || (obj.certificateDate ? new Date(obj.certificateDate).toISOString() : new Date().toISOString());
      return {
        ...obj,
        id: obj._id ? obj._id.toString() : obj.id,
        date: resolvedDate,
      };
    });

    return mappedTransactions;
  }

  // 7. Delete / Revoke a transaction (Admin only)
  async deleteTransaction(id: string) {
    const deleted = await this.txModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Credit transaction not found');
    return { success: true, message: 'Transaction revoked successfully' };
  }
}

