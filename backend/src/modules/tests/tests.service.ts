import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionSet,
  QuestionSetDocument,
  TestAttempt,
  TestAttemptDocument,
} from '../../schemas/test.schema';
import { CreditTransaction, CreditTransactionDocument } from '../../schemas/credit-transaction.schema';
import { Course, CourseDocument } from '../../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';

@Injectable()
export class TestsService {
  constructor(
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(QuestionSet.name) private readonly setModel: Model<QuestionSetDocument>,
    @InjectModel(TestAttempt.name) private readonly attemptModel: Model<TestAttemptDocument>,
    @InjectModel(CreditTransaction.name) private readonly creditTxModel: Model<CreditTransactionDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  // ==========================================
  // 1. ASSESSMENT / QUESTION SET MANAGEMENT
  // ==========================================

  async getQuestionSets(filters?: {
    course_id?: string;
    category?: string;
    publishing_mode?: string;
    search?: string;
  }): Promise<any[]> {
    const query: any = { status: 1 };
    if (filters?.course_id && Types.ObjectId.isValid(filters.course_id)) {
      query.course_id = new Types.ObjectId(filters.course_id);
    }
    if (filters?.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters?.publishing_mode) {
      query.publishing_mode = filters.publishing_mode;
    }
    if (filters?.search) {
      query.$or = [
        { set_name: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const sets = await this.setModel
      .find(query)
      .populate('course_id', 'course_name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach dynamic question count for each set
    const setIds = sets.map((s) => s._id);
    const questionCounts = await this.questionModel.aggregate([
      { $match: { set_id: { $in: setIds }, status: 1 } },
      { $group: { _id: '$set_id', count: { $sum: 1 }, totalMarks: { $sum: '$marks' } } },
    ]);
    const countMap = new Map(
      questionCounts.map((qc) => [qc._id.toString(), { count: qc.count, marks: qc.totalMarks }]),
    );

    return sets.map((set) => {
      const qStats = countMap.get(set._id.toString()) || { count: 0, marks: 0 };
      return {
        ...set,
        total_questions: set.total_questions || qStats.count,
        total_marks: set.total_marks || qStats.marks,
      };
    });
  }

  async getQuestionSetById(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment ID format');
    }
    const set = await this.setModel.findById(id).populate('course_id', 'course_name').lean();
    if (!set || set.status === 0) {
      throw new NotFoundException('Assessment not found or deleted');
    }
    const questionCount = await this.questionModel.countDocuments({ set_id: set._id, status: 1 });
    return { ...set, total_questions: questionCount };
  }

  async createQuestionSet(data: any, currentUser?: any) {
    const cleanData = { ...data };

    // Auto-link Course ObjectId
    if (cleanData.course_id && Types.ObjectId.isValid(cleanData.course_id)) {
      cleanData.course_id = new Types.ObjectId(cleanData.course_id);
    } else {
      const defaultCourse = await this.courseModel.findOne({ status: 1 });
      if (defaultCourse) cleanData.course_id = defaultCourse._id;
    }

    // Default title fallback
    if (!cleanData.title && cleanData.set_name) {
      cleanData.title = cleanData.set_name;
    }

    // Business Rule: Aptitude & Practice exams ALWAYS award 0 credits
    if (cleanData.category === 'aptitude' || cleanData.category === 'practice') {
      cleanData.credit_tiers = [
        { min_percentage: 90, max_percentage: 100, credits: 0 },
        { min_percentage: 80, max_percentage: 89, credits: 0 },
        { min_percentage: 70, max_percentage: 79, credits: 0 },
        { min_percentage: 60, max_percentage: 69, credits: 0 },
        { min_percentage: 50, max_percentage: 59, credits: 0 },
      ];
    }

    // Business Rule: Result Visibility
    // - Immediate: answers are open immediately after test completion (is_answer_key_released = true)
    // - Scheduled (Hidden Answers): sealed until mentor reveals (is_answer_key_released = false)
    if (cleanData.result_visibility === 'immediate') {
      cleanData.is_answer_key_released = true;
    } else if (cleanData.result_visibility === 'scheduled') {
      cleanData.is_answer_key_released = cleanData.is_answer_key_released ?? false;
    }

    cleanData.created_by = currentUser?.name || currentUser?.email || 'Admin / Mentor';
    cleanData.creator_role = currentUser?.role || 'admin';

    const set = new this.setModel(cleanData);
    const saved = await set.save();

    // If initial questions array was provided in payload, persist them directly
    if (Array.isArray(cleanData.questions) && cleanData.questions.length > 0) {
      const qDocs = cleanData.questions.map((q: any) => ({
        ...q,
        set_id: saved._id,
        course_id: saved.course_id,
        status: 1,
      }));
      await this.questionModel.insertMany(qDocs);
      saved.total_questions = qDocs.length;
      saved.total_marks = qDocs.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
      await saved.save();
    }

    return saved;
  }

  async updateQuestionSet(id: string, data: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment ID format');
    }

    const cleanData = { ...data };
    if (cleanData.course_id && Types.ObjectId.isValid(cleanData.course_id)) {
      cleanData.course_id = new Types.ObjectId(cleanData.course_id);
    }
    if (cleanData.category === 'aptitude' || cleanData.category === 'practice') {
      cleanData.credit_tiers = [
        { min_percentage: 90, max_percentage: 100, credits: 0 },
        { min_percentage: 80, max_percentage: 89, credits: 0 },
        { min_percentage: 70, max_percentage: 79, credits: 0 },
        { min_percentage: 60, max_percentage: 69, credits: 0 },
        { min_percentage: 50, max_percentage: 59, credits: 0 },
      ];
    }
    if (cleanData.result_visibility === 'immediate') {
      cleanData.is_answer_key_released = true;
    }

    const updated = await this.setModel.findByIdAndUpdate(id, cleanData, { new: true });
    if (!updated) {
      throw new NotFoundException('Assessment not found');
    }
    return updated;
  }

  async deleteQuestionSet(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment ID format');
    }
    const updated = await this.setModel.findByIdAndUpdate(id, { status: 0 }, { new: true });
    if (!updated) {
      throw new NotFoundException('Assessment not found');
    }
    // Also soft delete associated questions
    await this.questionModel.updateMany({ set_id: new Types.ObjectId(id) }, { status: 0 });
    return { success: true, message: 'Assessment and questions removed' };
  }

  // Permission Action: Admin/Mentor releases or seals answer key for examinees
  async setAnswerKeyRelease(id: string, released: boolean, currentUser?: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assessment ID format');
    }
    const set = await this.setModel.findById(id);
    if (!set) {
      throw new NotFoundException('Assessment not found');
    }

    set.is_answer_key_released = Boolean(released);
    set.answer_key_released_at = released ? new Date() : undefined;
    set.answer_key_released_by = released
      ? currentUser?.name || currentUser?.email || 'Admin / Mentor'
      : undefined;

    await set.save();

    return {
      id: set._id,
      title: set.title || set.set_name,
      is_answer_key_released: set.is_answer_key_released,
      answer_key_released_at: set.answer_key_released_at,
      answer_key_released_by: set.answer_key_released_by,
      message: released
        ? 'Answer key published. Examinees can now review solutions.'
        : 'Answer key sealed. Solutions are protected.',
    };
  }

  // ==========================================
  // 2. QUESTION BANK & QUESTIONS MANAGEMENT
  // ==========================================

  async getQuestions(query: {
    setId?: string;
    courseId?: string;
    topic?: string;
    difficulty?: string;
    type?: string;
    search?: string;
  }) {
    const filter: any = { status: 1 };
    if (query.setId && Types.ObjectId.isValid(query.setId)) {
      filter.set_id = new Types.ObjectId(query.setId);
    }
    if (query.courseId && Types.ObjectId.isValid(query.courseId)) {
      filter.course_id = new Types.ObjectId(query.courseId);
    }
    if (query.topic && query.topic !== 'all') {
      filter.topic = query.topic;
    }
    if (query.difficulty && query.difficulty !== 'all') {
      filter.difficulty = query.difficulty;
    }
    if (query.type && query.type !== 'all') {
      filter.type = query.type;
    }
    if (query.search) {
      filter.question_text = { $regex: query.search, $options: 'i' };
    }

    return this.questionModel.find(filter).sort({ createdAt: -1 });
  }

  async createQuestion(data: any) {
    const clean = { ...data };
    if (clean.set_id && Types.ObjectId.isValid(clean.set_id)) {
      clean.set_id = new Types.ObjectId(clean.set_id);
    }
    if (clean.course_id && Types.ObjectId.isValid(clean.course_id)) {
      clean.course_id = new Types.ObjectId(clean.course_id);
    }
    const q = new this.questionModel(clean);
    return q.save();
  }

  async createQuestionsBulk(questions: any[], setId?: string) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Questions array is required');
    }
    const docs = questions.map((q) => {
      const copy = { ...q, status: 1 };
      if (setId && Types.ObjectId.isValid(setId)) {
        copy.set_id = new Types.ObjectId(setId);
      }
      return copy;
    });
    return this.questionModel.insertMany(docs);
  }

  async deleteQuestion(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid question ID format');
    }
    await this.questionModel.findByIdAndUpdate(id, { status: 0 });
    return { success: true, message: 'Question removed' };
  }

  // ==========================================
  // 3. STUDENT TEST TAKING & SECURE FLOW
  // ==========================================

  async startTest(studentId: string, setId: string, secretKey?: string, currentUser?: any): Promise<any> {
    if (!Types.ObjectId.isValid(setId)) {
      throw new BadRequestException('Invalid assessment ID format');
    }

    const set = await this.setModel.findById(setId);
    if (!set || set.status === 0) {
      throw new NotFoundException('Assessment not found or unavailable');
    }

    // Rule A: Classroom PIN Verification
    if (set.publishing_mode === 'pin_protected') {
      if (!secretKey || secretKey.trim().toUpperCase() !== (set.secret_key || '').trim().toUpperCase()) {
        throw new UnauthorizedException('Invalid Secret PIN. Please enter the classroom access PIN.');
      }
    }

    // Rule B: Scheduled Time Window Verification
    const now = new Date();
    if (set.publishing_mode === 'scheduled') {
      if (set.start_date && now < new Date(set.start_date)) {
        throw new BadRequestException(`This exam has not opened yet. Opens on ${new Date(set.start_date).toLocaleString()}`);
      }
      if (set.end_date && now > new Date(set.end_date)) {
        throw new BadRequestException(`This exam window has closed on ${new Date(set.end_date).toLocaleString()}`);
      }
    }

    // Rule C: Single Attempt Lock for Official Assessments
    if (set.max_attempts <= 1) {
      const existingCompleted = await this.attemptModel.findOne({
        student_id: new Types.ObjectId(studentId),
        set_id: set._id,
        status: { $in: ['submitted', 'disqualified', 'timeout'] },
      });
      if (existingCompleted && !set.is_retake_allowed) {
        throw new ForbiddenException('You have already taken this examination. Multiple attempts are locked.');
      }
    }

    // Load active questions
    let questions = await this.questionModel.find({ set_id: set._id, status: 1 }).lean();
    if (questions.length === 0) {
      throw new BadRequestException('This assessment has no questions configured yet.');
    }

    // Shuffling
    if (set.shuffle_questions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    if (set.shuffle_options) {
      questions = questions.map((q) => {
        if (Array.isArray(q.options) && q.options.length > 1) {
          return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) };
        }
        return q;
      });
    }

    // CRITICAL SECURITY RESTRICTION: Sanitize answers before returning to student client!
    const sanitizedQuestions = questions.map((q) => {
      const { correct_answer, correct_option_index, explanation, ...safeFields } = q;
      return safeFields;
    });

    // Lookup student name from Enrollment or User
    let studentName = currentUser?.name || 'Student Candidate';
    if (Types.ObjectId.isValid(studentId)) {
      const enrollment = await this.enrollmentModel.findById(studentId).lean();
      if (enrollment) studentName = enrollment.student_name;
    }

    // Create New Test Attempt
    const attempt = new this.attemptModel({
      student_id: new Types.ObjectId(studentId),
      user_id: currentUser?.sub ? new Types.ObjectId(currentUser.sub) : undefined,
      student_name: studentName,
      set_id: set._id,
      start_time: now,
      total_questions: sanitizedQuestions.length,
      violations_count: 0,
      violations_log: [],
      status: 'in_progress',
    });
    const savedAttempt = await attempt.save();

    const deadline = new Date(now.getTime() + set.duration_minutes * 60000);

    return {
      attempt_id: savedAttempt._id,
      set_id: set._id,
      title: set.title || set.set_name,
      category: set.category,
      duration_minutes: set.duration_minutes,
      server_start_time: now.toISOString(),
      server_deadline: deadline.toISOString(),
      max_violations: set.max_violations || 3,
      total_questions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };
  }

  async logViolation(attemptId: string, violation: { type: string; description: string }) {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Exam attempt not found');

    if (attempt.status !== 'in_progress') {
      return { status: attempt.status, violations_count: attempt.violations_count };
    }

    const set = await this.setModel.findById(attempt.set_id);
    const maxViolations = set ? set.max_violations || 3 : 3;

    attempt.violations_count = (attempt.violations_count || 0) + 1;
    attempt.violations_log.push({
      timestamp: new Date().toISOString(),
      type: violation.type || 'tab_switch',
      description: violation.description || 'Browser tab switched or window unfocused',
    });

    // Auto-Disqualification when tab violations exceed limit
    let isDisqualified = false;
    if (attempt.violations_count >= maxViolations) {
      attempt.status = 'disqualified';
      attempt.is_disqualified = true;
      attempt.disqualified_reason = `Exceeded allowable browser switches (${attempt.violations_count}/${maxViolations})`;
      attempt.end_time = new Date();
      attempt.is_passed = false;
      attempt.earned_credits = 0;
      isDisqualified = true;
    }

    await attempt.save();

    return {
      attempt_id: attempt._id,
      violations_count: attempt.violations_count,
      max_violations: maxViolations,
      is_disqualified: isDisqualified,
      status: attempt.status,
    };
  }

  async submitTest(
    attemptId: string,
    answers: Array<{ question_id: string; selected_option: any }>,
    disqualified = false,
  ) {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Exam attempt not found');

    const set = await this.setModel.findById(attempt.set_id);
    if (!set) throw new NotFoundException('Associated question set not found');

    // Rule: Server-Side Timeout Verification
    const now = new Date();
    const allowedEndTime = new Date(attempt.start_time.getTime() + (set.duration_minutes + 1) * 60000); // 1 min grace
    const isTimeout = now > allowedEndTime;

    const passPercentage = set.pass_percentage || 60;
    const negativeMark = set.negative_marking_per_question || 0;

    const questions = await this.questionModel.find({ set_id: attempt.set_id });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    let marksObtained = 0;
    let totalMarks = 0;

    const evaluatedAnswers = (answers || []).map((ans) => {
      const q = questionMap.get(ans.question_id);
      const qMarks = q ? q.marks || 1 : 1;
      totalMarks += qMarks;

      let isCorrect = false;
      if (q) {
        if (q.type === 'mcq' || q.type === 'find_output' || q.type === 'true_false') {
          isCorrect = q.correct_option_index === Number(ans.selected_option);
        } else if (q.type === 'multiple_correct' && Array.isArray(ans.selected_option)) {
          const correctArr = Array.isArray(q.correct_answer)
            ? q.correct_answer
            : [q.correct_option_index];
          isCorrect =
            [...ans.selected_option].sort().join(',') === [...correctArr].sort().join(',');
        } else if (q.type === 'fill_blanks' || q.type === 'short_answer') {
          isCorrect =
            String(ans.selected_option).trim().toLowerCase() ===
            String(q.correct_answer).trim().toLowerCase();
        } else if (q.type === 'coding') {
          isCorrect = Boolean(ans.selected_option && String(ans.selected_option).trim().length > 15);
        }
      }

      if (isCorrect) {
        correctCount++;
        marksObtained += qMarks;
      } else if (negativeMark > 0 && ans.selected_option !== undefined && ans.selected_option !== null) {
        marksObtained = Math.max(0, marksObtained - negativeMark);
      }

      return {
        question_id: new Types.ObjectId(ans.question_id),
        selected_option: ans.selected_option,
        is_correct: isCorrect,
      };
    });

    const totalQuestions = questions.length || 1;
    const finalTotalMarks = totalMarks || totalQuestions;
    const scorePercentage = Math.round((marksObtained / Math.max(1, finalTotalMarks)) * 100);
    const isPassed = !disqualified && !attempt.is_disqualified && scorePercentage >= passPercentage;

    // Evaluate Tiered Credits
    let earnedCredits = 0;
    const isAptitudeOrPractice = set.category === 'aptitude' || set.category === 'practice';

    // STRICT BUSINESS RESTRICTION: Aptitude & Practice Tests ALWAYS award 0 Credits!
    if (!isAptitudeOrPractice && isPassed) {
      const defaultTiers = [
        { min_percentage: 90, max_percentage: 100, credits: 25 },
        { min_percentage: 80, max_percentage: 89, credits: 20 },
        { min_percentage: 70, max_percentage: 79, credits: 15 },
        { min_percentage: 60, max_percentage: 69, credits: 10 },
        { min_percentage: 50, max_percentage: 59, credits: 5 },
      ];
      const tiers = set.credit_tiers && set.credit_tiers.length > 0 ? set.credit_tiers : defaultTiers;
      const sorted = [...tiers].sort((a, b) => b.min_percentage - a.min_percentage);
      for (const tier of sorted) {
        if (scorePercentage >= tier.min_percentage) {
          earnedCredits = tier.credits;
          break;
        }
      }

      // Automatically post credit transaction to student portfolio ledger
      if (earnedCredits > 0) {
        try {
          await this.creditTxModel.create({
            company_id: set.course_id,
            student_id: attempt.student_id,
            category: set.category === 'overall' ? 'Academic Semester Exam' : 'Monthly Internal Assessment',
            title: set.title || set.set_name,
            credits: earnedCredits,
            awarded_by: 'Automated Examination System',
            source_id: attempt._id.toString(),
            date: new Date().toISOString(),
            notes: `Passed assessment "${set.title || set.set_name}" with score ${scorePercentage}% (${marksObtained}/${finalTotalMarks} Marks).`,
          });
        } catch (e) {
          console.error('Failed to log credit transaction', e);
        }
      }
    }

    attempt.end_time = now;
    attempt.correct_count = correctCount;
    attempt.total_questions = totalQuestions;
    attempt.marks_obtained = marksObtained;
    attempt.total_marks = finalTotalMarks;
    attempt.score_percentage = scorePercentage;
    attempt.is_passed = isPassed;
    attempt.earned_credits = earnedCredits;
    attempt.status = disqualified || attempt.is_disqualified ? 'disqualified' : isTimeout ? 'timeout' : 'submitted';
    attempt.answers = evaluatedAnswers;

    await attempt.save();

    return {
      attempt_id: attempt._id,
      total_questions: totalQuestions,
      correct_count: correctCount,
      marks_obtained: marksObtained,
      total_marks: finalTotalMarks,
      score_percentage: scorePercentage,
      is_passed: isPassed,
      earned_credits: earnedCredits,
      status: attempt.status,
    };
  }

  // ==========================================
  // 4. SCORECARD & PERMISSION-GATED REVIEW
  // ==========================================

  async getScorecardWithPermissionCheck(attemptId: string, currentUser?: any): Promise<any> {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException('Invalid attempt ID format');
    }

    const attempt = await this.attemptModel.findById(attemptId).populate('set_id').lean();
    if (!attempt) throw new NotFoundException('Exam attempt not found');

    const set = attempt.set_id as any;
    const isStaff = currentUser && ['admin', 'mentor', 'director'].includes(currentUser.role);

    // Business Rule:
    // - Immediate mode: answers are visible immediately upon completion
    // - Scheduled (Hidden Mode): answers are sealed until Admin/Mentor releases them
    // - Staff (Admin/Mentor) can ALWAYS inspect solutions
    const isHiddenAnswersMode = set?.result_visibility === 'scheduled';
    const canSeeSolutions = isStaff || !isHiddenAnswersMode || Boolean(set?.is_answer_key_released);

    if (!canSeeSolutions) {
      return {
        attempt_id: attempt._id,
        test_title: set?.title || set?.set_name,
        category: set?.category,
        score_percentage: attempt.score_percentage,
        marks_obtained: attempt.marks_obtained,
        total_marks: attempt.total_marks,
        is_passed: attempt.is_passed,
        earned_credits: attempt.earned_credits,
        violations_count: attempt.violations_count,
        status: attempt.status,
        solutions_sealed: true,
        message: 'Official exam answers are sealed until Admin or Mentor grants release permission.',
      };
    }

    // If permitted, fetch questions and merge with full answers and explanations
    const questions = await this.questionModel.find({ set_id: set._id }).lean();
    const answerMap = new Map((attempt.answers || []).map((a) => [a.question_id.toString(), a]));

    const detailedQuestions = questions.map((q) => {
      const userAns = answerMap.get(q._id.toString());
      return {
        ...q,
        student_selected_option: userAns ? userAns.selected_option : null,
        is_student_correct: userAns ? userAns.is_correct : false,
      };
    });

    return {
      attempt_id: attempt._id,
      test_title: set?.title || set?.set_name,
      category: set?.category,
      score_percentage: attempt.score_percentage,
      marks_obtained: attempt.marks_obtained,
      total_marks: attempt.total_marks,
      is_passed: attempt.is_passed,
      earned_credits: attempt.earned_credits,
      violations_count: attempt.violations_count,
      status: attempt.status,
      solutions_sealed: false,
      questions: detailedQuestions,
    };
  }

  async getStudentResults(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID format');
    }
    return this.attemptModel
      .find({
        $or: [
          { student_id: new Types.ObjectId(studentId) },
          { user_id: new Types.ObjectId(studentId) },
        ],
      })
      .populate('set_id', 'set_name title category duration_minutes is_answer_key_released result_visibility')
      .sort({ createdAt: -1 });
  }

  // ==========================================
  // 5. AUDIT, ANALYTICS & LIVE PROCTORING
  // ==========================================

  async getExamAnalytics(setId: string) {
    if (!Types.ObjectId.isValid(setId)) {
      throw new BadRequestException('Invalid assessment ID format');
    }

    const set = await this.setModel.findById(setId);
    if (!set) throw new NotFoundException('Assessment not found');

    const attempts = await this.attemptModel.find({ set_id: new Types.ObjectId(setId) }).lean();
    const completed = attempts.filter((a) => a.status === 'submitted' || a.status === 'disqualified');
    const passed = completed.filter((a) => a.is_passed);
    const failed = completed.filter((a) => !a.is_passed);

    const avgScore =
      completed.length > 0
        ? Math.round(completed.reduce((acc, a) => acc + (a.score_percentage || 0), 0) / completed.length)
        : 0;

    const totalCreditsAwarded = completed.reduce((acc, a) => acc + (a.earned_credits || 0), 0);

    const rankings = [...completed]
      .sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0))
      .map((att, idx) => ({
        rank: idx + 1,
        student_id: att.student_id,
        student_name: att.student_name || 'Examinee',
        marks_obtained: att.marks_obtained,
        total_marks: att.total_marks,
        score_percentage: att.score_percentage,
        is_passed: att.is_passed,
        earned_credits: att.earned_credits,
        violations_count: att.violations_count || 0,
        status: att.status,
      }));

    return {
      set_id: set._id,
      title: set.title || set.set_name,
      category: set.category,
      is_answer_key_released: set.is_answer_key_released,
      total_examinees: attempts.length,
      completed_count: completed.length,
      passed_count: passed.length,
      failed_count: failed.length,
      pass_rate_percentage: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
      average_score_percentage: avgScore,
      total_credits_awarded: totalCreditsAwarded,
      rankings,
    };
  }

  async getLiveProctoring() {
    return this.attemptModel
      .find({ status: 'in_progress' })
      .populate('set_id', 'title set_name category duration_minutes max_violations')
      .sort({ createdAt: -1 })
      .lean();
  }
}
