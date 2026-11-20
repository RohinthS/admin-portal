import api from '../api/client';

export interface StudentAccount {
  id: string;
  student_id: string; // Order-based Student ID, e.g. WG-2026-001
  student_name: string;
  email: string;
  phone: string;
  password?: string;
  initial_password?: string;
  course_id?: string;
  course_name: string;
  course_type: 'training' | 'internship';
  batch?: string; // 'Morning Batch (9:30 AM - 12:30 PM)' | 'Evening Batch (2:00 PM - 5:00 PM)' | 'Weekend Fast-Track Batch'
  company_id?: string;
  company_name?: string;
  branch?: string;
  college_name?: string;
  qualification?: string;
  joining_date: string;
  total_fees?: number;
  paid_amount?: number;
  balance_amount?: number;
  status: 'active' | 'inactive';
  created_at: string;
}

const STORAGE_KEY = 'wegrow_student_accounts_v1';
const CURRENT_STUDENT_KEY = 'wegrow_current_student_session';

const DEFAULT_STUDENTS: StudentAccount[] = [
  {
    id: 'STU_SAMPLE_1',
    student_id: 'WG-2026-001',
    student_name: 'Priya Sharma',
    email: 'priya.sharma@wegrowcampus.in',
    phone: '9876543210',
    password: 'Student@123',
    initial_password: 'Student@123',
    course_name: 'AI Python Full Stack Program',
    course_type: 'training',
    batch: 'Morning Batch (9:30 AM - 12:30 PM)',
    company_name: 'WeGrow Skill Campus',
    branch: 'Sivakasi',
    college_name: 'PSG College of Technology',
    qualification: 'B.Tech IT',
    joining_date: '2026-01-15',
    total_fees: 35000,
    paid_amount: 35000,
    balance_amount: 0,
    status: 'active',
    created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'STU_SAMPLE_2',
    student_id: 'WG-2026-002',
    student_name: 'Rahul Kumar',
    email: 'rahul.kumar@wegrowcampus.in',
    phone: '9876543211',
    password: 'Student@123',
    initial_password: 'Student@123',
    course_name: 'AI Java Program',
    course_type: 'internship',
    batch: 'Morning Batch (9:30 AM - 12:30 PM)',
    company_name: 'WeGrow Skill Campus',
    branch: 'Srivilliputhur',
    college_name: 'Coimbatore Institute of Engineering',
    qualification: 'B.E. Computer Science',
    joining_date: '2026-02-01',
    total_fees: 40000,
    paid_amount: 25000,
    balance_amount: 15000,
    status: 'active',
    created_at: '2026-02-01T10:30:00.000Z',
  },
];

class StudentAccountService {
  /**
   * Retrieves all students from local persistence, initializing defaults if none exist.
   */
  public getStudents(): StudentAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: StudentAccount[] = DEFAULT_STUDENTS;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {
          console.warn('Invalid student accounts JSON, reverting to defaults:', e);
        }
      }

      // Defensive sanitation: ensure no required property is undefined/null
      return list.map((s, idx) => ({
        id: s?.id || `STU_${idx}`,
        student_id: String(s?.student_id || `WG-2026-${String(idx + 1).padStart(3, '0')}`),
        student_name: String(s?.student_name || 'Student'),
        email: String(s?.email || ''),
        phone: String(s?.phone || ''),
        password: String(s?.password || s?.initial_password || 'Student@123'),
        initial_password: String(s?.initial_password || 'Student@123'),
        course_name: String(s?.course_name || 'Professional Certification'),
        course_type: (s?.course_type === 'internship' ? 'internship' : 'training') as 'training' | 'internship',
        company_name: String(s?.company_name || 'WeGrow Skill Campus'),
        branch: String(s?.branch || 'Sivakasi'),
        college_name: String(s?.college_name || ''),
        qualification: String(s?.qualification || ''),
        joining_date: String(s?.joining_date || new Date().toISOString().slice(0, 10)),
        total_fees: Number(s?.total_fees) || 0,
        paid_amount: Number(s?.paid_amount) || 0,
        balance_amount: Number(s?.balance_amount) || 0,
        status: (s?.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
        created_at: String(s?.created_at || new Date().toISOString()),
      }));
    } catch (e) {
      console.error('Error reading student accounts:', e);
      return DEFAULT_STUDENTS;
    }
  }

  /**
   * Automatically synchronizes with pre-imported database roster (/data/imported_students.json)
   * or backend MongoDB enrollments so all existing students appear.
   */
  public async syncWithImportedRoster(): Promise<StudentAccount[]> {
    try {
      const res = await fetch('/data/imported_students.json');
      if (res.ok) {
        const json: StudentAccount[] = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const current = this.getStudents();
          const map = new Map<string, StudentAccount>();
          
          // Existing from storage
          current.forEach((s) => {
            const key = (s.student_id || s.id || '').toLowerCase();
            if (key) map.set(key, s);
          });

          // Merge imported students
          let newAdded = 0;
          json.forEach((s) => {
            const key = (s.student_id || s.id || '').toLowerCase();
            if (key && !map.has(key)) {
              map.set(key, s);
              newAdded++;
            }
          });

          const merged = Array.from(map.values());
          if (newAdded > 0 || current.length <= 2) {
            this.saveStudents(merged);
            return merged;
          }
        }
      }
    } catch (e) {
      console.warn('Could not auto-sync imported_students.json:', e);
    }
    return this.getStudents();
  }

  /**
   * Method 2: Import student records directly from a CSV file.
   * Handles quoted cells, UTF-8 BOM, and maps standard columns.
   */
  public importFromCsv(csvText: string): { total: number; added: number; updated: number } {
    let text = csvText.trim();
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Parse CSV rows handling quotes
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) {
      throw new Error('CSV file must have a header row and at least one student data row.');
    }

    const rawHeaders = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    const findCol = (candidates: string[]) => {
      for (const cand of candidates) {
        const idx = rawHeaders.findIndex((h) => h.includes(cand));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = findCol(['student_name', 'full_name', 'name']);
    const idIdx = findCol(['student_roll_id', 'student_id', 'enrollment_no', 'roll_id', 'id']);
    const emailIdx = findCol(['email']);
    const phoneIdx = findCol(['phone', 'mobile', 'contact']);
    const courseIdx = findCol(['course', 'program']);
    const typeIdx = findCol(['course_type', 'type']);
    const branchIdx = findCol(['branch', 'campus', 'company']);
    const collegeIdx = findCol(['college', 'university', 'institution']);
    const qualIdx = findCol(['qualification', 'degree', 'dept']);
    const dateIdx = findCol(['joining_date', 'doj', 'created_date', 'date']);
    const totalFeesIdx = findCol(['total_fees', 'fees', 'fee_amount']);
    const paidFeesIdx = findCol(['paid_amount', 'paid']);
    const balanceFeesIdx = findCol(['balance_amount', 'balance']);
    const statusIdx = findCol(['status']);

    const currentStudents = this.getStudents();
    const studentsMap = new Map<string, StudentAccount>();
    currentStudents.forEach((s) => studentsMap.set(s.student_id.toLowerCase(), s));

    let addedCount = 0;
    let updatedCount = 0;
    let nextNum = 100;
    currentStudents.forEach((s) => {
      const match = s.student_id.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > nextNum) nextNum = n;
      }
    });

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = nameIdx !== -1 ? row[nameIdx] : '';
      if (!name || name.trim() === '') continue;

      let rollId = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : '';
      if (!rollId) {
        nextNum++;
        rollId = `WG-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      }

      const email = emailIdx !== -1 ? (row[emailIdx] || '').trim() : '';
      const phone = phoneIdx !== -1 ? (row[phoneIdx] || '').replace(/[^\d+]/g, '') : '9999999999';
      const courseName = courseIdx !== -1 && row[courseIdx] ? row[courseIdx].trim() : 'Professional Certification';
      const rawType = typeIdx !== -1 ? (row[typeIdx] || '').toLowerCase() : '';
      const courseType = rawType.includes('intern') ? 'internship' : 'training';
      const branch = branchIdx !== -1 && row[branchIdx] ? row[branchIdx].trim() : 'Main Campus';
      const college = collegeIdx !== -1 && row[collegeIdx] ? row[collegeIdx].trim() : '';
      const qualification = qualIdx !== -1 && row[qualIdx] ? row[qualIdx].trim() : '';
      const joiningDate = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : new Date().toISOString().slice(0, 10);

      const totalFees = totalFeesIdx !== -1 ? Number((row[totalFeesIdx] || '').replace(/[^\d.]/g, '')) || 35000 : 35000;
      const paidAmount = paidFeesIdx !== -1 ? Number((row[paidFeesIdx] || '').replace(/[^\d.]/g, '')) || 0 : 0;
      const balanceAmount = balanceFeesIdx !== -1 ? Number((row[balanceFeesIdx] || '').replace(/[^\d.]/g, '')) || Math.max(0, totalFees - paidAmount) : Math.max(0, totalFees - paidAmount);
      const rawStatus = statusIdx !== -1 ? (row[statusIdx] || '').toLowerCase() : 'active';
      const status: 'active' | 'inactive' = rawStatus.includes('drop') || rawStatus.includes('inact') ? 'inactive' : 'active';

      const key = rollId.toLowerCase();
      const existing = studentsMap.get(key);

      const studentData: StudentAccount = {
        id: existing?.id || `STU_${rollId}`,
        student_id: rollId,
        student_name: name.trim(),
        email: email || `${rollId.toLowerCase().replace(/[^a-z0-9]/g, '')}@wegrowcampus.in`,
        phone: phone || '9999999999',
        password: existing?.password || 'Student@123',
        initial_password: existing?.initial_password || 'Student@123',
        course_name: courseName,
        course_type: courseType,
        company_name: 'WeGrow Skill Campus',
        branch: branch,
        college_name: college,
        qualification: qualification,
        joining_date: joiningDate,
        total_fees: totalFees,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        status: status,
        created_at: existing?.created_at || new Date().toISOString(),
      };

      if (existing) {
        updatedCount++;
      } else {
        addedCount++;
      }
      studentsMap.set(key, studentData);
    }

    const finalStudents = Array.from(studentsMap.values());
    this.saveStudents(finalStudents);

    return {
      total: rows.length - 1,
      added: addedCount,
      updated: updatedCount,
    };
  }

  /**
   * Saves students array to local storage.
   */
  private saveStudents(students: StudentAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.error('Error saving student accounts:', e);
    }
  }

  /**
   * Calculates the next sequential student ID in numerical order based on database/stored records.
   * e.g. If highest number is 2, next is WG-2026-003.
   */
  public getNextStudentId(): string {
    const students = this.getStudents();
    const currentYear = new Date().getFullYear();
    let maxSeq = 0;

    students.forEach((stu) => {
      const id = stu.student_id || '';
      // Look for trailing digits or standard pattern WG-YYYY-XXX
      const matches = id.match(/(\d+)$/);
      if (matches && matches[1]) {
        const num = parseInt(matches[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const padded = String(nextSeq).padStart(3, '0');
    return `WG-${currentYear}-${padded}`;
  }

  /**
   * Admin creates a student account.
   * Assigns order-based ID, initial password, and stores all profile fields.
   */
  public async createStudentAccount(data: {
    student_id?: string;
    student_name: string;
    email: string;
    phone: string;
    password?: string;
    course_id?: string;
    course_name?: string;
    course_type?: 'training' | 'internship';
    company_id?: string;
    company_name?: string;
    branch?: string;
    college_name?: string;
    qualification?: string;
    joining_date?: string;
    total_fees?: number;
    paid_amount?: number;
  }): Promise<StudentAccount> {
    const students = this.getStudents();

    // Determine ID in sequential order
    const studentId = data.student_id?.trim() || this.getNextStudentId();

    // Check for ID collision
    const existing = students.find(
      (s) => s.student_id.toLowerCase() === studentId.toLowerCase(),
    );
    if (existing) {
      throw new Error(`Student ID ${studentId} is already assigned to ${existing.student_name}.`);
    }

    const initialPassword = data.password?.trim() || 'Student@123';
    const totalFees = data.total_fees || 0;
    const paidAmount = data.paid_amount || 0;
    const balanceAmount = Math.max(0, totalFees - paidAmount);

    const newStudent: StudentAccount = {
      id: `STU_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      student_id: studentId,
      student_name: data.student_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: initialPassword,
      initial_password: initialPassword,
      course_id: data.course_id,
      course_name: data.course_name?.trim() || 'Professional Certification',
      course_type: data.course_type || 'training',
      company_id: data.company_id,
      company_name: data.company_name?.trim() || 'WeGrow Skill Campus',
      branch: data.branch?.trim() || 'Main Campus',
      college_name: data.college_name?.trim() || '',
      qualification: data.qualification?.trim() || '',
      joining_date: data.joining_date || new Date().toISOString().slice(0, 10),
      total_fees: totalFees,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // Prepend to list so newest appears first or maintain order
    const updated = [newStudent, ...students];
    this.saveStudents(updated);

    // Sync to backend enrollment API asynchronously if available
    try {
      if (data.company_id && data.course_id) {
        await api.post('/enrollments', {
          student_name: newStudent.student_name,
          phone: newStudent.phone,
          email: newStudent.email,
          course_type: newStudent.course_type,
          course_id: newStudent.course_id,
          company_id: newStudent.company_id,
          total_fees: totalFees,
          paid_amount: paidAmount,
          college_name: newStudent.college_name,
          qualification: newStudent.qualification,
        });
      }
    } catch (err) {
      console.warn('Backend enrollment sync skipped or offline:', err);
    }

    return newStudent;
  }

  /**
   * Authenticate student with their Student ID and password.
   */
  public authenticateStudent(usernameOrId: string, pass: string, remember: boolean = false): StudentAccount | null {
    if (!usernameOrId || !pass) return null;
    const query = usernameOrId.trim().toLowerCase();
    const students = this.getStudents();

    const student = students.find(
      (s) =>
        s.student_id.toLowerCase() === query ||
        s.email.toLowerCase() === query ||
        s.phone.replace(/\D/g, '') === query.replace(/\D/g, ''),
    );

    if (!student) return null;
    if (student.status !== 'active') return null;

    // Check stored password or initial password
    const valid =
      (student.password && student.password === pass) ||
      (student.initial_password && student.initial_password === pass);

    if (!valid) return null;

    // Save student session (session-only by default, or persistent if remember is chosen)
    try {
      sessionStorage.removeItem(CURRENT_STUDENT_KEY);
      localStorage.removeItem(CURRENT_STUDENT_KEY);
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(student));
    } catch (e) {
      console.error('Failed to store active student session:', e);
    }

    return student;
  }

  /**
   * Get active logged in student session.
   */
  public getCurrentStudent(): StudentAccount | null {
    try {
      const stored = sessionStorage.getItem(CURRENT_STUDENT_KEY) || localStorage.getItem(CURRENT_STUDENT_KEY);
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored);
      if (!parsed.batch) {
        parsed.batch = 'Morning Batch (9:30 AM - 12:30 PM)';
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Updates the current logged-in student's active batch session
   */
  public setCurrentStudentBatch(batch: string): void {
    try {
      const current = this.getCurrentStudent();
      if (current) {
        current.batch = batch;
        sessionStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(current));
        localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(current));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wegrow_student_batch_updated'));
        }
      }
    } catch {}
  }

  /**
   * Clear active student session.
   */
  public clearStudentSession(): void {
    sessionStorage.removeItem(CURRENT_STUDENT_KEY);
    localStorage.removeItem(CURRENT_STUDENT_KEY);
  }

  /**
   * Student or Admin updates account password.
   */
  public changePassword(studentIdOrUsername: string, newPassword: string): boolean {
    if (!studentIdOrUsername || !newPassword) return false;
    const query = studentIdOrUsername.trim().toLowerCase();
    const students = this.getStudents();

    let found = false;
    const updated = students.map((s) => {
      if (
        s.student_id.toLowerCase() === query ||
        s.id === studentIdOrUsername ||
        s.email.toLowerCase() === query
      ) {
        found = true;
        return {
          ...s,
          password: newPassword,
        };
      }
      return s;
    });

    if (found) {
      this.saveStudents(updated);

      // If updating active session, update it
      const current = this.getCurrentStudent();
      if (
        current &&
        (current.student_id.toLowerCase() === query || current.id === studentIdOrUsername)
      ) {
        current.password = newPassword;
        if (sessionStorage.getItem(CURRENT_STUDENT_KEY)) {
          sessionStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(current));
        }
        if (localStorage.getItem(CURRENT_STUDENT_KEY)) {
          localStorage.setItem(CURRENT_STUDENT_KEY, JSON.stringify(current));
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Admin resets student password.
   */
  public resetPassword(studentId: string, newPass: string): boolean {
    return this.changePassword(studentId, newPass);
  }

  /**
   * Admin deletes a student account.
   */
  public deleteStudent(id: string): void {
    const students = this.getStudents();
    const filtered = students.filter((s) => s.id !== id && s.student_id !== id);
    this.saveStudents(filtered);
  }

  /**
   * Exports all student details to an Excel-compatible CSV with UTF-8 BOM.
   * Opens directly in Microsoft Excel, Google Sheets, LibreOffice Calc, etc.
   */
  public exportToExcel(studentsList?: StudentAccount[]): void {
    const list = studentsList || this.getStudents();

    // Headers
    const headers = [
      'Student Roll ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Course / Program',
      'Course Type',
      'Branch / Campus',
      'College / University',
      'Qualification',
      'Joining Date',
      'Total Fees (INR)',
      'Paid Amount (INR)',
      'Balance Amount (INR)',
      'Account Status',
      'Login Access Ready',
      'Created Date',
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((s) => [
      escapeCsv(s?.student_id || ''),
      escapeCsv(s?.student_name || ''),
      escapeCsv(s?.email || ''),
      escapeCsv(s?.phone || ''),
      escapeCsv(s?.course_name || 'Professional Certification'),
      escapeCsv((s?.course_type || 'training').toUpperCase()),
      escapeCsv(s?.branch || s?.company_name || 'Sivakasi'),
      escapeCsv(s?.college_name || 'N/A'),
      escapeCsv(s?.qualification || 'N/A'),
      escapeCsv(s?.joining_date || ''),
      escapeCsv(s?.total_fees || 0),
      escapeCsv(s?.paid_amount || 0),
      escapeCsv(s?.balance_amount || 0),
      escapeCsv((s?.status || 'active').toUpperCase()),
      escapeCsv('YES (Active Login)'),
      escapeCsv(s?.created_at ? s.created_at.slice(0, 10) : ''),
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Microsoft Excel encoding support
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `WeGrow_Student_Directory_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates Tab-Separated Values (TSV) for 1-click paste into Google Sheets.
   */
  public getTsvData(studentsList?: StudentAccount[]): string {
    const list = studentsList || this.getStudents();
    const headers = [
      'Student Roll ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Course / Program',
      'Course Type',
      'Branch / Campus',
      'College / University',
      'Qualification',
      'Joining Date',
      'Total Fees (INR)',
      'Paid Amount (INR)',
      'Balance Amount (INR)',
      'Account Status',
      'Login Access Ready',
    ];

    const rows = list.map((s) => [
      s?.student_id || '',
      s?.student_name || '',
      s?.email || '',
      s?.phone || '',
      s?.course_name || 'Professional Certification',
      (s?.course_type || 'training').toUpperCase(),
      s?.branch || s?.company_name || 'Sivakasi',
      s?.college_name || 'N/A',
      s?.qualification || 'N/A',
      s?.joining_date || '',
      s?.total_fees || 0,
      s?.paid_amount || 0,
      s?.balance_amount || 0,
      (s?.status || 'active').toUpperCase(),
      'YES (Active Login)',
    ]);

    return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
  }
}

export const studentAccountService = new StudentAccountService();

