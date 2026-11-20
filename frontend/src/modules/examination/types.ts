export type QuestionType =
  | 'mcq'
  | 'multiple_correct'
  | 'find_output'
  | 'true_false'
  | 'fill_blanks'
  | 'short_answer'
  | 'coding';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface ExamQuestion {
  id: string;
  test_id?: string;
  type: QuestionType;
  question_text: string;
  options?: string[]; // For mcq, multiple_correct, find_output, true_false
  correct_answer: any; // Single index, array of indices, boolean, string, or test cases
  marks: number;
  negative_marks?: number;
  code_snippet?: string; // Code block for find_output or starter code for coding
  coding_language?: string; // 'python' | 'javascript' | 'java' | 'cpp'
  test_cases?: TestCase[]; // For coding questions
  explanation?: string; // Solution breakdown & reasoning
  topic?: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  created_at?: string;
}

export interface CreditTier {
  min_percentage: number; // e.g. 90, 80, 70, 60, 50
  max_percentage: number; // e.g. 100, 89, 79, 69, 59
  credits: number; // e.g. 25, 20, 15, 10, 5
}

export type TestCategory = 'internal' | 'overall' | 'practice' | 'retake' | 'aptitude';

export type PublishingMode = 'instant' | 'pin_protected' | 'scheduled';

export interface AssessmentConfig {
  id: string;
  title: string;
  description: string;
  course_id: string;
  course_name: string;
  batch?: string; // 'All Batches' or specific batch name
  assigned_student_ids?: string[]; // Specific students if targeted
  category: TestCategory;
  month_number?: number; // e.g. 1 for Month 1, 2 for Month 2, 3 for Month 3, 4 for Month 4, etc.
  credit_category_id: string; // Linked credit rule e.g. 'month_1_test', 'month_2_test', 'fourth_month_test', 'monthly_test'
  duration_minutes: number;
  passing_percentage: number;
  negative_marking_per_question: number;
  total_marks: number;
  total_questions: number;
  credit_tiers: CreditTier[];
  publishing_mode: PublishingMode;
  secret_key?: string;
  is_secret_key_required: boolean;
  secret_key_expiry?: string;
  start_date?: string; // ISO string
  end_date?: string; // ISO string
  shuffle_questions: boolean;
  shuffle_options: boolean;
  auto_submit_on_timeout: boolean;
  max_attempts: number; // 1 for official, > 1 for practice
  max_violations: number; // Default 3 tab switches
  result_visibility: 'immediate' | 'scheduled';
  result_release_date?: string;
  is_answer_key_released?: boolean;
  answer_key_released_at?: string;
  answer_key_released_by?: string;
  is_retake_allowed: boolean;
  unlocked_student_ids?: string[]; // Admin override: List of student IDs manually unlocked by Admin/Staff
  created_by: string;
  creator_role: 'admin' | 'mentor';
  created_at: string;
  status: 'published' | 'scheduled' | 'draft' | 'archived';
  questions: ExamQuestion[];
}

// 5 exact colors requirement:
// Green: Answered
// Yellow: Marked for review
// Purple: Answered AND marked for review
// Grey: Visited but unanswered
// Blue: Not visited
export type PaletteStatus =
  | 'answered' // Green
  | 'marked_for_review' // Yellow
  | 'answered_and_marked' // Purple
  | 'unanswered' // Grey
  | 'not_visited'; // Blue

export interface AntiCheatingLog {
  timestamp: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'window_blur' | 'copy_paste_attempt';
  description: string;
}

export interface StudentAttempt {
  id: string;
  test_id: string;
  test_title: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  course_name: string;
  batch?: string;
  category: TestCategory;
  start_time: string;
  submitted_at?: string;
  answers: Record<string, any>; // question_id -> response
  question_statuses: Record<string, 'answered' | 'marked' | 'visited'>;
  marks_obtained: number;
  total_marks: number;
  score_percentage: number;
  is_passed: boolean;
  earned_credits: number;
  violations_count: number;
  violations_log: AntiCheatingLog[];
  status: 'in_progress' | 'submitted' | 'disqualified' | 'time_expired';
  retake_granted_by?: string;
}

export interface TopicAnalysis {
  topic: string;
  total_questions: number;
  correct_questions: number;
  percentage: number;
}
