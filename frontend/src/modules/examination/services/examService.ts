import {
  AssessmentConfig,
  ExamQuestion,
  StudentAttempt,
  CreditTier,
  AntiCheatingLog,
  QuestionType,
  TopicAnalysis,
} from '../types';
import { creditService } from '../../../services/creditService';
import api from '../../../api/client';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
}
import {
  getAllEngineQuestions,
  getEngineRandomQuestions,
  COURSE_TO_TOPICS_MAP,
  TOPIC_COUNTS,
} from './questionBankEngine';

export { COURSE_TO_TOPICS_MAP, TOPIC_COUNTS };

const STORAGE_ASSESSMENTS_KEY = 'wegrow_examination_assessments';
const STORAGE_QUESTION_BANK_KEY = 'wegrow_examination_question_bank';
const STORAGE_ATTEMPTS_KEY = 'wegrow_examination_attempts';
const STORAGE_IN_PROGRESS_PREFIX = 'wegrow_exam_progress_';

const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    delete memoryStorage[key];
  },
};

const safeDispatchEvent = (name: string, detail?: any): void => {
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (e) {}
};

export const DEFAULT_CREDIT_TIERS: CreditTier[] = [
  { min_percentage: 90, max_percentage: 100, credits: 15 },
  { min_percentage: 80, max_percentage: 89, credits: 12 },
  { min_percentage: 70, max_percentage: 79, credits: 10 },
  { min_percentage: 60, max_percentage: 69, credits: 8 },
  { min_percentage: 50, max_percentage: 59, credits: 0 },
];

export const calculateTiersFromPool = (poolCredits: number, minPassingPct = 60): CreditTier[] => {
  const p = Math.max(0, Number(poolCredits) || 0);
  if (p === 0) {
    return [
      { min_percentage: 90, max_percentage: 100, credits: 0 },
      { min_percentage: 80, max_percentage: 89, credits: 0 },
      { min_percentage: 70, max_percentage: 79, credits: 0 },
      { min_percentage: 60, max_percentage: 69, credits: 0 },
      { min_percentage: 50, max_percentage: 59, credits: 0 },
    ];
  }

  return [
    { min_percentage: 90, max_percentage: 100, credits: p },
    { min_percentage: 80, max_percentage: 89, credits: Math.max(0, Math.round(p * 0.8)) },
    { min_percentage: 70, max_percentage: 79, credits: Math.max(0, Math.round(p * 0.65)) },
    {
      min_percentage: 60,
      max_percentage: 69,
      credits: minPassingPct <= 69 ? Math.max(0, Math.round(p * (minPassingPct <= 60 ? 0.5 : 0.4))) : 0,
    },
    {
      min_percentage: 50,
      max_percentage: 59,
      credits: minPassingPct <= 59 ? Math.max(0, Math.round(p * 0.35)) : 0,
    },
  ];
};

export interface CourseCategoryGroup {
  category: string;
  courses: string[];
}

export const CATEGORIZED_COURSES: CourseCategoryGroup[] = [
  {
    category: 'Artificial Intelligence & Python',
    courses: [
      'AI Python Full Stack Program',
      'AI Java Program',
      'AI Video',
      'Full Stack AI',
      'Advanced Python',
      'Basic Python',
      'Intern AI Python',
      'LLM Generative AI Basics',
      'LLM Generative AI Advanced',
      'LLM Generative AI Basics to Advanced',
      'LLM Prompt Engineering Basics',
      'LLM Prompt Engineering Intermediate',
    ],
  },
  {
    category: 'Data Science & Analytics',
    courses: [
      'Data Science',
      'Data Analytics',
    ],
  },
  {
    category: 'Full-Stack Web & Software Engineering',
    courses: [
      'MERN Stack Development',
      'Web Tech',
      'Advanced Java',
      'Core Java',
      'Core PHP',
      'Intern Java',
      'Intern PHP Full Stack',
      'Software Testing (Manual & Automation)',
      'C Programming',
    ],
  },
  {
    category: 'Mobile Application Development',
    courses: [
      'Flutter Basic',
      'Flutter Intermediate',
      'Flutter Expert',
    ],
  },
  {
    category: 'Cybersecurity & Networking',
    courses: [
      'Cybersecurity Ethical Hacking Basic',
      'Cybersecurity Ethical Hacking Intermediate',
      'Cybersecurity Ethical Hacking Expert',
    ],
  },
  {
    category: 'Design, Media & Digital Marketing',
    courses: [
      'UI / UX Design',
      'Digital Marketing Basic SMM',
      'Digital Marketing Intermediate',
      'Digital Marketing Expert',
      'Intern Digital Marketing',
      'Video Creation',
      'Photoshop, CorelDraw & Illustrator',
    ],
  },
  {
    category: 'Business, Accounting & Healthcare',
    courses: [
      'Accounting Software Tally PRIME',
      'Office Automation (MS Office & Tally)',
      'Professional English Communication Skills',
      'Medical Coding',
    ],
  },
];

export const RICH_SEED_QUESTIONS: ExamQuestion[] = [
  // 1. Data Structures & Algorithms
  {
    id: 'qb-dsa-1',
    type: 'mcq',
    question_text: 'Which data structure follows the Last-In First-Out (LIFO) principle?',
    options: ['Queue', 'Stack', 'Binary Tree', 'Linked List'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 1,
    topic: 'Data Structures',
    difficulty: 'easy',
    explanation: 'A Stack strictly adheres to LIFO: elements added last are popped first.',
  },
  {
    id: 'qb-dsa-2',
    type: 'mcq',
    question_text: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 1,
    topic: 'Data Structures',
    difficulty: 'medium',
    explanation: 'Balanced BSTs halve search space at each level, achieving O(log n) average time complexity.',
  },
  {
    id: 'qb-dsa-3',
    type: 'short_answer',
    question_text: 'What is the worst-case time complexity of standard QuickSort algorithm? (Format: O(n^2))',
    correct_answer: 'O(n^2)',
    marks: 5,
    negative_marks: 0,
    topic: 'Algorithms',
    difficulty: 'hard',
    explanation: 'When pivots are worst-chosen (e.g. already sorted array with last element pivot), QuickSort degrades to O(n^2).',
  },
  {
    id: 'qb-dsa-4',
    type: 'coding',
    question_text: 'Write a Python function `two_sum(nums, target)` that returns the indices of two numbers in `nums` that add up to `target`.',
    code_snippet: `def two_sum(nums, target):
    # Complete the function
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []`,
    coding_language: 'python',
    test_cases: [
      { input: 'nums = [2, 7, 11, 15], target = 9', expected_output: '[0, 1]' },
      { input: 'nums = [3, 2, 4], target = 6', expected_output: '[1, 2]' },
      { input: 'nums = [3, 3], target = 6', expected_output: '[0, 1]', is_hidden: true },
    ],
    correct_answer: 'hash_map_lookup',
    marks: 10,
    negative_marks: 0,
    topic: 'Algorithms',
    difficulty: 'hard',
    explanation: 'Using a hash map allows single-pass O(n) lookup time for the complement.',
  },

  // 2. Python Core
  {
    id: 'qb-py-1',
    type: 'find_output',
    question_text: 'What is the output of the following Python snippet?',
    code_snippet: `x = [1, 2, 3]
y = x
y.append(4)
print(len(x))`,
    coding_language: 'python',
    options: ['3', '4', 'Error', 'None'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 1,
    topic: 'Python Core',
    difficulty: 'medium',
    explanation: 'List assignment in Python copies the object reference. Mutating y mutates x, so len(x) is 4.',
  },
  {
    id: 'qb-py-2',
    type: 'true_false',
    question_text: 'In Python, strings are mutable objects and their characters can be modified in-place.',
    options: ['True', 'False'],
    correct_answer: 1, // False
    marks: 5,
    negative_marks: 0,
    topic: 'Python Core',
    difficulty: 'easy',
    explanation: 'Python strings are strictly immutable. Any modification creates a new string object.',
  },
  {
    id: 'qb-py-3',
    type: 'fill_blanks',
    question_text: 'The keyword used to turn a regular Python function into a generator function is ________.',
    options: ['yield', 'return', 'gen', 'async'],
    correct_answer: 'yield',
    marks: 5,
    negative_marks: 0,
    topic: 'Python Core',
    difficulty: 'medium',
    explanation: 'The `yield` keyword pauses execution and yields values one at a time, creating a generator iterator.',
  },
  {
    id: 'qb-py-4',
    type: 'find_output',
    question_text: 'What does the following list comprehension evaluate to in Python?',
    code_snippet: `nums = [1, 2, 3, 4, 5]
res = [x * 2 for x in nums if x % 2 == 0]
print(res)`,
    coding_language: 'python',
    options: ['[2, 4, 6, 8, 10]', '[4, 8]', '[2, 6, 10]', '[4, 16]'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 1,
    topic: 'Python Core',
    difficulty: 'medium',
    explanation: 'The filter `x % 2 == 0` keeps 2 and 4. Doubling them yields [4, 8].',
  },
  {
    id: 'qb-py-5',
    type: 'multiple_correct',
    question_text: 'Which of the following built-in collection types in Python are mutable?',
    options: ['List (list)', 'Tuple (tuple)', 'Dictionary (dict)', 'Set (set)', 'String (str)'],
    correct_answer: [0, 2, 3], // list, dict, set
    marks: 5,
    negative_marks: 0,
    topic: 'Python Core',
    difficulty: 'medium',
    explanation: 'Lists, dictionaries, and sets can have their contents altered in-place. Tuples and strings are immutable.',
  },

  // 3. Web Development & Architecture
  {
    id: 'qb-web-1',
    type: 'multiple_correct',
    question_text: 'Select ALL valid HTTP status codes that represent a successful client request:',
    options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified', '400 Bad Request'],
    correct_answer: [0, 1, 2],
    marks: 5,
    negative_marks: 0,
    topic: 'Web Development',
    difficulty: 'medium',
    explanation: '200, 201, and 204 are 2xx success statuses. 304 is redirection and 400 is client error.',
  },
  {
    id: 'qb-web-2',
    type: 'true_false',
    question_text: 'In JavaScript, the "===" operator checks both value and type without type coercion.',
    options: ['True', 'False'],
    correct_answer: 0, // True
    marks: 5,
    negative_marks: 0,
    topic: 'Web Development',
    difficulty: 'easy',
    explanation: '=== is the strict equality operator in JavaScript, checking value and type without coercion.',
  },
  {
    id: 'qb-web-3',
    type: 'mcq',
    question_text: 'Which CSS layout module is best suited for two-dimensional grid layouts with rows and columns?',
    options: ['Flexbox', 'CSS Grid', 'Float', 'Absolute Positioning'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 0,
    topic: 'Web Development',
    difficulty: 'easy',
    explanation: 'CSS Grid is specifically designed for 2D layouts (rows + columns), whereas Flexbox is 1D (row or column).',
  },

  // 4. Databases & SQL
  {
    id: 'qb-db-1',
    type: 'fill_blanks',
    question_text: 'In SQL, the DDL command used to remove all records from a table without logging individual row deletions is ________.',
    options: ['TRUNCATE', 'DELETE', 'DROP', 'ALTER'],
    correct_answer: 'TRUNCATE',
    marks: 5,
    negative_marks: 0,
    topic: 'Databases',
    difficulty: 'medium',
    explanation: 'TRUNCATE TABLE deallocates pages directly, resetting the table much faster than DELETE.',
  },
  {
    id: 'qb-db-2',
    type: 'mcq',
    question_text: 'In database transaction theory, what property guarantees that all operations within a transaction succeed or all fail together?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correct_answer: 0,
    marks: 5,
    negative_marks: 1,
    topic: 'Databases',
    difficulty: 'medium',
    explanation: 'Atomicity ensures "all or nothing" execution of transactions.',
  },
  {
    id: 'qb-db-3',
    type: 'find_output',
    question_text: 'In SQL, what is returned by `SELECT COUNT(*) FROM students WHERE marks IS NULL;` if 3 students have null marks?',
    options: ['0', '3', 'NULL', 'Error'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 0,
    topic: 'Databases',
    difficulty: 'easy',
    explanation: 'COUNT(*) counts rows matching the predicate, so exactly 3 is returned.',
  },

  // 5. Cloud & DevOps
  {
    id: 'qb-cloud-1',
    type: 'mcq',
    question_text: 'In Docker, which command is used to build a container image from a Dockerfile in the current directory?',
    options: ['docker run .', 'docker build -t app .', 'docker create image', 'docker pull .'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 0,
    topic: 'Cloud & DevOps',
    difficulty: 'easy',
    explanation: '`docker build -t app .` builds an image tagged `app` from the Dockerfile in the current directory.',
  },
  {
    id: 'qb-cloud-2',
    type: 'true_false',
    question_text: 'A stateless microservice stores user session data directly in local container memory.',
    options: ['True', 'False'],
    correct_answer: 1, // False
    marks: 5,
    negative_marks: 0,
    topic: 'Cloud & DevOps',
    difficulty: 'medium',
    explanation: 'Stateless services do not store session data in memory; they offload state to distributed caches like Redis.',
  },

  // 6. Machine Learning & AI
  {
    id: 'qb-ml-1',
    type: 'mcq',
    question_text: 'Which metric is most sensitive to outliers and extreme prediction errors in regression tasks?',
    options: ['MAE (Mean Absolute Error)', 'MSE (Mean Squared Error)', 'R-squared', 'Accuracy'],
    correct_answer: 1,
    marks: 5,
    negative_marks: 0,
    topic: 'Machine Learning',
    difficulty: 'medium',
    explanation: 'MSE squares error distances, heavily penalizing large outliers compared to MAE.',
  },
  {
    id: 'qb-ml-2',
    type: 'short_answer',
    question_text: 'What algorithm is used to compute gradients of the loss function with respect to weights in deep neural networks? (Answer: Backpropagation)',
    correct_answer: 'Backpropagation',
    marks: 5,
    negative_marks: 0,
    topic: 'Machine Learning',
    difficulty: 'medium',
    explanation: 'Backpropagation utilizes the chain rule of calculus to compute weight gradients efficiently.',
  },

  // 7. Java Core & OOP
  {
    id: 'qb-java-1',
    type: 'mcq',
    question_text: 'In Java, which keyword is used to prevent a class from being subclassed (inherited)?',
    options: ['static', 'final', 'abstract', 'sealed'],
    correct_answer: 1, // final
    marks: 5,
    negative_marks: 1,
    topic: 'Java Core',
    difficulty: 'easy',
    explanation: 'The `final` keyword applied to a class declaration prevents any subclass from extending it.',
  },
  {
    id: 'qb-java-2',
    type: 'true_false',
    question_text: 'In Java, a class can directly inherit multiple classes using multiple `extends` declarations.',
    options: ['True', 'False'],
    correct_answer: 1, // False
    marks: 5,
    negative_marks: 0,
    topic: 'Java Core',
    difficulty: 'easy',
    explanation: 'Java does not support multiple inheritance with classes to avoid the diamond problem; it supports multiple interfaces instead.',
  },

  // 8. C Programming & Memory
  {
    id: 'qb-c-1',
    type: 'find_output',
    question_text: 'What is the output of the following C code snippet?',
    code_snippet: `#include <stdio.h>
int main() {
    int a = 10;
    int *p = &a;
    *p += 5;
    printf("%d", a);
    return 0;
}`,
    coding_language: 'c',
    options: ['10', '15', 'Garbage Value', 'Compilation Error'],
    correct_answer: 1, // 15
    marks: 5,
    negative_marks: 1,
    topic: 'C Programming',
    difficulty: 'medium',
    explanation: 'Dereferencing pointer `*p += 5` directly modifies the memory address of `a`, changing `a` from 10 to 15.',
  },

  // 9. LLM & Generative AI
  {
    id: 'qb-ai-1',
    type: 'fill_blanks',
    question_text: 'When prompting an LLM with few input-output demonstrations before asking for the target completion, this technique is called ________-shot prompting.',
    options: ['few', 'zero', 'chain', 'meta'],
    correct_answer: 'few',
    marks: 5,
    negative_marks: 0,
    topic: 'Generative AI',
    difficulty: 'easy',
    explanation: 'Few-shot prompting provides 2 to 5 exemplar input-output pairs to guide the model format and reasoning style.',
  },

  // 10. Cybersecurity & App Security
  {
    id: 'qb-sec-1',
    type: 'true_false',
    question_text: 'Using parameterized queries (prepared statements) is one of the most effective ways to prevent SQL Injection vulnerabilities.',
    options: ['True', 'False'],
    correct_answer: 0, // True
    marks: 5,
    negative_marks: 0,
    topic: 'Cybersecurity',
    difficulty: 'easy',
    explanation: 'Prepared statements treat user input strictly as literal values rather than executable SQL commands, preventing SQLi.',
  },

  // 11. Git & Version Control
  {
    id: 'qb-git-1',
    type: 'short_answer',
    question_text: 'Which Git command is used to record staged changes to the repository history? (Answer: git commit)',
    correct_answer: 'git commit',
    marks: 5,
    negative_marks: 0,
    topic: 'Cloud & DevOps',
    difficulty: 'easy',
    explanation: '`git commit` creates a new commit snapshot containing all staged file modifications.',
  },
];

const SEED_ASSESSMENTS: AssessmentConfig[] = [
  {
    id: 'exam-001',
    title: 'Python Full-Stack & Algorithm Evaluation',
    description: 'Comprehensive monthly internal assessment covering core Python, algorithms, relational databases, and REST APIs.',
    course_id: 'course-py',
    course_name: 'AI Python Full Stack',
    batch: 'All Batches (Global - All Students)',
    category: 'internal',
    credit_category_id: 'monthly_test',
    duration_minutes: 30,
    passing_percentage: 60,
    negative_marking_per_question: 1,
    total_marks: 40,
    total_questions: 7,
    credit_tiers: DEFAULT_CREDIT_TIERS,
    publishing_mode: 'instant',
    secret_key: 'WEGROW-2026',
    is_secret_key_required: false,
    start_date: new Date(Date.now() - 3600000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    shuffle_questions: true,
    shuffle_options: true,
    auto_submit_on_timeout: true,
    max_attempts: 1,
    max_violations: 3,
    result_visibility: 'immediate',
    is_answer_key_released: true, // Immediate mode: visible after test completed
    is_retake_allowed: false,
    created_by: 'Admin / Faculty Head',
    creator_role: 'admin',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status: 'published',
    questions: RICH_SEED_QUESTIONS.slice(0, 7),
  },
  {
    id: 'exam-002',
    title: '4th Month Overall Comprehensive Assessment',
    description: 'High-stakes semester benchmark test evaluating end-to-end full stack architecture, data structures, and system design.',
    course_id: 'course-py',
    course_name: 'AI Python Full Stack',
    batch: 'Batch 2026-Alpha (Full-Time Morning)',
    category: 'overall',
    credit_category_id: 'fourth_month_test',
    duration_minutes: 45,
    passing_percentage: 65,
    negative_marking_per_question: 1,
    total_marks: 40,
    total_questions: 7,
    credit_tiers: [
      { min_percentage: 90, max_percentage: 100, credits: 50 },
      { min_percentage: 80, max_percentage: 89, credits: 40 },
      { min_percentage: 70, max_percentage: 79, credits: 30 },
      { min_percentage: 60, max_percentage: 69, credits: 20 },
      { min_percentage: 50, max_percentage: 59, credits: 10 },
    ],
    publishing_mode: 'pin_protected',
    secret_key: 'PIN-9842',
    is_secret_key_required: true,
    secret_key_expiry: new Date(Date.now() + 86400000 * 3).toISOString(),
    start_date: new Date(Date.now() - 1800000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    shuffle_questions: true,
    shuffle_options: true,
    auto_submit_on_timeout: true,
    max_attempts: 1,
    max_violations: 3,
    result_visibility: 'immediate',
    is_answer_key_released: true, // Immediate mode: visible after test completed
    is_retake_allowed: false,
    created_by: 'Senior Mentor Karthik',
    creator_role: 'mentor',
    created_at: new Date(Date.now() - 43200000).toISOString(),
    status: 'published',
    questions: RICH_SEED_QUESTIONS.slice(0, 7),
  },
  {
    id: 'exam-003',
    title: 'Python Practice & Self-Assessment Sandbox',
    description: 'Unlimited attempts practice mock test with instant question explanations and detailed algorithmic walk-through.',
    course_id: 'course-py',
    course_name: 'AI Python Full Stack',
    batch: 'All Batches (Global - All Students)',
    category: 'practice',
    credit_category_id: 'practice_test',
    duration_minutes: 20,
    passing_percentage: 50,
    negative_marking_per_question: 0,
    total_marks: 40,
    total_questions: 7,
    credit_tiers: [
      { min_percentage: 90, max_percentage: 100, credits: 0 },
      { min_percentage: 80, max_percentage: 89, credits: 0 },
      { min_percentage: 70, max_percentage: 79, credits: 0 },
      { min_percentage: 60, max_percentage: 69, credits: 0 },
      { min_percentage: 50, max_percentage: 59, credits: 0 },
    ],
    publishing_mode: 'instant',
    is_secret_key_required: false,
    start_date: new Date(Date.now() - 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    shuffle_questions: false,
    shuffle_options: false,
    auto_submit_on_timeout: true,
    max_attempts: 99,
    max_violations: 5,
    result_visibility: 'immediate',
    is_answer_key_released: true, // Practice Sandbox has solutions available
    is_retake_allowed: true,
    created_by: 'Staff Instructor Priya',
    creator_role: 'mentor',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    status: 'published',
    questions: RICH_SEED_QUESTIONS.slice(0, 7),
  },
  {
    id: 'exam-004',
    title: 'Advanced Machine Learning & Neural Networks',
    description: 'Scheduled examination for senior batch on backpropagation, loss functions, and PyTorch tensors.',
    course_id: 'course-ds',
    course_name: 'Data Science & Machine Learning',
    batch: 'Batch 2026-Beta (Full-Time Afternoon)',
    category: 'internal',
    credit_category_id: 'monthly_test',
    duration_minutes: 40,
    passing_percentage: 60,
    negative_marking_per_question: 0.5,
    total_marks: 30,
    total_questions: 5,
    credit_tiers: DEFAULT_CREDIT_TIERS,
    publishing_mode: 'scheduled',
    is_secret_key_required: false,
    start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    shuffle_questions: true,
    shuffle_options: true,
    auto_submit_on_timeout: true,
    max_attempts: 1,
    max_violations: 3,
    result_visibility: 'scheduled',
    result_release_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    is_answer_key_released: false, // Sealed until Admin/Mentor releases
    is_retake_allowed: false,
    created_by: 'Dr. Ramesh Kumar',
    creator_role: 'admin',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'scheduled',
    questions: RICH_SEED_QUESTIONS.slice(7, 12),
  },
  {
    id: 'exam-005',
    title: 'Comprehensive Campus Placement Aptitude Assessment',
    description: 'All-India company placement screening test covering Quantitative Aptitude, Logical Reasoning, and Verbal Ability (0 Credits Placement Benchmark).',
    course_id: 'course-global',
    course_name: 'All Courses (Global Assessment)',
    batch: 'All Batches (Global - All Students)',
    category: 'aptitude',
    credit_category_id: 'practice_test',
    duration_minutes: 45,
    passing_percentage: 60,
    negative_marking_per_question: 0,
    total_marks: 100,
    total_questions: 30,
    credit_tiers: [
      { min_percentage: 90, max_percentage: 100, credits: 0 },
      { min_percentage: 80, max_percentage: 89, credits: 0 },
      { min_percentage: 70, max_percentage: 79, credits: 0 },
      { min_percentage: 60, max_percentage: 69, credits: 0 },
      { min_percentage: 50, max_percentage: 59, credits: 0 },
    ],
    publishing_mode: 'instant',
    is_secret_key_required: false,
    start_date: new Date(Date.now() - 3600000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    shuffle_questions: true,
    shuffle_options: true,
    auto_submit_on_timeout: true,
    max_attempts: 1,
    max_violations: 3,
    result_visibility: 'immediate',
    is_answer_key_released: true, // Immediate mode: visible after test completed
    is_retake_allowed: false,
    created_by: 'Placement Cell & Examination Board',
    creator_role: 'admin',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    status: 'published',
    questions: [
      ...getEngineRandomQuestions({ topic: 'Aptitude', subtopic: 'Quantitative Aptitude', count: 10 }),
      ...getEngineRandomQuestions({ topic: 'Aptitude', subtopic: 'Logical Reasoning', count: 10 }),
      ...getEngineRandomQuestions({ topic: 'Aptitude', subtopic: 'Verbal Ability', count: 10 }),
    ],
  },
];

export const examService = {
  // 1. Assessment Management
  getAssessments(): AssessmentConfig[] {
    try {
      const stored = safeStorage.getItem(STORAGE_ASSESSMENTS_KEY);
      if (stored) {
        let parsed: AssessmentConfig[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If no aptitude assessment is present in existing storage, inject seed aptitude exam
          const hasAptitude = parsed.some((a) => a.category === 'aptitude');
          if (!hasAptitude) {
            const aptSeed = SEED_ASSESSMENTS.find((a) => a.category === 'aptitude');
            if (aptSeed) {
              parsed = [aptSeed, ...parsed];
              safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(parsed));
            }
          }

          // Auto-sanitize: Instant broadcast tests never require a secret key; practice and aptitude tests have 0 credits
          return parsed.map((a) => {
            const copy = { ...a };
            if (copy.publishing_mode === 'instant') {
              copy.is_secret_key_required = false;
            }
            if (copy.category === 'practice' || copy.category === 'aptitude') {
              copy.credit_tiers = [
                { min_percentage: 90, max_percentage: 100, credits: 0 },
                { min_percentage: 80, max_percentage: 89, credits: 0 },
                { min_percentage: 70, max_percentage: 79, credits: 0 },
                { min_percentage: 60, max_percentage: 69, credits: 0 },
                { min_percentage: 50, max_percentage: 59, credits: 0 },
              ];
            }
            if (copy.is_answer_key_released === undefined) {
              copy.is_answer_key_released = copy.result_visibility !== 'scheduled';
            }
            return copy;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load assessments', e);
    }
    safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(SEED_ASSESSMENTS));
    return SEED_ASSESSMENTS;
  },

  getAssessmentById(id: string): AssessmentConfig | null {
    const list = this.getAssessments();
    return list.find((a) => a.id === id) || null;
  },

  saveAssessment(config: AssessmentConfig): AssessmentConfig {
    const cleanConfig: AssessmentConfig = { ...config };
    if (cleanConfig.publishing_mode === 'instant') {
      cleanConfig.is_secret_key_required = false;
      cleanConfig.secret_key = undefined;
    }
    if (cleanConfig.category === 'practice') {
      cleanConfig.credit_tiers = [
        { min_percentage: 90, max_percentage: 100, credits: 0 },
        { min_percentage: 80, max_percentage: 89, credits: 0 },
        { min_percentage: 70, max_percentage: 79, credits: 0 },
        { min_percentage: 60, max_percentage: 69, credits: 0 },
        { min_percentage: 50, max_percentage: 59, credits: 0 },
      ];
    }
    if (cleanConfig.result_visibility === 'immediate' && cleanConfig.is_answer_key_released === undefined) {
      cleanConfig.is_answer_key_released = true;
    } else if (cleanConfig.result_visibility === 'scheduled' && cleanConfig.is_answer_key_released === undefined) {
      cleanConfig.is_answer_key_released = false;
    }

    const list = this.getAssessments();
    const existingIdx = list.findIndex((a) => a.id === cleanConfig.id);
    let updatedList: AssessmentConfig[];
    if (existingIdx >= 0) {
      updatedList = [...list];
      updatedList[existingIdx] = cleanConfig;
    } else {
      updatedList = [cleanConfig, ...list];
    }
    safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(updatedList));
    safeDispatchEvent('wegrow_assessments_updated');
    return cleanConfig;
  },

  updateAssessment(id: string, updates: Partial<AssessmentConfig>): AssessmentConfig | null {
    const list = this.getAssessments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const updated: AssessmentConfig = {
      ...list[idx],
      ...updates,
    };
    list[idx] = updated;
    safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(list));
    safeDispatchEvent('wegrow_assessments_updated');
    return updated;
  },

  deleteAssessment(id: string): void {
    const list = this.getAssessments();
    const filtered = list.filter((a) => a.id !== id);
    safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(filtered));
    safeDispatchEvent('wegrow_assessments_updated');
  },

  async fetchAssessmentsApi(): Promise<AssessmentConfig[]> {
    try {
      const res = await api.get('/tests/sets');
      const raw = res.data?.data || res.data;
      if (Array.isArray(raw) && raw.length > 0) {
        const localList = this.getAssessments();
        const mappedBackend: AssessmentConfig[] = raw.map((item: any) => ({
          id: item._id || item.id,
          title: item.title || item.set_name || 'Assessment',
          description: item.description || '',
          course_id: item.course_id?._id || item.course_id || 'course-gen',
          course_name: item.course_id?.course_name || item.course_name || 'General Course',
          batch: item.batch || 'All Batches',
          category: item.category || 'internal',
          month_number: item.month_number || 1,
          credit_category_id: item.credit_category_id || 'monthly_test',
          duration_minutes: item.duration_minutes || 30,
          passing_percentage: item.pass_percentage || item.passing_percentage || 60,
          negative_marking_per_question: item.negative_marking_per_question || 0,
          total_marks: item.total_marks || 0,
          total_questions: item.total_questions || 0,
          credit_tiers: item.credit_tiers && item.credit_tiers.length > 0 ? item.credit_tiers : DEFAULT_CREDIT_TIERS,
          publishing_mode: item.publishing_mode || 'instant',
          secret_key: item.secret_key,
          is_secret_key_required: item.is_secret_key_required ?? false,
          start_date: item.start_date,
          end_date: item.end_date,
          result_release_date: item.result_release_date,
          shuffle_questions: item.shuffle_questions ?? true,
          shuffle_options: item.shuffle_options ?? true,
          auto_submit_on_timeout: item.auto_submit_on_timeout ?? true,
          max_attempts: item.max_attempts || 1,
          max_violations: item.max_violations || 3,
          result_visibility: item.result_visibility || 'immediate',
          is_answer_key_released: item.is_answer_key_released ?? false,
          answer_key_released_at: item.answer_key_released_at,
          answer_key_released_by: item.answer_key_released_by,
          is_retake_allowed: item.is_retake_allowed ?? false,
          created_by: item.created_by || 'Administrator / Mentor',
          creator_role: item.creator_role || 'admin',
          created_at: item.createdAt || item.created_at || new Date().toISOString(),
          status: item.status === 1 ? 'published' : (item.status || 'published'),
          questions: item.questions || [],
        }));

        const backendIds = new Set(mappedBackend.map((b) => b.id));
        const combined = [...mappedBackend, ...localList.filter((l) => !backendIds.has(l.id))];
        safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(combined));
        safeDispatchEvent('wegrow_assessments_updated');
        return combined;
      }
    } catch (err) {
      console.warn('Backend fetch /tests/sets failed, using local assessments:', err);
    }
    return this.getAssessments();
  },

  async saveAssessmentApi(config: AssessmentConfig): Promise<AssessmentConfig> {
    const localSaved = this.saveAssessment(config);
    try {
      const payload: any = {
        title: config.title,
        set_name: config.title,
        description: config.description,
        batch: config.batch,
        category: config.category,
        month_number: config.month_number,
        credit_category_id: config.credit_category_id,
        duration_minutes: config.duration_minutes,
        pass_percentage: config.passing_percentage,
        negative_marking_per_question: config.negative_marking_per_question,
        total_marks: config.total_marks,
        total_questions: config.total_questions,
        credit_tiers: config.credit_tiers,
        publishing_mode: config.publishing_mode,
        secret_key: config.secret_key,
        is_secret_key_required: config.is_secret_key_required,
        start_date: config.start_date,
        end_date: config.end_date,
        result_release_date: config.result_release_date,
        shuffle_questions: config.shuffle_questions,
        shuffle_options: config.shuffle_options,
        max_attempts: config.max_attempts,
        max_violations: config.max_violations,
        result_visibility: config.result_visibility,
        is_answer_key_released: config.is_answer_key_released,
        questions: config.questions,
      };

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(config.id);
      if (isObjectId) {
        await api.put(`/tests/sets/${config.id}`, payload);
      } else {
        const res = await api.post('/tests/sets', payload);
        const createdId = res.data?._id || res.data?.id;
        if (createdId) {
          localSaved.id = createdId;
          const list = this.getAssessments();
          const idx = list.findIndex((a) => a.id === config.id);
          if (idx >= 0) {
            list[idx] = localSaved;
            safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(list));
            safeDispatchEvent('wegrow_assessments_updated');
          }
        }
      }
    } catch (err) {
      console.warn('Failed to sync assessment to backend /tests/sets:', err);
    }
    return localSaved;
  },

  async deleteAssessmentApi(id: string): Promise<void> {
    this.deleteAssessment(id);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isObjectId) {
      try {
        await api.delete(`/tests/sets/${id}`);
      } catch (err) {
        console.warn('Failed to delete assessment from backend /tests/sets:', err);
      }
    }
  },

  async toggleAnswerKeyReleaseApi(id: string, forceStatus?: boolean, releasedBy?: string): Promise<AssessmentConfig | null> {
    const updated = this.toggleAnswerKeyRelease(id, forceStatus, releasedBy);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isObjectId && updated) {
      try {
        await api.patch(`/tests/sets/${id}/release-answer-key`, {
          released: updated.is_answer_key_released,
        });
      } catch (err) {
        console.warn('Failed to sync answer key release to backend:', err);
      }
    }
    return updated;
  },

  // Toggle or set Answer Key release permission for students (Admin/Mentor only)
  toggleAnswerKeyRelease(id: string, forceStatus?: boolean, releasedBy?: string): AssessmentConfig | null {
    const list = this.getAssessments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const current = list[idx];
    const newState = forceStatus !== undefined ? forceStatus : !current.is_answer_key_released;
    const updated: AssessmentConfig = {
      ...current,
      is_answer_key_released: newState,
      answer_key_released_at: newState ? new Date().toISOString() : undefined,
      answer_key_released_by: newState ? (releasedBy || 'Admin / Mentor') : undefined,
    };
    list[idx] = updated;
    safeStorage.setItem(STORAGE_ASSESSMENTS_KEY, JSON.stringify(list));
    safeDispatchEvent('wegrow_assessments_updated');
    return updated;
  },

  // 2. Centralized Question Bank (6,800+ Questions: HTML 1000, CSS 1000, JS 1000, React 1000, Python 1000, Java 1000, etc.)
  getQuestionBank(): ExamQuestion[] {
    const engineQuestions = getAllEngineQuestions();
    try {
      const customStored = safeStorage.getItem('wegrow_exam_custom_questions');
      const deletedStored = safeStorage.getItem('wegrow_exam_deleted_ids');
      const deletedSet = new Set<string>(deletedStored ? JSON.parse(deletedStored) : []);
      let result = engineQuestions.filter((q) => !deletedSet.has(q.id));
      if (customStored) {
        const custom = JSON.parse(customStored);
        if (Array.isArray(custom)) {
          const activeCustom = custom.filter((q) => !deletedSet.has(q.id));
          result = [...activeCustom, ...result];
        }
      }
      return result;
    } catch (e) {
      console.error('Failed to load custom question bank items', e);
      return engineQuestions;
    }
  },

  resetQuestionBank(): ExamQuestion[] {
    try {
      safeStorage.removeItem('wegrow_exam_custom_questions');
      safeStorage.removeItem('wegrow_exam_deleted_ids');
      safeStorage.removeItem(STORAGE_QUESTION_BANK_KEY);
    } catch (e) {}
    return getAllEngineQuestions();
  },

  saveQuestionToBank(question: ExamQuestion): ExamQuestion {
    try {
      const customStored = safeStorage.getItem('wegrow_exam_custom_questions');
      const custom: ExamQuestion[] = customStored ? JSON.parse(customStored) : [];
      const idx = custom.findIndex((q) => q.id === question.id);
      if (idx >= 0) {
        custom[idx] = question;
      } else {
        custom.unshift(question);
      }
      safeStorage.setItem('wegrow_exam_custom_questions', JSON.stringify(custom));
    } catch (e) {
      console.error('Failed to save question to bank', e);
    }
    return question;
  },

  deleteQuestionFromBank(id: string): void {
    try {
      const deletedStored = safeStorage.getItem('wegrow_exam_deleted_ids');
      const deleted: string[] = deletedStored ? JSON.parse(deletedStored) : [];
      if (!deleted.includes(id)) {
        deleted.push(id);
        safeStorage.setItem('wegrow_exam_deleted_ids', JSON.stringify(deleted));
      }
      const customStored = safeStorage.getItem('wegrow_exam_custom_questions');
      if (customStored) {
        const custom: ExamQuestion[] = JSON.parse(customStored);
        const filtered = custom.filter((q) => q.id !== id);
        safeStorage.setItem('wegrow_exam_custom_questions', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('Failed to delete question from bank', e);
    }
  },

  getRandomQuestionsFromBank(criteria: { topic?: string; subtopic?: string; course?: string; difficulty?: string; count: number }): ExamQuestion[] {
    return getEngineRandomQuestions(criteria);
  },

  // 3. Secret PIN / Access Key Verification
  verifySecretKey(testId: string, inputKey: string): { valid: boolean; message: string } {
    const test = this.getAssessmentById(testId);
    if (!test) return { valid: false, message: 'Assessment not found' };
    if (!test.is_secret_key_required) return { valid: true, message: 'Key not required' };

    if (test.secret_key_expiry && new Date() > new Date(test.secret_key_expiry)) {
      return { valid: false, message: 'This examination secret key has expired. Please contact your mentor.' };
    }

    if ((test.secret_key || '').trim().toUpperCase() === (inputKey || '').trim().toUpperCase()) {
      return { valid: true, message: 'Access granted' };
    }
    return { valid: false, message: 'Invalid secret access key. Please verify with your mentor.' };
  },

  // 4. Student Examination Taking & Auto-Save
  getSavedExamProgress(attemptId: string): any | null {
    try {
      const data = safeStorage.getItem(`${STORAGE_IN_PROGRESS_PREFIX}${attemptId}`);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to get saved progress', e);
    }
    return null;
  },

  saveExamProgress(attemptId: string, state: any): void {
    try {
      safeStorage.setItem(`${STORAGE_IN_PROGRESS_PREFIX}${attemptId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save progress', e);
    }
  },

  clearSavedExamProgress(attemptId: string): void {
    safeStorage.removeItem(`${STORAGE_IN_PROGRESS_PREFIX}${attemptId}`);
  },

  // 5. Anti-Cheating Violation Logger
  logViolation(attemptId: string, type: AntiCheatingLog['type'], description: string): number {
    const attempts = this.getAllAttempts();
    const att = attempts.find((a) => a.id === attemptId);
    if (!att) return 0;

    const log: AntiCheatingLog = {
      timestamp: new Date().toISOString(),
      type,
      description,
    };
    att.violations_log = [...(att.violations_log || []), log];
    att.violations_count = (att.violations_count || 0) + 1;

    this.saveAttempt(att);
    safeDispatchEvent('wegrow_exam_violation', { attemptId, violationCount: att.violations_count });
    return att.violations_count;
  },

  // 6. Exam Evaluation & Tiered Credit Awarding
  submitExam(
    attemptId: string,
    answers: Record<string, any>,
    questionStatuses: Record<string, 'answered' | 'marked' | 'visited'>,
    disqualifiedDueToViolations = false,
  ): StudentAttempt {
    const attempts = this.getAllAttempts();
    const attIndex = attempts.findIndex((a) => a.id === attemptId);
    if (attIndex === -1) {
      throw new Error('Attempt record not found');
    }
    const att = attempts[attIndex];
    const test = this.getAssessmentById(att.test_id);
    if (!test) throw new Error('Test configuration not found');

    let marksObtained = 0;
    const questions = test.questions || [];
    const totalPossibleMarks = test.total_marks || questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // Evaluate answers
    questions.forEach((q) => {
      const studentAns = answers[q.id];
      if (studentAns === undefined || studentAns === null || studentAns === '') return;

      let isCorrect = false;
      switch (q.type) {
        case 'mcq':
        case 'find_output':
        case 'true_false':
          isCorrect = Number(studentAns) === Number(q.correct_answer);
          break;
        case 'multiple_correct':
          if (Array.isArray(studentAns) && Array.isArray(q.correct_answer)) {
            const sortedStudent = [...studentAns].sort().join(',');
            const sortedCorrect = [...q.correct_answer].sort().join(',');
            isCorrect = sortedStudent === sortedCorrect;
          }
          break;
        case 'fill_blanks':
        case 'short_answer':
          isCorrect =
            String(studentAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
          break;
        case 'coding':
          isCorrect = Boolean(studentAns && String(studentAns).trim().length > 15);
          break;
      }

      if (isCorrect) {
        marksObtained += q.marks || 1;
      } else if (test.negative_marking_per_question > 0 && studentAns !== undefined) {
        marksObtained = Math.max(0, marksObtained - test.negative_marking_per_question);
      }
    });

    const scorePercentage = Math.round((marksObtained / Math.max(1, totalPossibleMarks)) * 100);
    const isPassed = !disqualifiedDueToViolations && scorePercentage >= (test.passing_percentage || 50);

    // Calculate Tiered Credits based on test credit_tiers (Practice and Aptitude tests NEVER award credits)
    let earnedCredits = 0;
    if (test.category !== 'practice' && test.category !== 'aptitude' && isPassed && !disqualifiedDueToViolations) {
      const tiers = test.credit_tiers && test.credit_tiers.length > 0 ? test.credit_tiers : DEFAULT_CREDIT_TIERS;
      const sortedTiers = [...tiers].sort((a, b) => b.min_percentage - a.min_percentage);
      for (const tier of sortedTiers) {
        if (scorePercentage >= tier.min_percentage) {
          earnedCredits = tier.credits;
          break;
        }
      }
    }

    att.submitted_at = new Date().toISOString();
    att.answers = answers;
    att.question_statuses = questionStatuses;
    att.marks_obtained = marksObtained;
    att.total_marks = totalPossibleMarks;
    att.score_percentage = scorePercentage;
    att.is_passed = isPassed;
    att.earned_credits = earnedCredits;
    att.status = disqualifiedDueToViolations ? 'disqualified' : 'submitted';

    attempts[attIndex] = att;
    safeStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));
    this.clearSavedExamProgress(attemptId);

    // INTEGRATE WITH STUDENT CREDIT MANAGEMENT PORTAL! (Academic official tests ONLY)
    if (earnedCredits > 0 && test.category !== 'practice' && test.category !== 'aptitude' && (test.category === 'internal' || test.category === 'overall')) {
      const monthNum = test.month_number || (test.category === 'overall' ? 4 : 1);
      const categoryTag = test.credit_category_id || (monthNum === 4 ? 'fourth_month_test' : `month_${monthNum}_test`);
      const creditTitle =
        test.category === 'overall' || monthNum === 4
          ? `Month 4 Overall Semester Assessment Credits: ${test.title}`
          : `Month ${monthNum} Internal Test Credits: ${test.title}`;

      void creditService.awardCreditsApi(att.student_id, {
        category: categoryTag,
        title: creditTitle,
        credits: earnedCredits,
        awarded_by: 'Auto (WeGrow Examination Portal)',
        notes: `Month ${monthNum} Test • Scored ${scorePercentage}% (Threshold: ${test.passing_percentage}%) • Earned Grade Tier Award`,
        source_id: test.id,
      }).catch((error) => {
        // awardCreditsApi saves to the local ledger before attempting the backend,
        // so the student's earned credits remain available when the API is offline.
        console.warn('Exam credit backend sync failed; kept the local award:', error);
      });
    }

    safeDispatchEvent('wegrow_attempt_submitted', { attempt: att });
    return att;
  },

  // 7. Attempts Storage & Retrieval
  getAllAttempts(): StudentAttempt[] {
    try {
      const stored = safeStorage.getItem(STORAGE_ATTEMPTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Retroactively ensure practice and aptitude attempts have 0 earned credits
          return parsed.map((att) => {
            const test = this.getAssessmentById(att.test_id);
            if (test?.category === 'practice' || test?.category === 'aptitude') {
              return { ...att, earned_credits: 0 };
            }
            return att;
          });
        }
      }
    } catch (e) {
      console.error('Failed to load attempts', e);
    }
    return [];
  },

  saveAttempt(attempt: StudentAttempt): void {
    const list = this.getAllAttempts();
    const idx = list.findIndex((a) => a.id === attempt.id);
    let updated: StudentAttempt[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = attempt;
    } else {
      updated = [attempt, ...list];
    }
    safeStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(updated));
  },

  getStudentAttempts(studentId: string): StudentAttempt[] {
    const list = this.getAllAttempts();
    return list.filter((a) => a.student_id === studentId);
  },

  getStudentAttemptForTest(studentId: string, testId: string): StudentAttempt | null {
    const list = this.getStudentAttempts(studentId);
    return list.find((a) => a.test_id === testId) || null;
  },

  createStudentAttempt(
    test: AssessmentConfig,
    student: { id: string; name: string; email?: string; batch?: string },
  ): StudentAttempt {
    const newAttempt: StudentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      test_id: test.id,
      test_title: test.title,
      student_id: student.id,
      student_name: student.name,
      student_email: student.email,
      course_name: test.course_name,
      batch: student.batch || test.batch || 'Main Batch',
      category: test.category,
      start_time: new Date().toISOString(),
      answers: {},
      question_statuses: {},
      marks_obtained: 0,
      total_marks: test.total_marks,
      score_percentage: 0,
      is_passed: false,
      earned_credits: 0,
      violations_count: 0,
      violations_log: [],
      status: 'in_progress',
    };
    this.saveAttempt(newAttempt);
    return newAttempt;
  },

  // 8. Live Proctoring & Retake Permissions
  grantRetake(studentId: string, testId: string, mentorName: string): boolean {
    const attempts = this.getAllAttempts();
    const updated = attempts.filter((a) => !(a.student_id === studentId && a.test_id === testId));
    safeStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(updated));
    safeDispatchEvent('wegrow_retake_granted', { studentId, testId, mentorName });
    return true;
  },

  // Admin Override: Manually unlock an exam for a specific student or batch
  unlockExamForStudent(testId: string, studentId: string): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test) return false;
    
    if (!test.unlocked_student_ids) {
      test.unlocked_student_ids = [];
    }
    if (!test.unlocked_student_ids.includes(studentId)) {
      test.unlocked_student_ids.push(studentId);
      this.updateAssessment(testId, { unlocked_student_ids: test.unlocked_student_ids });
    }
    return true;
  },

  lockExamForStudent(testId: string, studentId: string): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test || !test.unlocked_student_ids) return false;
    
    test.unlocked_student_ids = test.unlocked_student_ids.filter((id) => id !== studentId);
    this.updateAssessment(testId, { unlocked_student_ids: test.unlocked_student_ids });
    return true;
  },

  unlockExamForStudents(testId: string, studentIds: string[]): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test) return false;
    
    if (!test.unlocked_student_ids) {
      test.unlocked_student_ids = [];
    }
    const currentSet = new Set(test.unlocked_student_ids);
    studentIds.forEach((id) => currentSet.add(id));
    test.unlocked_student_ids = Array.from(currentSet);
    this.updateAssessment(testId, { unlocked_student_ids: test.unlocked_student_ids });
    return true;
  },

  lockExamForStudents(testId: string, studentIds: string[]): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test || !test.unlocked_student_ids) return false;
    
    const removeSet = new Set(studentIds);
    test.unlocked_student_ids = test.unlocked_student_ids.filter((id) => !removeSet.has(id));
    this.updateAssessment(testId, { unlocked_student_ids: test.unlocked_student_ids });
    return true;
  },

  unlockExamGlobally(testId: string): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test) return false;
    
    if (!test.unlocked_student_ids) {
      test.unlocked_student_ids = [];
    }
    if (!test.unlocked_student_ids.includes('all_students')) {
      test.unlocked_student_ids.push('all_students');
    }
    this.updateAssessment(testId, { unlocked_student_ids: test.unlocked_student_ids });
    return true;
  },

  resetExamPermissions(testId: string): boolean {
    const assessments = this.getAssessments();
    const test = assessments.find((t) => t.id === testId);
    if (!test) return false;
    test.unlocked_student_ids = [];
    this.updateAssessment(testId, { unlocked_student_ids: [] });
    return true;
  },

  isExamUnlockedForStudent(testId: string, studentId: string): boolean {
    const test = this.getAssessmentById(testId);
    if (!test) return false;
    return Boolean(test.unlocked_student_ids && test.unlocked_student_ids.includes(studentId));
  },

  forceSubmit(attemptId: string): StudentAttempt | null {
    const attempts = this.getAllAttempts();
    const att = attempts.find((a) => a.id === attemptId);
    if (!att || att.status !== 'in_progress') return null;
    return this.submitExam(attemptId, att.answers || {}, att.question_statuses || {}, true);
  },

  // 9. Topic Strengths & Weaknesses Analytics
  getTopicAnalytics(attempts: StudentAttempt[], test: AssessmentConfig): TopicAnalysis[] {
    const topicMap: Record<string, { total: number; correct: number }> = {};
    const questions = test.questions || [];

    questions.forEach((q) => {
      const topic = q.topic || 'General';
      if (!topicMap[topic]) topicMap[topic] = { total: 0, correct: 0 };
    });

    attempts.forEach((att) => {
      if (att.status !== 'submitted') return;
      questions.forEach((q) => {
        const topic = q.topic || 'General';
        topicMap[topic].total += 1;
        const ans = att.answers[q.id];
        if (ans !== undefined) {
          if (q.type === 'mcq' || q.type === 'find_output' || q.type === 'true_false') {
            if (Number(ans) === Number(q.correct_answer)) topicMap[topic].correct += 1;
          } else if (q.type === 'multiple_correct' && Array.isArray(ans) && Array.isArray(q.correct_answer)) {
            if ([...ans].sort().join() === [...q.correct_answer].sort().join()) topicMap[topic].correct += 1;
          } else if (String(ans).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
            topicMap[topic].correct += 1;
          }
        }
      });
    });

    return Object.entries(topicMap).map(([topic, stats]) => ({
      topic,
      total_questions: stats.total,
      correct_questions: stats.correct,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  },

  // 10. True Excel (.xlsx) & CSV Exporter and Importer
  generateExcelWorkbook(): void {
    const rows = [
      {
        Type: 'mcq',
        Question_Text: 'Which data structure follows the Last-In First-Out (LIFO) principle?',
        Options: 'Queue | Stack | Binary Tree | Linked List',
        Correct_Answer: '1',
        Marks: 5,
        Negative_Marks: 1,
        Topic: 'Data Structures',
        Difficulty: 'easy',
        Code_Snippet: '',
        Explanation: 'A Stack follows LIFO.',
      },
      {
        Type: 'find_output',
        Question_Text: 'What is the output of the following Python snippet?',
        Options: '3 | 4 | Error | None',
        Correct_Answer: '1',
        Marks: 5,
        Negative_Marks: 1,
        Topic: 'Python Core',
        Difficulty: 'medium',
        Code_Snippet: 'x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))',
        Explanation: 'Reference is copied, mutating y mutates x.',
      },
      {
        Type: 'multiple_correct',
        Question_Text: 'Select all valid HTTP 2xx success status codes:',
        Options: '200 OK | 201 Created | 204 No Content | 304 Not Modified | 400 Bad Request',
        Correct_Answer: '0 | 1 | 2',
        Marks: 5,
        Negative_Marks: 0,
        Topic: 'Web Architecture',
        Difficulty: 'medium',
        Code_Snippet: '',
        Explanation: '200, 201, 204 are 2xx success codes.',
      },
      {
        Type: 'true_false',
        Question_Text: 'Python strings are mutable objects and can be modified in-place.',
        Options: 'True | False',
        Correct_Answer: '1',
        Marks: 5,
        Negative_Marks: 0,
        Topic: 'Python Core',
        Difficulty: 'easy',
        Code_Snippet: '',
        Explanation: 'Strings in Python are immutable.',
      },
      {
        Type: 'fill_blanks',
        Question_Text: 'The SQL command to remove all rows without logging individual deletions is ________.',
        Options: 'TRUNCATE | DELETE | DROP | ALTER',
        Correct_Answer: 'TRUNCATE',
        Marks: 5,
        Negative_Marks: 0,
        Topic: 'Databases',
        Difficulty: 'medium',
        Code_Snippet: '',
        Explanation: 'TRUNCATE deallocates pages.',
      },
      {
        Type: 'short_answer',
        Question_Text: 'What is the worst-case time complexity of QuickSort? (Format: O(n^2))',
        Options: '',
        Correct_Answer: 'O(n^2)',
        Marks: 5,
        Negative_Marks: 0,
        Topic: 'Algorithms',
        Difficulty: 'hard',
        Code_Snippet: '',
        Explanation: 'Unbalanced partitions lead to O(n^2).',
      },
      {
        Type: 'coding',
        Question_Text: 'Write a Python function is_palindrome(s) returning True if string s is a palindrome.',
        Options: '',
        Correct_Answer: 'palindrome_logic',
        Marks: 10,
        Negative_Marks: 0,
        Topic: 'Algorithms',
        Difficulty: 'medium',
        Code_Snippet: 'def is_palindrome(s):\n    return s == s[::-1]',
        Explanation: 'Comparing to reversed string checks palindrome.',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions_Template');
    XLSX.writeFile(workbook, 'WeGrow_Exam_Questions_Template.xlsx');
  },

  parseQuestionsFromExcelBuffer(buffer: ArrayBuffer): ExamQuestion[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) return [];

    const questions: ExamQuestion[] = [];
    rawRows.forEach((row, i) => {
      // Flexible field naming (handles lowercase, uppercase, underscores)
      const qType = String(row.Type || row.type || 'mcq').toLowerCase().trim() as QuestionType;
      const qText = String(row.Question_Text || row.question_text || row.Question || row.question || '').trim();
      if (!qText) return;

      const rawOptions = String(row.Options || row.options || '');
      const options = rawOptions
        ? rawOptions.split('|').map((o) => o.trim()).filter((o) => o.length > 0)
        : (qType === 'true_false' ? ['True', 'False'] : undefined);

      const rawCorrect = String(row.Correct_Answer || row.correct_answer || row.Answer || '0').trim();
      let correctAnswer: any = 0;
      if (qType === 'multiple_correct') {
        correctAnswer = rawCorrect
          .split('|')
          .map((x) => Number(x.trim()))
          .filter((x) => !isNaN(x));
      } else if (qType === 'fill_blanks' || qType === 'short_answer' || qType === 'coding') {
        correctAnswer = rawCorrect;
      } else {
        correctAnswer = isNaN(Number(rawCorrect)) ? rawCorrect : Number(rawCorrect);
      }

      const marks = Number(row.Marks || row.marks) || 5;
      const negMarks = Number(row.Negative_Marks || row.negative_marks) || 0;
      const topic = String(row.Topic || row.topic || 'General').trim();
      const diff = String(row.Difficulty || row.difficulty || 'medium').toLowerCase().trim() as any;
      const codeSnippet = String(row.Code_Snippet || row.code_snippet || '').trim();
      const explanation = String(row.Explanation || row.explanation || '').trim();

      questions.push({
        id: `q-excel-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        type: qType,
        question_text: qText,
        options,
        correct_answer: correctAnswer,
        marks,
        negative_marks: negMarks,
        topic,
        difficulty: diff === 'easy' || diff === 'hard' ? diff : 'medium',
        code_snippet: codeSnippet || undefined,
        explanation: explanation || undefined,
      });
    });

    return questions;
  },

  generateExcelCsvTemplate(): string {
    const header = 'Type,Question_Text,Options,Correct_Answer,Marks,Negative_Marks,Topic,Difficulty,Code_Snippet,Explanation\n';
    const sampleRows = [
      'mcq,"Which data structure follows the Last-In First-Out (LIFO) principle?","Queue | Stack | Binary Tree | Linked List",1,5,1,"Data Structures","easy","","A Stack follows LIFO"',
      'find_output,"What is the output of the following Python snippet?","3 | 4 | Error | None",1,5,1,"Python Core","medium","x = [1, 2, 3]\\ny = x\\ny.append(4)\\nprint(len(x))","Reference is copied, mutating y mutates x"',
      'multiple_correct,"Select all valid HTTP 2xx success status codes:","200 OK | 201 Created | 204 No Content | 304 Not Modified | 400 Bad Request",0 | 1 | 2,5,0,"Web Architecture","medium","","200, 201, 204 are 2xx"',
      'true_false,"Python strings are mutable objects and can be modified in-place.","True | False",1,5,0,"Python Core","easy","","Strings in Python are immutable"',
      'fill_blanks,"The SQL command to remove all rows without logging individual deletions is ________.","TRUNCATE | DELETE | DROP | ALTER",TRUNCATE,5,0,"Databases","medium","","TRUNCATE deallocates pages"',
      'short_answer,"What is the worst-case time complexity of QuickSort? (Format: O(n^2))","",O(n^2),5,0,"Algorithms","hard","","Unbalanced partitions lead to O(n^2)"',
      'coding,"Write a function is_palindrome(s) returning True if string s is a palindrome.","",palindrome_logic,10,0,"Algorithms","medium","def is_palindrome(s):\\n    return s == s[::-1]","Comparing to reversed string checks palindrome"',
    ];
    return header + sampleRows.join('\n');
  },

  parseQuestionsFromCsv(csvText: string): ExamQuestion[] {
    const workbook = XLSX.read(csvText, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (!rawRows || rawRows.length === 0) return [];

    const questions: ExamQuestion[] = [];
    rawRows.forEach((row, i) => {
      const qType = String(row.Type || row.type || 'mcq').toLowerCase().trim() as QuestionType;
      const qText = String(row.Question_Text || row.question_text || row.Question || row.question || '').trim();
      if (!qText) return;

      const rawOptions = String(row.Options || row.options || '');
      const options = rawOptions
        ? rawOptions.split('|').map((o) => o.trim()).filter((o) => o.length > 0)
        : (qType === 'true_false' ? ['True', 'False'] : undefined);

      const rawCorrect = String(row.Correct_Answer || row.correct_answer || '0').trim();
      let correctAnswer: any = 0;
      if (qType === 'multiple_correct') {
        correctAnswer = rawCorrect
          .split('|')
          .map((x) => Number(x.trim()))
          .filter((x) => !isNaN(x));
      } else if (qType === 'fill_blanks' || qType === 'short_answer' || qType === 'coding') {
        correctAnswer = rawCorrect;
      } else {
        correctAnswer = isNaN(Number(rawCorrect)) ? rawCorrect : Number(rawCorrect);
      }

      questions.push({
        id: `q-csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        type: qType,
        question_text: qText,
        options,
        correct_answer: correctAnswer,
        marks: Number(row.Marks || row.marks) || 5,
        negative_marks: Number(row.Negative_Marks || row.negative_marks) || 0,
        topic: String(row.Topic || row.topic || 'General').trim(),
        difficulty: String(row.Difficulty || row.difficulty || 'medium').toLowerCase() as any,
        code_snippet: String(row.Code_Snippet || row.code_snippet || '').trim() || undefined,
        explanation: String(row.Explanation || row.explanation || '').trim() || undefined,
      });
    });

    return questions;
  },

  parseQuestionsFromDocumentText(rawText: string): ExamQuestion[] {
    if (!rawText || !rawText.trim()) return [];

    const normalized = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');

    const lines = normalized.split('\n');
    const questionBlocks: string[][] = [];
    let currentBlock: string[] = [];

    const qStartRegex = /^\s*(?:(?:Q|Question|Que|Item)\s*[\.\:\-\s]*)?(?:\d+|[ivxIVX]+)[\.\:\)\-]\s+/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (qStartRegex.test(line)) {
        if (currentBlock.length > 0) {
          questionBlocks.push(currentBlock);
        }
        currentBlock = [line];
      } else {
        if (currentBlock.length > 0) {
          currentBlock.push(line);
        } else {
          currentBlock.push(line);
        }
      }
    }
    if (currentBlock.length > 0) {
      questionBlocks.push(currentBlock);
    }

    const singleOptRegex = /^\s*(?:\(?([A-Da-d0-9])\)|\(?([A-Da-d])\.|\[([A-Da-d])\])\s*(.+)$/;
    const inlineSplitRegex = /(?=(?:^|\s{2,}|\t)(?:\(?[A-Da-d]\)|\(?[A-Da-d]\.|\[[A-Da-d]\])\s+)/;
    const ansRegex = /^\s*(?:Answer|Ans|Correct(?:\s*Answer|\s*Option)?|Key)\s*[:=\-]\s*(.+)$/i;
    const marksRegex = /^\s*(?:Marks?|Pts?|Points?)\s*[:=\-]?\s*\+?(\d+(?:\.\d+)?)/i;
    const negMarksRegex = /^\s*(?:Negative(?:\s*Marks?)?|Penalty)\s*[:=\-]?\s*-?(\d+(?:\.\d+)?)/i;
    const topicRegex = /^\s*(?:Topic|Subject|Category|Section)\s*[:=\-]\s*(.+)$/i;
    const diffRegex = /^\s*(?:Difficulty|Diff|Level)\s*[:=\-]\s*(easy|medium|hard)/i;
    const explanationRegex = /^\s*(?:Explanation|Explain|Rationale|Reason|Solution)\s*[:=\-]\s*(.+)$/i;

    const parsedQuestions: ExamQuestion[] = [];

    questionBlocks.forEach((block, idx) => {
      let questionText = '';
      const options: string[] = [];
      let rawAnswer = '';
      let marks = 2;
      let negativeMarks = 0;
      let topic = 'General';
      let difficulty: any = 'medium';
      let explanation = '';
      let readingStem = true;

      const flatLines: string[] = [];
      for (const line of block) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const matches = trimmed.match(/(?:\(?([A-Da-d])\)|\(?([A-Da-d])\.)\s+/g);
        if (matches && matches.length > 1) {
          const parts = trimmed.split(inlineSplitRegex).map((p) => p.trim()).filter(Boolean);
          flatLines.push(...parts);
        } else {
          flatLines.push(trimmed);
        }
      }

      for (let j = 0; j < flatLines.length; j++) {
        const line = flatLines[j];

        const ansMatch = line.match(ansRegex);
        if (ansMatch) {
          rawAnswer = ansMatch[1].trim();
          readingStem = false;
          continue;
        }

        const marksMatch = line.match(marksRegex);
        if (marksMatch) {
          marks = Number(marksMatch[1]) || 2;
          readingStem = false;
          continue;
        }

        const negMatch = line.match(negMarksRegex);
        if (negMatch) {
          negativeMarks = Number(negMatch[1]) || 0;
          readingStem = false;
          continue;
        }

        const topicMatch = line.match(topicRegex);
        if (topicMatch) {
          topic = topicMatch[1].trim();
          readingStem = false;
          continue;
        }

        const diffMatch = line.match(diffRegex);
        if (diffMatch) {
          const d = diffMatch[1].toLowerCase();
          if (d === 'easy' || d === 'hard') difficulty = d;
          else difficulty = 'medium';
          readingStem = false;
          continue;
        }

        const expMatch = line.match(explanationRegex);
        if (expMatch) {
          explanation = expMatch[1].trim();
          readingStem = false;
          continue;
        }

        const optMatch = line.match(singleOptRegex);
        if (optMatch) {
          const optContent = optMatch[4].trim();
          options.push(optContent);
          readingStem = false;
          continue;
        }

        if (readingStem) {
          if (!questionText) {
            questionText = line.replace(qStartRegex, '').trim();
          } else {
            questionText += ' ' + line;
          }
        } else {
          if (explanation) {
            explanation += ' ' + line;
          }
        }
      }

      if (!questionText && options.length === 0) return;
      if (!questionText && options.length > 0) {
        questionText = `Question ${idx + 1}`;
      }

      let qType: QuestionType = 'mcq';
      let correctAnswer: any = 0;

      const isTrueFalse =
        options.length === 2 &&
        options.some((o) => /^true$/i.test(o)) &&
        options.some((o) => /^false$/i.test(o));

      if (isTrueFalse) {
        qType = 'true_false';
      } else if (options.length === 0) {
        qType = 'short_answer';
      }

      if (rawAnswer) {
        const cleanAns = rawAnswer.replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '').trim();
        const upperAns = cleanAns.toUpperCase();

        if (['A', '1', 'OPTION A'].includes(upperAns)) {
          correctAnswer = 0;
        } else if (['B', '2', 'OPTION B'].includes(upperAns)) {
          correctAnswer = 1;
        } else if (['C', '3', 'OPTION C'].includes(upperAns)) {
          correctAnswer = 2;
        } else if (['D', '4', 'OPTION D'].includes(upperAns)) {
          correctAnswer = 3;
        } else if (upperAns === 'TRUE') {
          correctAnswer = options.findIndex((o) => /^true$/i.test(o));
          if (correctAnswer === -1) correctAnswer = 0;
        } else if (upperAns === 'FALSE') {
          correctAnswer = options.findIndex((o) => /^false$/i.test(o));
          if (correctAnswer === -1) correctAnswer = 1;
        } else {
          const matchedIndex = options.findIndex(
            (o) => o.toLowerCase().trim() === cleanAns.toLowerCase()
          );
          if (matchedIndex !== -1) {
            correctAnswer = matchedIndex;
          } else {
            correctAnswer = cleanAns;
          }
        }
      }

      parsedQuestions.push({
        id: `q-doc-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        type: qType,
        question_text: questionText,
        options: options.length > 0 ? options : undefined,
        correct_answer: correctAnswer,
        marks,
        negative_marks: negativeMarks,
        topic,
        difficulty,
        explanation: explanation || undefined,
      });
    });

    return parsedQuestions;
  },

  async parseQuestionsFromDocxBuffer(buffer: ArrayBuffer): Promise<ExamQuestion[]> {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return this.parseQuestionsFromDocumentText(result.value);
  },

  async parseQuestionsFromPdfBuffer(buffer: ArrayBuffer): Promise<ExamQuestion[]> {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n\n';
    }
    return this.parseQuestionsFromDocumentText(fullText);
  },

  async generateWordDocxTemplate(): Promise<void> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'WeGrow Assessment - Question Paper Template',
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Standard Document Upload Template (.docx)',
                  bold: true,
                  color: '4F46E5',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Instructions for Instructors:\n' +
                    '• Number each question consecutively (e.g. 1. or Q1:).\n' +
                    '• List options starting with A), B), C), D) or A., B., C., D.\n' +
                    '• Specify the correct answer on a new line using "Answer: A" or "Correct Answer: B".\n' +
                    '• Optional fields: Marks: 2, Negative Marks: 0, Topic: HTML, Difficulty: easy/medium/hard, Explanation: ...\n' +
                    '• You can also paste tables or paragraphs directly from your question archives.',
                  italics: true,
                }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                  color: '94A3B8',
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            // Question 1
            new Paragraph({
              children: [new TextRun({ text: '1. What is the purpose of <!DOCTYPE html>?', bold: true })],
            }),
            new Paragraph({ text: 'A) Informs the browser that this is an HTML5 document' }),
            new Paragraph({ text: 'B) Closes all open tags automatically' }),
            new Paragraph({ text: 'C) Links an external CSS stylesheet' }),
            new Paragraph({ text: 'D) Enables strict mode in JavaScript' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: A', bold: true })] }),
            new Paragraph({ text: 'Marks: 2' }),
            new Paragraph({ text: 'Topic: HTML' }),
            new Paragraph({ text: 'Difficulty: easy' }),
            new Paragraph({ text: 'Explanation: <!DOCTYPE html> declaration is not case-sensitive and informs the browser about HTML5.' }),
            new Paragraph({ text: '' }),

            // Question 2
            new Paragraph({
              children: [new TextRun({ text: '2. Which tag is the root element of an HTML document?', bold: true })],
            }),
            new Paragraph({ text: 'A) <body>' }),
            new Paragraph({ text: 'B) <html>' }),
            new Paragraph({ text: 'C) <head>' }),
            new Paragraph({ text: 'D) <doctype>' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: B', bold: true })] }),
            new Paragraph({ text: 'Marks: 2' }),
            new Paragraph({ text: 'Topic: HTML' }),
            new Paragraph({ text: 'Difficulty: easy' }),
            new Paragraph({ text: 'Explanation: The <html> element is the container for all other HTML elements.' }),
            new Paragraph({ text: '' }),

            // Question 3
            new Paragraph({
              children: [new TextRun({ text: '3. In CSS, what does the "z-index" property control?', bold: true })],
            }),
            new Paragraph({ text: 'A) The horizontal alignment of flex children' }),
            new Paragraph({ text: 'B) The stacking order of overlapping positioned elements' }),
            new Paragraph({ text: 'C) The maximum height constraint of a div' }),
            new Paragraph({ text: 'D) The transition zoom magnification' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: B', bold: true })] }),
            new Paragraph({ text: 'Marks: 3' }),
            new Paragraph({ text: 'Topic: CSS' }),
            new Paragraph({ text: 'Difficulty: medium' }),
            new Paragraph({ text: 'Explanation: Elements with greater stack order are rendered in front of an element with lower stack order.' }),
            new Paragraph({ text: '' }),

            // Question 4
            new Paragraph({
              children: [new TextRun({ text: '4. JavaScript primitive strings are mutable objects and can be mutated in-place.', bold: true })],
            }),
            new Paragraph({ text: 'A) True' }),
            new Paragraph({ text: 'B) False' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: B', bold: true })] }),
            new Paragraph({ text: 'Marks: 2' }),
            new Paragraph({ text: 'Topic: JavaScript' }),
            new Paragraph({ text: 'Difficulty: easy' }),
            new Paragraph({ text: 'Explanation: In JavaScript, primitive strings are immutable; methods return new strings rather than mutating.' }),
            new Paragraph({ text: '' }),

            // Question 5
            new Paragraph({
              children: [new TextRun({ text: '5. Which SQL clause filters aggregate results after a GROUP BY operation?', bold: true })],
            }),
            new Paragraph({ text: 'A) WHERE' }),
            new Paragraph({ text: 'B) HAVING' }),
            new Paragraph({ text: 'C) FILTER' }),
            new Paragraph({ text: 'D) ORDER BY' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: B', bold: true })] }),
            new Paragraph({ text: 'Marks: 3' }),
            new Paragraph({ text: 'Topic: Databases' }),
            new Paragraph({ text: 'Difficulty: medium' }),
            new Paragraph({ text: 'Explanation: The HAVING clause was added to SQL because WHERE cannot be used with aggregate functions.' }),
            new Paragraph({ text: '' }),

            // Question 6
            new Paragraph({
              children: [new TextRun({ text: '6. A car travels 180 km in 3 hours. What is its speed in meters per second (m/s)?', bold: true })],
            }),
            new Paragraph({ text: 'A) 15 m/s' }),
            new Paragraph({ text: 'B) 16.67 m/s' }),
            new Paragraph({ text: 'C) 20 m/s' }),
            new Paragraph({ text: 'D) 25 m/s' }),
            new Paragraph({ children: [new TextRun({ text: 'Answer: B', bold: true })] }),
            new Paragraph({ text: 'Marks: 5' }),
            new Paragraph({ text: 'Topic: Quantitative Aptitude' }),
            new Paragraph({ text: 'Difficulty: medium' }),
            new Paragraph({ text: 'Explanation: Speed = 180/3 = 60 km/h. 60 * (5/18) = 16.67 m/s.' }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WeGrow_Exam_Questions_Template.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
