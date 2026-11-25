import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wegrow_admin';

async function resetDatabase() {
  console.log(`🔄 Connecting to MongoDB at: ${MONGODB_URI}...`);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection object is undefined.');
    }

    // List and drop all collections
    const collections = await db.listCollections().toArray();
    console.log(`🗑️  Dropping ${collections.length} collections...`);
    for (const coll of collections) {
      try {
        await db.collection(coll.name).drop();
        console.log(`   - Dropped collection: ${coll.name}`);
      } catch (e: any) {
        console.warn(`   ! Could not drop ${coll.name}: ${e.message}`);
      }
    }

    console.log('🌱 Reseeding clean fresh default data...');

    // 1. Create Default Company
    const companyResult = await db.collection('companies').insertOne({
      company_name: 'WeGrow Skill Campus & B School',
      branch: 'Main Campus',
      address: 'Coimbatore, Tamil Nadu',
      phone: '+91 98765 43210',
      email: 'info@wegrow.edu',
      gst_number: '33AAAAA0000A1Z5',
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const companyId = companyResult.insertedId;
    console.log(`✅ Seeded Company: WeGrow Skill Campus (${companyId})`);

    // 2. Create 7 Standard Roles (Admin, Manager, GM, MD, Staff, HR, Student)
    const rolesData = [
      { key: 'admin', name: 'Admin', desc: 'Full unconstrained administrative privileges' },
      { key: 'manager', name: 'Manager', desc: 'Branch and operational management privileges' },
      { key: 'gm', name: 'GM', desc: 'General Manager executive administration privileges' },
      { key: 'md', name: 'MD', desc: 'Managing Director top-level institutional authority' },
      { key: 'staff', name: 'Staff', desc: 'Academic and operations staff privileges' },
      { key: 'hr', name: 'HR', desc: 'Human Resources, Payroll, Leaves & Staff management' },
      { key: 'student', name: 'Student', desc: 'Enrolled student learner portal access' },
    ];

    const roleMap: Record<string, any> = {};
    for (const r of rolesData) {
      const inserted = await db.collection('roles').insertOne({
        role_name: r.name,
        description: r.desc,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      roleMap[r.key] = inserted.insertedId;
    }
    console.log('✅ Seeded All 7 Roles: Admin, Manager, GM, MD, Staff, HR, Student');

    // 3. Seed Permissions for Executive & Operational Roles
    const modules = [
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

    for (const execKey of ['admin', 'gm', 'md']) {
      const execId = roleMap[execKey];
      const permissionDocs = modules.map((mod) => ({
        role_id: execId,
        company_id: companyId,
        permission_page: mod,
        permission_action: 'V$$A$$E$$D',
        actions: ['V', 'A', 'E', 'D'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await db.collection('role_permissions').insertMany(permissionDocs);
    }

    // Manager permissions
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
    await db.collection('role_permissions').insertMany(
      mgrModules.map((mod) => ({
        role_id: roleMap['manager'],
        company_id: companyId,
        permission_page: mod,
        permission_action: 'V$$A$$E$$D',
        actions: ['V', 'A', 'E', 'D'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    // HR permissions
    const hrModules = [
      'dashboard', 'staff', 'users', 'attendance', 'payroll',
      'leave_approval', 'leave_report', 'apply_leave', 'leave_history', 'my_payslips',
      'expense_category', 'expense_entry', 'report_attendance', 'report_expense', 'profile_update',
    ];
    await db.collection('role_permissions').insertMany(
      hrModules.map((mod) => ({
        role_id: roleMap['hr'],
        company_id: companyId,
        permission_page: mod,
        permission_action: 'V$$A$$E$$D',
        actions: ['V', 'A', 'E', 'D'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    // Staff permissions
    const staffModules = [
      'dashboard', 'tasks', 'attendance', 'student_attendance', 'report_daily_work',
      'tests', 'apply_leave', 'leave_history', 'my_payslips', 'profile_update',
    ];
    await db.collection('role_permissions').insertMany(
      staffModules.map((mod) => ({
        role_id: roleMap['staff'],
        company_id: companyId,
        permission_page: mod,
        permission_action: 'V$$A$$E',
        actions: ['V', 'A', 'E'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log('✅ Seeded Role Permissions across modules for Admin, Manager, GM, MD, Staff, HR');

    // 4. Create Default Users for all 7 Roles
    const defaultAccounts = [
      { username: 'admin', name: 'System Administrator', pass: 'admin123', type: 'admin', role: 'admin' },
      { username: 'manager', name: 'Branch Manager', pass: 'Manager@123', type: 'manager', role: 'manager' },
      { username: 'gm', name: 'General Manager (GM)', pass: 'GM@123', type: 'gm', role: 'gm' },
      { username: 'md', name: 'Managing Director (MD)', pass: 'MD@123', type: 'md', role: 'md' },
      { username: 'staff', name: 'Faculty & Operations Staff', pass: 'Staff@123', type: 'staff', role: 'staff' },
      { username: 'hr', name: 'HR Executive', pass: 'HR@123', type: 'hr', role: 'hr' },
      { username: 'student', name: 'Demo Student', pass: 'Student@123', type: 'student', role: 'student' },
    ];

    for (const acc of defaultAccounts) {
      const hash = await bcrypt.hash(acc.pass, 10);
      await db.collection('users').insertOne({
        username: acc.username,
        password_hash: hash,
        name: acc.name,
        email: `${acc.username}@wegrow.edu`,
        phone: '+91 98765 43210',
        user_type: acc.type,
        role_id: roleMap[acc.role],
        company_id: companyId,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const wegrowPasswordHash = await bcrypt.hash('WeGrow@2025', 10);
    await db.collection('users').insertOne({
      username: 'WeGrow',
      password_hash: wegrowPasswordHash,
      name: 'WeGrow Master Admin',
      email: 'master@wegrow.edu',
      user_type: 'admin',
      role_id: roleMap['admin'],
      company_id: companyId,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Seeded Accounts for Admin, Manager, GM, MD, Staff, HR, Student');

    // 5. Create Default Students
    const studentPasswordHash = await bcrypt.hash('Student@123', 10);
    await db.collection('users').insertOne({
      username: 'WG-2026-001',
      password_hash: studentPasswordHash,
      name: 'Rahul Sharma (Student 1)',
      email: 'student1@wegrow.edu',
      user_type: 'student',
      role_id: roleMap['student'],
      company_id: companyId,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection('users').insertOne({
      username: 'WG-2026-002',
      password_hash: studentPasswordHash,
      name: 'Priya Patel (Student 2)',
      email: 'student2@wegrow.edu',
      user_type: 'student',
      role_id: roleMap['student'],
      company_id: companyId,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ Seeded Student Accounts: WG-2026-001 & WG-2026-002 (Student@123)');

    console.log('\n🎉 Database reset & reseed completed successfully!');
  } catch (err: any) {
    console.error('❌ Database reset failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

resetDatabase();
