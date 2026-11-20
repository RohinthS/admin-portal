import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../../schemas/task.schema';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async findAll(companyId?: string, taskFor?: string, assignedTo?: string) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (taskFor) query.task_for = taskFor;
    if (assignedTo) query.assigned_to = new Types.ObjectId(assignedTo);

    return this.taskModel
      .find(query)
      .populate('assigned_by', 'name username')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const task = await this.taskModel.findById(id).populate('assigned_by', 'name');
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(data: Partial<Task>) {
    const task = new this.taskModel(data);
    return task.save();
  }

  async update(id: string, data: Partial<Task>) {
    const task = await this.taskModel.findByIdAndUpdate(id, data, { new: true });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async addComment(id: string, authorId: string, commentText: string) {
    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    task.comments.push({
      author_id: new Types.ObjectId(authorId),
      comment: commentText,
      created_at: new Date(),
    });

    return task.save();
  }

  async findForStudent(user: any, companyId?: string) {
    const userId = user?.sub || user?.id || user?._id;
    const username = user?.username;
    const name = user?.name;

    const queries: any[] = [];
    if (username) queries.push({ enrollment_no: username });
    if (name) queries.push({ student_name: new RegExp(`^${name}$`, 'i') });
    if (user?.phone) queries.push({ phone: user.phone });

    let enrollment: any = null;
    if (queries.length > 0) {
      enrollment = await this.enrollmentModel.findOne({ $or: queries });
    }

    const entityIds: any[] = [];
    if (userId && Types.ObjectId.isValid(userId)) entityIds.push(new Types.ObjectId(userId));
    if (enrollment?._id) entityIds.push(enrollment._id);

    const taskQuery: any = {
      $or: [
        { assigned_to: { $in: entityIds } },
        { task_for: 'student', assigned_to: { $in: entityIds } },
      ],
    };

    if (companyId && Types.ObjectId.isValid(companyId)) {
      taskQuery.company_id = new Types.ObjectId(companyId);
    }

    return this.taskModel
      .find(taskQuery)
      .populate('assigned_by', 'name username')
      .sort({ createdAt: -1 });
  }
}
