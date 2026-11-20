import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument, CourseClosure, CourseClosureDocument } from '../../schemas/course.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(CourseClosure.name) private readonly closureModel: Model<CourseClosureDocument>,
  ) {}

  async findAll() {
    return this.courseModel.find({ status: 1 }).sort({ course_name: 1 });
  }

  async findById(id: string) {
    const course = await this.courseModel.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async create(data: Partial<Course>) {
    const course = new this.courseModel(data);
    return course.save();
  }

  async update(id: string, data: Partial<Course>) {
    const course = await this.courseModel.findByIdAndUpdate(id, data, { new: true });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async remove(id: string) {
    return this.courseModel.findByIdAndUpdate(id, { status: 0 }, { new: true });
  }

  // Course Closures
  async getClosures(companyId?: string) {
    const query: any = { status: 1 };
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    return this.closureModel.find(query).populate('enrollment_id').sort({ closure_date: -1 });
  }

  async createClosure(data: { enrollment_id: string; company_id: string; closure_status: string; remarks?: string; certificate_no?: string }) {
    const closure = new this.closureModel({
      enrollment_id: new Types.ObjectId(data.enrollment_id),
      company_id: new Types.ObjectId(data.company_id),
      closure_status: data.closure_status,
      remarks: data.remarks,
      certificate_no: data.certificate_no,
      closure_date: new Date(),
      status: 1,
    });
    return closure.save();
  }
}
