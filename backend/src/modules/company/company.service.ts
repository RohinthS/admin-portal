import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from '../../schemas/company.schema';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll() {
    return this.companyModel.find().sort({ company_name: 1, branch: 1 });
  }

  async findActive() {
    return this.companyModel.find({ status: 1 }).sort({ company_name: 1 });
  }

  async findById(id: string) {
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(data: Partial<Company>) {
    const created = new this.companyModel(data);
    const saved = await created.save();

    // Mirror to Supabase if configured
    await this.supabaseService.syncRecordToSupabase('tc_company', {
      id: saved._id.toString(),
      company_name: saved.company_name,
      branch: saved.branch,
      address: saved.address,
      phone: saved.phone,
      email: saved.email,
      gst_number: saved.gst_number,
      status: saved.status,
    });

    return saved;
  }

  async update(id: string, data: Partial<Company>) {
    const updated = await this.companyModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Company not found');

    await this.supabaseService.syncRecordToSupabase('tc_company', {
      id: updated._id.toString(),
      company_name: updated.company_name,
      branch: updated.branch,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      gst_number: updated.gst_number,
      status: updated.status,
    });

    return updated;
  }

  async remove(id: string) {
    return this.companyModel.findByIdAndUpdate(id, { status: 0 }, { new: true });
  }
}
