import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '../../schemas/user.schema';
import { Company, CompanyDocument } from '../../schemas/company.schema';
import { Role, RoleDocument, RolePermission, RolePermissionDocument } from '../../schemas/role.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly legacySalt = 'TrainingCenter_2026_Secure_Salt_!@#';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedDefaultData();
    } catch (err: any) {
      this.logger.warn(`Could not seed default users: ${err.message}`);
    }
  }

  private async seedDefaultData() {
    let defaultCompany = await this.companyModel.findOne({ status: 1 });
    if (!defaultCompany) {
      defaultCompany = await this.companyModel.create({
        company_name: 'WeGrow Skill Campus & B School',
        branch: 'Main Campus',
        status: 1,
      });
      this.logger.log('Created default company: WeGrow Skill Campus');
    }

    // 1. Seed all 7 standard Roles (Admin, Manager, GM, MD, Staff, HR, Student)
    const ROLES_TO_SEED = [
      { key: 'admin', name: 'Admin', desc: 'Full unconstrained administrative privileges' },
      { key: 'manager', name: 'Manager', desc: 'Branch and operational management privileges' },
      { key: 'gm', name: 'GM', desc: 'General Manager executive administration privileges' },
      { key: 'md', name: 'MD', desc: 'Managing Director top-level institutional authority' },
      { key: 'staff', name: 'Staff', desc: 'Staff and faculty operations privileges' },
      { key: 'hr', name: 'HR', desc: 'Human Resources, Payroll, Leaves & Staff management' },
      { key: 'student', name: 'Student', desc: 'Student learner portal access' },
    ];

    const roleMap: Record<string, Types.ObjectId> = {};
    for (const r of ROLES_TO_SEED) {
      let roleDoc = await this.roleModel.findOne({
        role_name: { $regex: new RegExp(`^${r.name}$`, 'i') },
      });
      if (!roleDoc) {
        roleDoc = await this.roleModel.create({
          role_name: r.name,
          description: r.desc,
          status: 1,
        });
        this.logger.log(`Seeded Role: ${r.name}`);
      }
      roleMap[r.key] = roleDoc._id as Types.ObjectId;
    }

    // 2. Seed default users for all 7 Roles
    const USERS_TO_SEED = [
      { username: 'admin', name: 'System Administrator', pass: 'admin123', type: 'admin', email: 'admin@wegrow.edu' },
      { username: 'manager', name: 'Branch Manager', pass: 'Manager@123', type: 'manager', email: 'manager@wegrow.edu' },
      { username: 'gm', name: 'General Manager (GM)', pass: 'GM@123', type: 'gm', email: 'gm@wegrow.edu' },
      { username: 'md', name: 'Managing Director (MD)', pass: 'MD@123', type: 'md', email: 'md@wegrow.edu' },
      { username: 'staff', name: 'Faculty & Operations Staff', pass: 'Staff@123', type: 'staff', email: 'staff@wegrow.edu' },
      { username: 'hr', name: 'HR Executive', pass: 'HR@123', type: 'hr', email: 'hr@wegrow.edu' },
      { username: 'student', name: 'Demo Student', pass: 'Student@123', type: 'student', email: 'student@wegrow.edu' },
    ];

    for (const u of USERS_TO_SEED) {
      const existingUser = await this.userModel.findOne({ username: u.username });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(u.pass, 10);
        await this.userModel.create({
          username: u.username,
          password_hash: passwordHash,
          name: u.name,
          email: u.email,
          user_type: u.type,
          role_id: roleMap[u.type],
          company_id: defaultCompany._id,
          status: 1,
        });
        this.logger.log(`Seeded default user: ${u.username} (${u.type})`);
      } else {
        // Ensure role_id and user_type are aligned
        let updated = false;
        if (!existingUser.role_id && roleMap[u.type]) {
          existingUser.role_id = roleMap[u.type];
          updated = true;
        }
        if (existingUser.user_type !== u.type) {
          existingUser.user_type = u.type;
          updated = true;
        }
        if (updated) {
          await existingUser.save();
        }
      }
    }

    // Also support legacy WeGrow admin
    const legacyAdmin = await this.userModel.findOne({ username: 'WeGrow' });
    if (!legacyAdmin) {
      const passwordHash = await bcrypt.hash('WeGrow@2025', 10);
      await this.userModel.create({
        username: 'WeGrow',
        password_hash: passwordHash,
        name: 'WeGrow Master Admin',
        user_type: 'admin',
        role_id: roleMap['admin'],
        company_id: defaultCompany._id,
        status: 1,
      });
    }

    // Default students WG-2026-001 & WG-2026-002
    const student1 = await this.userModel.findOne({ username: 'WG-2026-001' });
    if (!student1) {
      const passwordHash = await bcrypt.hash('Student@123', 10);
      await this.userModel.create({
        username: 'WG-2026-001',
        password_hash: passwordHash,
        name: 'Rahul Sharma (Student 1)',
        email: 'student1@wegrow.edu',
        user_type: 'student',
        role_id: roleMap['student'],
        company_id: defaultCompany._id,
        status: 1,
      });
    }

    const student2 = await this.userModel.findOne({ username: 'WG-2026-002' });
    if (!student2) {
      const passwordHash = await bcrypt.hash('Student@123', 10);
      await this.userModel.create({
        username: 'WG-2026-002',
        password_hash: passwordHash,
        name: 'Priya Patel (Student 2)',
        email: 'student2@wegrow.edu',
        user_type: 'student',
        role_id: roleMap['student'],
        company_id: defaultCompany._id,
        status: 1,
      });
    }

    // 3. Seed default permissions for roles
    const ALL_MODULES = [
      'dashboard', 'company', 'roles', 'users', 'staff',
      'course', 'tasks', 'event', 'offer', 'students',
      'course_enquiry', 'enquiry_followup', 'enrollment',
      'enrollment_internship', 'course_closure', 'tests',
      'attendance', 'payroll', 'receipt', 'payment_mode',
      'bank', 'installment_followup', 'installment_followup_report',
      'staff_collection_report', 'expense_category', 'expense_entry',
      'leave_approval', 'leave_report', 'report_daily_work',
      'report_enrollment', 'report_enrollment_tracker', 'report_payments',
      'report_expense', 'report_attendance', 'report_student_attendance',
      'report_installments', 'profile_update', 'apply_leave',
      'leave_history', 'my_payslips',
    ];

    // Seed permissions for executive roles (admin, gm, md)
    for (const roleKey of ['admin', 'gm', 'md']) {
      const rId = roleMap[roleKey];
      if (!rId) continue;
      const count = await this.rolePermissionModel.countDocuments({ role_id: rId, company_id: defaultCompany._id });
      if (count === 0) {
        const docs = ALL_MODULES.map((mod) => ({
          role_id: rId,
          company_id: defaultCompany._id,
          permission_page: mod,
          permission_action: 'V$$A$$E$$D',
          actions: ['V', 'A', 'E', 'D'],
        }));
        await this.rolePermissionModel.insertMany(docs);
      }
    }

    // Seed permissions for Manager
    if (roleMap['manager']) {
      const count = await this.rolePermissionModel.countDocuments({ role_id: roleMap['manager'], company_id: defaultCompany._id });
      if (count === 0) {
        const mgrModules = [
          'dashboard', 'company', 'staff', 'course', 'tasks', 'students',
          'course_enquiry', 'enquiry_followup', 'enrollment', 'enrollment_internship',
          'attendance', 'payroll', 'receipt', 'payment_mode', 'bank',
          'installment_followup', 'installment_followup_report', 'staff_collection_report',
          'expense_category', 'expense_entry', 'leave_approval', 'leave_report',
          'report_daily_work', 'report_enrollment', 'report_payments', 'report_expense',
          'report_attendance', 'report_student_attendance', 'profile_update', 'apply_leave',
          'leave_history', 'my_payslips',
        ];
        const docs = mgrModules.map((mod) => ({
          role_id: roleMap['manager'],
          company_id: defaultCompany._id,
          permission_page: mod,
          permission_action: 'V$$A$$E$$D',
          actions: ['V', 'A', 'E', 'D'],
        }));
        await this.rolePermissionModel.insertMany(docs);
      }
    }

    // Seed permissions for HR
    if (roleMap['hr']) {
      const count = await this.rolePermissionModel.countDocuments({ role_id: roleMap['hr'], company_id: defaultCompany._id });
      if (count === 0) {
        const hrModules = [
          'dashboard', 'staff', 'users', 'attendance', 'payroll',
          'leave_approval', 'leave_report', 'apply_leave', 'leave_history', 'my_payslips',
          'expense_category', 'expense_entry', 'report_attendance', 'report_expense', 'profile_update',
        ];
        const docs = hrModules.map((mod) => ({
          role_id: roleMap['hr'],
          company_id: defaultCompany._id,
          permission_page: mod,
          permission_action: 'V$$A$$E$$D',
          actions: ['V', 'A', 'E', 'D'],
        }));
        await this.rolePermissionModel.insertMany(docs);
      }
    }

    // Seed permissions for Staff
    if (roleMap['staff']) {
      const count = await this.rolePermissionModel.countDocuments({ role_id: roleMap['staff'], company_id: defaultCompany._id });
      if (count === 0) {
        const staffModules = [
          'dashboard', 'tasks', 'attendance', 'student_attendance', 'report_daily_work',
          'tests', 'apply_leave', 'leave_history', 'my_payslips', 'profile_update',
        ];
        const docs = staffModules.map((mod) => ({
          role_id: roleMap['staff'],
          company_id: defaultCompany._id,
          permission_page: mod,
          permission_action: 'V$$A$$E',
          actions: ['V', 'A', 'E'],
        }));
        await this.rolePermissionModel.insertMany(docs);
      }
    }

    // Ensure mentor accounts remain removed
    await this.userModel.deleteMany({ username: { $in: ['kavitha', 'rajesh', 'mentor'] } });
  }

  private verifyPassword(inputPassword: string, storedHash: string): boolean {
    if (!storedHash) return false;

    // Check modern bcrypt
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, storedHash);
    }

    // Check PHP legacy AES-256-CBC double-base64 encrypted password
    try {
      const hashHex = crypto.createHash('sha256').update(this.legacySalt).digest('hex');
      const key = Buffer.from(hashHex.slice(0, 32), 'utf8');
      const iv = Buffer.from(hashHex.slice(0, 16), 'utf8');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let enc = cipher.update(inputPassword, 'utf8', 'base64');
      enc += cipher.final('base64');
      const phpEncrypted = Buffer.from(enc).toString('base64');
      if (storedHash === phpEncrypted) {
        return true;
      }
    } catch {
      // ignore
    }

    // Check PHP legacy salt hash (md5 or sha256 salted)
    const md5Legacy = crypto.createHash('md5').update(inputPassword + this.legacySalt).digest('hex');
    const sha256Legacy = crypto.createHash('sha256').update(inputPassword + this.legacySalt).digest('hex');
    const plainMd5 = crypto.createHash('md5').update(inputPassword).digest('hex');

    if (storedHash === md5Legacy || storedHash === sha256Legacy || storedHash === plainMd5 || storedHash === inputPassword) {
      return true;
    }

    return false;
  }

  async login(loginDto: { username: string; password: string; company_id?: string }) {
    const user = await this.userModel.findOne({ username: loginDto.username.trim() });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('Your account is inactive. Please contact administrator.');
    }

    const isValid = this.verifyPassword(loginDto.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Auto upgrade password to bcrypt if stored in legacy hash
    if (!user.password_hash.startsWith('$2b$') && !user.password_hash.startsWith('$2a$')) {
      user.password_hash = await bcrypt.hash(loginDto.password, 10);
      await user.save();
    }

    let activeCompanyId = loginDto.company_id || user.company_id?.toString();
    if (!activeCompanyId) {
      const defaultCompany = await this.companyModel.findOne({ status: 1 });
      activeCompanyId = defaultCompany?._id?.toString() || '';
    }

    user.last_login = new Date();
    await user.save();

    const payload = {
      sub: user._id,
      username: user.username,
      name: user.name,
      user_type: user.user_type,
      role_id: user.role_id?.toString(),
      company_id: activeCompanyId,
    };

    const token = this.jwtService.sign(payload);

    // Fetch user permissions for active company
    const permissions = await this.getUserPermissions(user.role_id, activeCompanyId);
    const companies = await this.companyModel.find({ status: 1 }).select('company_name branch _id');

    return {
      access_token: token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        role_id: user.role_id,
        company_id: activeCompanyId,
        avatar: user.avatar,
      },
      companies,
      permissions,
    };
  }

  async register(registerDto: { username: string; password: string; name: string; email?: string; phone?: string; company_id?: string; role_id?: string }) {
    const existing = await this.userModel.findOne({ username: registerDto.username });
    if (existing) {
      throw new BadRequestException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const newUser = new this.userModel({
      username: registerDto.username,
      password_hash: passwordHash,
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      company_id: registerDto.company_id ? new Types.ObjectId(registerDto.company_id) : undefined,
      role_id: registerDto.role_id ? new Types.ObjectId(registerDto.role_id) : undefined,
      user_type: 'staff',
      status: 1,
    });

    await newUser.save();
    return { message: 'User registered successfully', userId: newUser._id };
  }

  async getUserPermissions(roleId?: Types.ObjectId | string, companyId?: string) {
    if (!roleId || !companyId || !Types.ObjectId.isValid(companyId) || !Types.ObjectId.isValid(roleId)) {
      return {};
    }

    const records = await this.rolePermissionModel.find({
      role_id: new Types.ObjectId(roleId),
      company_id: new Types.ObjectId(companyId),
    });

    const permMap: Record<string, string[]> = {};
    for (const r of records) {
      const actions = r.actions && r.actions.length > 0 ? r.actions : r.permission_action ? r.permission_action.split('$$') : [];
      permMap[r.permission_page] = actions;
    }
    return permMap;
  }

  async switchCompany(userId: string, newCompanyId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const company = await this.companyModel.findById(newCompanyId);
    if (!company) throw new BadRequestException('Company does not exist');

    const payload = {
      sub: user._id,
      username: user.username,
      name: user.name,
      user_type: user.user_type,
      role_id: user.role_id?.toString(),
      company_id: newCompanyId,
    };

    const token = this.jwtService.sign(payload);
    const permissions = await this.getUserPermissions(user.role_id, newCompanyId);

    return {
      access_token: token,
      active_company: company,
      permissions,
    };
  }

  async getMe(userId: string, companyId?: string) {
    const user = await this.userModel.findById(userId).select('-password_hash');
    if (!user) throw new UnauthorizedException('User not found');

    const activeCompanyId = companyId || user.company_id?.toString();
    const permissions = await this.getUserPermissions(user.role_id, activeCompanyId);
    const companies = await this.companyModel.find({ status: 1 });

    return {
      user,
      active_company_id: activeCompanyId,
      companies,
      permissions,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; email?: string; password?: string }) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (data.name && data.name.trim()) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.email !== undefined) user.email = data.email.trim();
    if (data.password && data.password.trim()) {
      user.password_hash = await bcrypt.hash(data.password.trim(), 10);
    }

    await user.save();

    return {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        role_id: user.role_id,
        company_id: user.company_id,
        avatar: user.avatar,
      },
    };
  }

  async findUsers(userType?: string, companyId?: string) {
    const query: any = { status: 1 };
    if (userType) query.user_type = userType;
    if (companyId && Types.ObjectId.isValid(companyId)) query.company_id = new Types.ObjectId(companyId);
    return this.userModel.find(query).select('-password_hash').sort({ createdAt: -1 });
  }
}
