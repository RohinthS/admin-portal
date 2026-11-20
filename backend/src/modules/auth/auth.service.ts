import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '../../schemas/user.schema';
import { Company, CompanyDocument } from '../../schemas/company.schema';
import { RolePermission, RolePermissionDocument } from '../../schemas/role.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly legacySalt = 'TrainingCenter_2026_Secure_Salt_!@#';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
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

    const adminUser = await this.userModel.findOne({ username: 'admin' });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.userModel.create({
        username: 'admin',
        password_hash: passwordHash,
        name: 'Super Administrator',
        email: 'admin@wegrow.edu',
        user_type: 'admin',
        company_id: defaultCompany._id,
        status: 1,
      });
      this.logger.log('Default admin seeded: admin / admin123');
    }

    const legacyAdmin = await this.userModel.findOne({ username: 'WeGrow' });
    if (!legacyAdmin) {
      const passwordHash = await bcrypt.hash('WeGrow@2025', 10);
      await this.userModel.create({
        username: 'WeGrow',
        password_hash: passwordHash,
        name: 'WeGrow Master Admin',
        user_type: 'admin',
        company_id: defaultCompany._id,
        status: 1,
      });
    }

    const student1 = await this.userModel.findOne({ username: 'WG-2026-001' });
    if (!student1) {
      const passwordHash = await bcrypt.hash('Student@123', 10);
      await this.userModel.create({
        username: 'WG-2026-001',
        password_hash: passwordHash,
        name: 'Rahul Sharma (Student 1)',
        email: 'student1@wegrow.edu',
        user_type: 'student',
        company_id: defaultCompany._id,
        status: 1,
      });
      this.logger.log('Default student seeded: WG-2026-001 / Student@123');
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
        company_id: defaultCompany._id,
        status: 1,
      });
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
