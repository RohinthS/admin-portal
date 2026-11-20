import { ExamQuestion, AssessmentConfig } from '../types';
import {
  CATEGORIZED_COURSES,
  COURSE_TO_TOPICS_MAP,
  getEngineRandomQuestions,
} from './questionBankEngine';
import { OFFICIAL_6_COURSES_REGISTRY } from './officialSyllabusCatalog';

export interface CourseModuleDef {
  id: string;
  moduleNumber: number;
  moduleName: string;
  topic: string; // The primary topic key matching Central Question Bank
  additionalTopics?: string[]; // If module spans multiple topics
  description: string;
  durationWeeks?: number;
  durationDays?: number;
  suggestedDuration: number;
  suggestedQuestions: number;
  subtopics?: string[];
  practicalActivity?: string;
}

export interface ModuleProgressStatus {
  moduleId: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: string;
  testConducted?: boolean;
  testId?: string;
  testPin?: string;
  testConductedAt?: string;
}

export interface BatchProgressRecord {
  courseName: string;
  batchName: string;
  modules: Record<string, ModuleProgressStatus>;
  updatedAt: string;
}

// Comprehensive Official Syllabus Module Catalog derived from database and official uploads
export const COURSE_SYLLABUS_REGISTRY: Record<string, CourseModuleDef[]> = {
  ...OFFICIAL_6_COURSES_REGISTRY,
  // Official Syllabus from 1783595095_HTML_Course_Syllabus.pdf
  'HTML Course Syllabus': [
    {
      id: 'html-mod-1',
      moduleNumber: 1,
      moduleName: 'Introduction to HTML',
      topic: 'HTML',
      description: 'Foundations of web development, HTML structure, first HTML program, comments, tags and attributes.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['What is HTML?', 'Why HTML?', 'Features and Applications of HTML', 'Structure of an HTML Document', 'First HTML Program', 'HTML Comments', 'HTML Tags and Attributes'],
      practicalActivity: 'Create a basic HTML webpage.'
    },
    {
      id: 'html-mod-2',
      moduleNumber: 2,
      moduleName: 'Text Formatting Elements',
      topic: 'HTML',
      description: 'Headings, paragraph structure, preformatted blocks, horizontal dividing lines, and line breaks.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Heading Tags (<h1> to <h6>)', 'Paragraph Tag (<p>)', 'Preformatted Text (<pre>)', 'Horizontal Rule (<hr>)', 'Line Break (<br>)'],
      practicalActivity: 'Design a personal profile page using text formatting tags.'
    },
    {
      id: 'html-mod-3',
      moduleNumber: 3,
      moduleName: 'Text Styling and Semantic Formatting',
      topic: 'HTML',
      description: 'Bold, strong importance, italics, emphasis, small text, highlighted text, deleted/inserted text, super/subscripts, quotes & abbreviations.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Bold Text (<b>)', 'Strong Importance (<strong>)', 'Italic Text (<i>)', 'Emphasized Text (<em>)', 'Small Text (<small>)', 'Highlighted Text (<mark>)', 'Deleted Text (<del>)', 'Inserted Text (<ins>)', 'Superscript (<sup>)', 'Subscript (<sub>)', 'Quotations (<q>)', 'Abbreviations (<abbr>)'],
      practicalActivity: 'Create a webpage demonstrating all text formatting elements.'
    },
    {
      id: 'html-mod-4',
      moduleNumber: 4,
      moduleName: 'Lists & Structural Nesting',
      topic: 'HTML',
      description: 'Numbered ordered lists, bulleted unordered lists, and multi-level nested navigation lists.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Ordered Lists (<ol>)', 'Unordered Lists (<ul>)', 'Nested Lists', 'List Type Attributes'],
      practicalActivity: 'Create a Bucket List using HTML lists, and design a Course Structure using nested lists.'
    },
    {
      id: 'html-mod-5',
      moduleNumber: 5,
      moduleName: 'Hyperlinks and Images',
      topic: 'HTML',
      description: 'Anchor navigation, internal/external links, target windows, mailto protocol, image rendering, attributes, and clickable image buttons.',
      durationDays: 1,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Anchor Tag (<a>)', 'Internal Links', 'External Links', 'Target Attributes', 'Mailto Links', 'Image Tag (<img>)', 'Image Attributes', 'Using Images as Hyperlinks'],
      practicalActivity: 'Create a College/Institute Information Page with Logo, Images, and Navigation Links.'
    },
    {
      id: 'html-mod-6',
      moduleNumber: 6,
      moduleName: 'Tables & Tabular Data Layout',
      topic: 'HTML',
      description: 'Table architecture, headers, rows, data cells, complex merged layouts using rowspan and colspan.',
      durationDays: 1,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Introduction to Tables', 'Table Structure', 'Table Row (<tr>)', 'Table Header (<th>)', 'Table Data (<td>)', 'Rowspan', 'Colspan'],
      practicalActivity: 'Create a Student Marksheet Table, and design a Weekly Timetable.'
    },
    {
      id: 'html-mod-7',
      moduleNumber: 7,
      moduleName: 'Basic Styling with Inline CSS',
      topic: 'HTML',
      description: 'Inline style attributes, foreground & background colors, borders, typography fonts, sizing, and text alignment.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Introduction to Inline CSS', 'Text Color', 'Background Color', 'Border Properties', 'Font Family', 'Font Size', 'Text Alignment'],
      practicalActivity: 'Style a webpage using inline CSS properties.'
    },
    {
      id: 'html-mod-8',
      moduleNumber: 8,
      moduleName: 'Container Elements & Layout Division',
      topic: 'HTML',
      description: 'Block-level division elements (div), inline span elements, CSS targeting using IDs and class selectors.',
      durationDays: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Division Element (<div>)', 'Span Element (<span>)', 'ID Attribute', 'Class Attribute', 'Block vs Inline'],
      practicalActivity: 'Create webpage sections using div and span elements.'
    },
    {
      id: 'html-mod-9',
      moduleNumber: 9,
      moduleName: 'Forms, Controls & User Input',
      topic: 'HTML',
      description: 'Form submission, textboxes, passwords, email, numeric inputs, radio buttons, checkboxes, dropdown select menus, textareas, and submit/reset actions.',
      durationDays: 1,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['Form Tag (<form>)', 'Textbox', 'Password Field', 'Email Field', 'Radio Button & Checkbox', 'Dropdown List (<select>)', 'Text Area (<textarea>)', 'Submit & Reset'],
      practicalActivity: 'Design a comprehensive Student Registration Form.'
    },
    {
      id: 'html-mod-10',
      moduleNumber: 10,
      moduleName: 'Semantic HTML5 Architecture & Page Layouts',
      topic: 'HTML',
      description: 'Modern SEO-friendly semantic tags: header, nav, section, article, aside, and footer.',
      durationDays: 1,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Introduction to Semantic HTML', 'Header (<header>)', 'Navigation (<nav>)', 'Section (<section>)', 'Article (<article>)', 'Footer (<footer>)'],
      practicalActivity: 'Build a full website layout using semantic elements and complete Mini Projects.'
    },
  ],

  'AI Python Full Stack Program': [
    {
      id: 'pyfs-mod-1',
      moduleNumber: 1,
      moduleName: 'HTML5 & Semantic Web Structure',
      topic: 'HTML',
      description: 'Document structure, semantic elements (<nav>, <article>, <section>), forms, tables, media & SEO fundamentals',
      durationWeeks: 3,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Tags & Elements', 'Forms & Inputs', 'Semantic HTML5', 'Accessibility'],
    },
    {
      id: 'pyfs-mod-2',
      moduleNumber: 2,
      moduleName: 'CSS3 Styling, Flexbox & Responsive UI',
      topic: 'CSS',
      description: 'Selectors, Box Model, Flexbox layouts, CSS Grid, media queries & responsive web design',
      durationWeeks: 3,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Box Model', 'Flexbox', 'CSS Grid', 'Media Queries', 'Transitions'],
    },
    {
      id: 'pyfs-mod-3',
      moduleNumber: 3,
      moduleName: 'JavaScript Core, ES6+ & DOM Events',
      topic: 'JavaScript',
      description: 'Variables, data types, functions, arrow syntax, array methods, closures, promises, async/await & DOM APIs',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['ES6 Features', 'Arrays & Objects', 'Asynchronous JS', 'DOM Manipulation'],
    },
    {
      id: 'pyfs-mod-4',
      moduleNumber: 4,
      moduleName: 'Python Core, Control Flow & Data Structures',
      topic: 'Python',
      description: 'Python syntax, control flow (if/else, loops), lists, tuples, dictionaries, sets & comprehensions',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Variables & Types', 'Loops & Conditionals', 'Data Structures', 'Comprehensions'],
    },
    {
      id: 'pyfs-mod-5',
      moduleNumber: 5,
      moduleName: 'Python OOP, Functions, Modules & Exception Handling',
      topic: 'Python',
      description: 'Classes, inheritance, polymorphism, encapsulation, magic methods, custom exceptions & file I/O',
      durationWeeks: 3,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['Object-Oriented Programming', 'Inheritance', 'Exception Handling', 'File I/O'],
    },
    {
      id: 'pyfs-mod-6',
      moduleNumber: 6,
      moduleName: 'React.js Components, Hooks & State Management',
      topic: 'React',
      description: 'JSX, functional components, props, useState, useEffect, custom hooks & component lifecycle',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['JSX & Components', 'React Hooks', 'State & Props', 'Component Lifecycle'],
    },
    {
      id: 'pyfs-mod-7',
      moduleNumber: 7,
      moduleName: 'Full Stack Integration & Capstone Project',
      topic: 'Python',
      additionalTopics: ['HTML', 'CSS', 'JavaScript', 'React', 'Python'],
      description: 'Comprehensive end-to-end full stack assessment combining frontend React, JavaScript, HTML/CSS and Python backend APIs',
      durationWeeks: 3,
      suggestedDuration: 45,
      suggestedQuestions: 25,
      subtopics: ['Full Stack Architecture', 'REST APIs', 'Data Flow', 'Database Persistence'],
    },
  ],

  // Official Syllabus from 1782194437_AI_Java_Full_Stack_Program.docx
  'AI Java Program': [
    {
      id: 'aijava-mod-1',
      moduleNumber: 1,
      moduleName: 'Computer & Programming Fundamentals',
      topic: 'Java',
      description: 'Computer concepts, SDLC, algorithms, flowcharts, pseudocode, variables, data types, decision making & loops',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['SDLC', 'Algorithms & Flowcharts', 'Variables & Types', 'Loops & Functions'],
    },
    {
      id: 'aijava-mod-2',
      moduleNumber: 2,
      moduleName: 'Core Java Programming & OOP',
      topic: 'Java',
      description: 'JDK, JRE, JVM, control statements, arrays, strings, method overloading, OOP (classes, objects, inheritance, polymorphism, encapsulation, abstraction), interfaces & packages',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['JVM Architecture', 'Control Flow', 'Arrays & Strings', 'OOP Principles', 'Interfaces & Packages'],
    },
    {
      id: 'aijava-mod-3',
      moduleNumber: 3,
      moduleName: 'Advanced Java, Collections & JDBC',
      topic: 'Java',
      description: 'Collections Framework (ArrayList, LinkedList, HashMap, HashSet, TreeMap), Multithreading, synchronization, Java I/O streams & JDBC database connectivity',
      durationWeeks: 2,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Collections Framework', 'Multithreading & Sync', 'Java I/O & Serialization', 'JDBC CRUD Operations'],
    },
    {
      id: 'aijava-mod-4',
      moduleNumber: 4,
      moduleName: 'Front-End Development (HTML5, CSS3, Bootstrap 5 & JS)',
      topic: 'HTML',
      additionalTopics: ['HTML', 'CSS', 'JavaScript'],
      description: 'HTML5 forms & tables, CSS3 Flexbox & Grid, responsive UI, Bootstrap 5 components, JavaScript DOM manipulation, event handling & AJAX basics',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['HTML5 Semantic Elements', 'CSS3 Flexbox & Grid', 'Bootstrap 5', 'JavaScript DOM & Events'],
    },
    {
      id: 'aijava-mod-5',
      moduleNumber: 5,
      moduleName: 'MySQL Database & Advanced SQL',
      topic: 'Java',
      description: 'DBMS & RDBMS concepts, ER diagrams, database design, CRUD operations, joins, views, stored procedures, triggers & indexing in MySQL',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['RDBMS & ER Diagrams', 'CRUD & Constraints', 'Advanced Joins', 'Stored Procedures & Triggers'],
    },
    {
      id: 'aijava-mod-6',
      moduleNumber: 6,
      moduleName: 'Spring Boot Framework & Spring Data JPA',
      topic: 'Java',
      description: 'Spring fundamentals, Dependency Injection, Spring Boot setup, Maven, Spring MVC controllers, Spring Data JPA entity mapping, CRUD & Spring Security/JWT',
      durationWeeks: 4,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['Dependency Injection', 'Spring Boot Setup', 'Spring MVC', 'Spring Data JPA', 'Spring Security & JWT'],
    },
    {
      id: 'aijava-mod-7',
      moduleNumber: 7,
      moduleName: 'REST API & Backend Integration',
      topic: 'Java',
      description: 'REST API architecture, HTTP methods, Postman testing, Spring REST CRUD APIs, exception handling, third-party API integration (Payment Gateway, SMS, Email)',
      durationWeeks: 2,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['REST API Architecture', 'Postman Testing', 'Exception Handling', 'Payment & SMS API Integration'],
    },
    {
      id: 'aijava-mod-8',
      moduleNumber: 8,
      moduleName: 'AI Tools for Developers & Prompt Engineering',
      topic: 'Java',
      description: 'ChatGPT, Claude AI, Gemini, DeepSeek, GitHub Copilot, prompt engineering, AI code generation, debugging, automated documentation & unit testing',
      durationWeeks: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Prompt Engineering', 'AI Code Generation', 'AI Debugging', 'Automated Test Generation'],
    },
    {
      id: 'aijava-mod-9',
      moduleNumber: 9,
      moduleName: 'DevOps & Deployment Fundamentals',
      topic: 'Java',
      description: 'Git, GitHub version control, branching, merging, Maven & Gradle build tools, VPS hosting, cloud deployment basics & CI/CD introduction',
      durationWeeks: 1,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Git & GitHub', 'Branching & PRs', 'Maven & Gradle', 'VPS Hosting & CI/CD'],
    },
    {
      id: 'aijava-mod-10',
      moduleNumber: 10,
      moduleName: 'Industry Capstone Projects (Job Portal & ERP/HRMS)',
      topic: 'Java',
      additionalTopics: ['Java', 'HTML', 'CSS', 'JavaScript'],
      description: '20+ Mini Projects and 2 Enterprise Major Projects: Job Portal Application and ERP & HRMS System with payroll, attendance & analytics',
      durationWeeks: 2,
      suggestedDuration: 45,
      suggestedQuestions: 25,
      subtopics: ['Job Portal System', 'ERP & HRMS Application', 'Full Stack Architecture', 'Cloud Deployment'],
    },
  ],

  'MERN Stack Development': [
    {
      id: 'mern-mod-1',
      moduleNumber: 1,
      moduleName: 'HTML5 Semantic Web & Modern Forms',
      topic: 'HTML',
      description: 'Semantic tags, HTML5 form validation, accessibility attributes, audio/video & canvas',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Semantic Tags', 'Web Forms', 'Multimedia', 'Accessibility'],
    },
    {
      id: 'mern-mod-2',
      moduleNumber: 2,
      moduleName: 'CSS3, Modern Layouts & Responsive UI',
      topic: 'CSS',
      description: 'CSS Grid, Flexbox, transitions, custom properties/variables & mobile-first responsive design',
      durationWeeks: 3,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['CSS Grid', 'Flexbox', 'Responsive Design', 'Animations'],
    },
    {
      id: 'mern-mod-3',
      moduleNumber: 3,
      moduleName: 'JavaScript ES6+, Asynchronous & APIs',
      topic: 'JavaScript',
      description: 'Arrow functions, destructuring, spread/rest, Promises, Fetch API, async/await & Event Loop',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['ES6 Syntax', 'Promises & Async', 'Fetch API', 'Array Methods'],
    },
    {
      id: 'mern-mod-4',
      moduleNumber: 4,
      moduleName: 'React.js Components, Props & Hooks',
      topic: 'React',
      description: 'Component architecture, useState, useEffect, useRef, useMemo, custom hooks & prop drilling solutions',
      durationWeeks: 4,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Components & JSX', 'React Hooks', 'State Management', 'Props'],
    },
    {
      id: 'mern-mod-5',
      moduleNumber: 5,
      moduleName: 'Node.js, Express & RESTful APIs',
      topic: 'JavaScript',
      description: 'Node.js runtime, Express router, middleware, JSON payloads, HTTP status codes & MongoDB integration',
      durationWeeks: 4,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['Express Routing', 'REST Architecture', 'Middleware', 'CRUD Operations'],
    },
  ],

  'Data Science': [
    {
      id: 'ds-mod-1',
      moduleNumber: 1,
      moduleName: 'Python for Data Analysis Fundamentals',
      topic: 'Python',
      description: 'Python syntax, control flow, functions, lambdas & data handling essentials',
      durationWeeks: 3,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Python Basics', 'Data Types', 'Functions', 'File Reading'],
    },
    {
      id: 'ds-mod-2',
      moduleNumber: 2,
      moduleName: 'NumPy & Vectorized Computing',
      topic: 'Data Science',
      description: 'Ndarrays, array slicing, mathematical operations, linear algebra & broadcasting',
      durationWeeks: 2,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Ndarrays', 'Vectorization', 'Array Indexing', 'Linear Algebra'],
    },
    {
      id: 'ds-mod-3',
      moduleNumber: 3,
      moduleName: 'Pandas DataFrames & Data Cleaning',
      topic: 'Data Science',
      description: 'Series, DataFrames, indexing, handling missing values, filtering, sorting, merging & groupby',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['DataFrames', 'Data Cleaning', 'Filtering & Querying', 'Groupby Aggregations'],
    },
    {
      id: 'ds-mod-4',
      moduleNumber: 4,
      moduleName: 'Data Visualization & Exploratory Analysis (EDA)',
      topic: 'Data Science',
      description: 'Statistical charts, correlation matrices, distribution analysis, outliers & visual storytelling',
      durationWeeks: 2,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Scatter & Bar Charts', 'Histograms', 'Heatmaps', 'Statistical Insights'],
    },
    {
      id: 'ds-mod-5',
      moduleNumber: 5,
      moduleName: 'Machine Learning Models & Evaluation Metrics',
      topic: 'Data Science',
      description: 'Supervised vs unsupervised learning, Linear/Logistic regression, decision trees, train-test split & metrics',
      durationWeeks: 4,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['Regression & Classification', 'Train-Test Split', 'Confusion Matrix', 'Model Accuracy'],
    },
  ],

  'Flutter Basic': [
    {
      id: 'flutter-mod-1',
      moduleNumber: 1,
      moduleName: 'Dart Language Basics & Control Flow',
      topic: 'Flutter',
      description: 'Dart variables, null safety, functions, conditional statements, loops & collections in Dart',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Dart Syntax', 'Null Safety', 'Functions & Lambdas', 'Dart Collections'],
    },
    {
      id: 'flutter-mod-2',
      moduleNumber: 2,
      moduleName: 'Flutter Widgets, Layouts & Material Design',
      topic: 'Flutter',
      description: 'Stateless vs Stateful widgets, Column, Row, Stack, Container, ListView, Scaffold & AppBar',
      durationWeeks: 3,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Stateless vs Stateful', 'Column & Row', 'ListView', 'Scaffold Layout'],
    },
    {
      id: 'flutter-mod-3',
      moduleNumber: 3,
      moduleName: 'State Management & Navigation',
      topic: 'Flutter',
      description: 'SetState, Provider, Riverpod, Navigator, named routes & passing arguments between screens',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['State Management', 'Provider', 'Navigator 2.0', 'Route Arguments'],
    },
    {
      id: 'flutter-mod-4',
      moduleNumber: 4,
      moduleName: 'REST API Integration, JSON & Storage',
      topic: 'Flutter',
      description: 'HTTP requests (get, post), async/await, FutureBuilder, jsonDecode & shared_preferences storage',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['HTTP Client', 'JSON Serialization', 'FutureBuilder', 'Local Persistence'],
    },
  ],

  'Cybersecurity Ethical Hacking Basic': [
    {
      id: 'cyber-mod-1',
      moduleNumber: 1,
      moduleName: 'Networking Fundamentals & Protocols',
      topic: 'Cybersecurity',
      description: 'OSI Model, TCP/IP, DNS, DHCP, HTTP/HTTPS, IP addressing, subnetting & port numbers',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['OSI Model', 'TCP/IP', 'Subnetting & Ports', 'Protocols'],
    },
    {
      id: 'cyber-mod-2',
      moduleNumber: 2,
      moduleName: 'Linux CLI & Security Essentials',
      topic: 'Cybersecurity',
      description: 'Linux file permissions (chmod/chown), process management, shell navigation & security auditing',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 20,
      subtopics: ['Linux Permissions', 'Process Control', 'Shell Commands', 'User Management'],
    },
    {
      id: 'cyber-mod-3',
      moduleNumber: 3,
      moduleName: 'Reconnaissance & Vulnerability Scanning',
      topic: 'Cybersecurity',
      description: 'Active/passive recon, Nmap port scanning, Wireshark packet capture & vulnerability discovery',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Port Scanning', 'Nmap Flags', 'Packet Inspection', 'Banner Grabbing'],
    },
    {
      id: 'cyber-mod-4',
      moduleNumber: 4,
      moduleName: 'Web App Security & OWASP Top 10',
      topic: 'Cybersecurity',
      description: 'SQL Injection, Cross-Site Scripting (XSS), CSRF, broken access control & defensive mitigation',
      durationWeeks: 3,
      suggestedDuration: 35,
      suggestedQuestions: 20,
      subtopics: ['SQL Injection', 'XSS Vulnerabilities', 'Authentication Bypass', 'OWASP Standards'],
    },
  ],

  'Accounting Software Tally PRIME': [
    {
      id: 'tally-mod-1',
      moduleNumber: 1,
      moduleName: 'Principles of Accounting & Golden Rules',
      topic: 'Tally PRIME',
      description: 'Double entry bookkeeping, Golden Rules (Real, Personal, Nominal accounts), journal entries & ledger posting',
      durationWeeks: 2,
      suggestedDuration: 20,
      suggestedQuestions: 15,
      subtopics: ['Accounting Principles', 'Golden Rules', 'Journalizing', 'Ledger Accounts'],
    },
    {
      id: 'tally-mod-2',
      moduleNumber: 2,
      moduleName: 'Company Creation & Masters in Tally',
      topic: 'Tally PRIME',
      description: 'Setting up new companies in Tally, creating ledger accounts, account groups & opening balances',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Company Creation', 'Account Groups', 'Ledger Creation', 'F11 / F12 Features'],
    },
    {
      id: 'tally-mod-3',
      moduleNumber: 3,
      moduleName: 'Voucher Entry & Financial Transactions',
      topic: 'Tally PRIME',
      description: 'Payment, Receipt, Contra, Sales, Purchase & Journal vouchers, bank reconciliation statements',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Voucher Types', 'Contra Vouchers', 'Bank Reconciliation', 'Cheque Printing'],
    },
    {
      id: 'tally-mod-4',
      moduleNumber: 4,
      moduleName: 'GST Compliance & Taxation Invoicing',
      topic: 'Tally PRIME',
      description: 'CGST, SGST, IGST tax structures, GST invoicing, HSN/SAC codes, tax rates & GSTR report generation',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['GST Configuration', 'Tax Invoices', 'HSN Codes', 'GSTR-1 & GSTR-3B'],
    },
  ],

  'Software Testing (Manual & Automation)': [
    {
      id: 'test-mod-1',
      moduleNumber: 1,
      moduleName: 'Software Testing Fundamentals & SDLC/STLC',
      topic: 'Software Testing & C',
      description: 'Quality assurance vs control, SDLC models (Waterfall, Agile), STLC phases, verification & validation',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['STLC Phases', 'SDLC Models', 'Verification vs Validation', 'QA Principles'],
    },
    {
      id: 'test-mod-2',
      moduleNumber: 2,
      moduleName: 'Test Case Design & Quality Techniques',
      topic: 'Software Testing & C',
      description: 'Equivalence Partitioning, Boundary Value Analysis (BVA), decision table, use cases & test matrices',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Boundary Value Analysis', 'Equivalence Partitioning', 'Test Case Structure'],
    },
    {
      id: 'test-mod-3',
      moduleNumber: 3,
      moduleName: 'Defect Tracking & Bug Lifecycle',
      topic: 'Software Testing & C',
      description: 'Defect logging, bug lifecycle states (New, Assigned, Open, Fixed, Closed), severity vs priority & Jira metrics',
      durationWeeks: 2,
      suggestedDuration: 25,
      suggestedQuestions: 15,
      subtopics: ['Bug Lifecycle', 'Severity vs Priority', 'Defect Triage', 'Test Reports'],
    },
    {
      id: 'test-mod-4',
      moduleNumber: 4,
      moduleName: 'Automation Testing Foundations with Java',
      topic: 'Java',
      description: 'Java programming for automation, WebDriver element locators (xpath, css), assertions & test runner setup',
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: ['Selenium Basics', 'Element Locators', 'Test Assertions', 'Java OOP for QA'],
    },
  ],
};

// Explicit Course Alias Registrations so any course format matches instantly
COURSE_SYLLABUS_REGISTRY['AI Java Full Stack Program'] = COURSE_SYLLABUS_REGISTRY['AI Java Program'];
COURSE_SYLLABUS_REGISTRY['AI Python Full Stack Program'] = COURSE_SYLLABUS_REGISTRY['AI Python Full Stack Program'];
COURSE_SYLLABUS_REGISTRY['HTML'] = COURSE_SYLLABUS_REGISTRY['HTML Course Syllabus'];
COURSE_SYLLABUS_REGISTRY['HTML5'] = COURSE_SYLLABUS_REGISTRY['HTML Course Syllabus'];
COURSE_SYLLABUS_REGISTRY['Web Tech'] = COURSE_SYLLABUS_REGISTRY['HTML Course Syllabus'];
COURSE_SYLLABUS_REGISTRY['Basic Python'] = COURSE_SYLLABUS_REGISTRY['AI Python Full Stack Program'];
COURSE_SYLLABUS_REGISTRY['Advanced Python'] = COURSE_SYLLABUS_REGISTRY['AI Python Full Stack Program'];
COURSE_SYLLABUS_REGISTRY['Core Java'] = COURSE_SYLLABUS_REGISTRY['AI Java Program'];
COURSE_SYLLABUS_REGISTRY['Advanced Java'] = COURSE_SYLLABUS_REGISTRY['AI Java Program'];
COURSE_SYLLABUS_REGISTRY['Data Science & Machine Learning'] = COURSE_SYLLABUS_REGISTRY['Data Science'];
COURSE_SYLLABUS_REGISTRY['Flutter Expert'] = COURSE_SYLLABUS_REGISTRY['Flutter Basic'];
COURSE_SYLLABUS_REGISTRY['Cybersecurity Ethical Hacking Expert'] = COURSE_SYLLABUS_REGISTRY['Cybersecurity Ethical Hacking Basic'];

// Curated keyword and subtopic dictionary for granular module filtering
const MODULE_KEYWORD_RULES: Record<string, { subtopic: string; keywords: string[] }[]> = {
  HTML: [
    {
      subtopic: 'Introduction & Structure',
      keywords: ['doctype', '<!doctype', '<html>', '<head>', '<body>', 'comment', 'root element', 'meta charset', 'utf-8', 'title tag', 'structure', 'lang attribute', 'html5'],
    },
    {
      subtopic: 'Text Formatting Elements',
      keywords: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'heading', 'paragraph', '<p>', 'preformatted', '<pre>', 'horizontal rule', '<hr>', 'line break', '<br>'],
    },
    {
      subtopic: 'Text Styling & Semantic Tags',
      keywords: ['bold', '<b>', 'strong', '<strong>', 'italic', '<i>', 'emphasis', '<em>', 'small', '<small>', 'mark', '<mark>', 'del', '<del>', 'ins', '<ins>', 'sup', '<sup>', 'sub', '<sub>', 'quote', '<q>', 'abbr', '<abbr>'],
    },
    {
      subtopic: 'Lists & Navigation',
      keywords: ['ordered list', '<ol>', 'unordered list', '<ul>', '<li>', 'nested list', 'bullet', 'list-style'],
    },
    {
      subtopic: 'Hyperlinks & Media',
      keywords: ['hyperlink', 'anchor', '<a>', 'href', 'target', '_blank', '_self', 'mailto', 'img', 'image', 'src', 'alt', 'picture', 'figure', 'figcaption'],
    },
    {
      subtopic: 'Tables & Tabular Data',
      keywords: ['table', '<tr>', '<th>', '<td>', 'rowspan', 'colspan', 'cellpadding', 'cellspacing', 'caption', 'thead', 'tbody', 'tfoot'],
    },
    {
      subtopic: 'Inline CSS & Styling',
      keywords: ['inline css', 'style attribute', 'background-color', 'font-family', 'font-size', 'text-align', 'border', 'color:'],
    },
    {
      subtopic: 'Containers & Div/Span',
      keywords: ['division', '<div>', 'span', '<span>', 'id attribute', 'class attribute', 'block-level', 'inline-level', 'container', 'layout'],
    },
    {
      subtopic: 'Forms, Inputs & Controls',
      keywords: ['form', '<form>', 'input', 'textbox', 'password', 'radio', 'checkbox', 'select', 'dropdown', 'textarea', 'submit', 'reset', 'action', 'method', 'placeholder', 'required'],
    },
    {
      subtopic: 'Semantic HTML5 Architecture',
      keywords: ['semantic', '<header>', '<nav>', '<section>', '<article>', '<aside>', '<footer>', '<main>', 'seo', 'accessibility', 'aria'],
    },
  ],
  CSS: [
    {
      subtopic: 'Selectors & Specificity',
      keywords: ['selector', 'class selector', 'id selector', 'pseudo-class', 'pseudo-element', 'specificity', 'cascade', 'universal selector', 'hover', 'active', 'focus'],
    },
    {
      subtopic: 'Typography & Colors',
      keywords: ['font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'color', 'hex', 'rgb', 'rgba', 'hsl', 'letter-spacing'],
    },
    {
      subtopic: 'Box Model',
      keywords: ['box model', 'margin', 'padding', 'border', 'content-box', 'border-box', 'box-sizing', 'outline'],
    },
    {
      subtopic: 'Display & Positioning',
      keywords: ['display', 'position', 'relative', 'absolute', 'fixed', 'sticky', 'static', 'z-index', 'overflow', 'visibility'],
    },
    {
      subtopic: 'Flexbox Layout',
      keywords: ['flex', 'flexbox', 'justify-content', 'align-items', 'flex-direction', 'flex-wrap', 'gap', 'flex-grow', 'flex-shrink', 'align-content'],
    },
    {
      subtopic: 'CSS Grid',
      keywords: ['grid', 'grid-template', 'fr', 'grid-gap', 'grid-area', 'repeat', 'minmax', 'grid-column', 'grid-row'],
    },
    {
      subtopic: 'Responsive Design & Media Queries',
      keywords: ['@media', 'media query', 'viewport', 'max-width', 'min-width', 'responsive', 'mobile-first', 'breakpoint', 'rem', 'em', 'vh', 'vw'],
    },
    {
      subtopic: 'Transitions & Transforms',
      keywords: ['transition', 'transform', 'translate', 'rotate', 'scale', 'skew', 'ease-in', 'timing-function'],
    },
    {
      subtopic: 'Animations & Keyframes',
      keywords: ['@keyframes', 'animation', 'animation-duration', 'infinite', 'iteration-count', 'keyframes'],
    },
    {
      subtopic: 'Variables & Modern CSS',
      keywords: ['var(--', 'custom property', 'calc()', 'tailwind', 'bootstrap', 'clamp()', 'css variable'],
    },
  ],
  JavaScript: [
    {
      subtopic: 'Variables & Data Types',
      keywords: ['let', 'const', 'var', 'typeof', 'primitive', 'number', 'string', 'boolean', 'null', 'undefined', 'symbol', 'bigint', 'nan'],
    },
    {
      subtopic: 'Conditionals & Loops',
      keywords: ['if', 'else', 'switch', 'case', 'for', 'while', 'do-while', 'break', 'continue', 'ternary', 'for...in', 'for...of'],
    },
    {
      subtopic: 'Functions & Scope',
      keywords: ['function', 'arrow function', '=>', 'parameter', 'return', 'scope', 'closure', 'hoisting', 'callback', 'iife'],
    },
    {
      subtopic: 'Arrays & Array Methods',
      keywords: ['array', 'push', 'pop', 'shift', 'unshift', 'map', 'filter', 'reduce', 'forEach', 'find', 'slice', 'splice', 'includes', 'concat'],
    },
    {
      subtopic: 'Objects & JSON',
      keywords: ['object', 'key', 'value', 'json', 'stringify', 'parse', 'destructuring', 'spread', 'rest', 'entries', 'freeze'],
    },
    {
      subtopic: 'DOM Manipulation',
      keywords: ['dom', 'document', 'getelementbyid', 'queryselector', 'innerhtml', 'textcontent', 'classlist', 'createelement', 'appendchild', 'remove'],
    },
    {
      subtopic: 'Events & Listeners',
      keywords: ['event', 'addeventlistener', 'click', 'submit', 'preventdefault', 'stoppropagation', 'bubbling', 'capturing', 'target'],
    },
    {
      subtopic: 'Async Programming & Promises',
      keywords: ['asynchronous', 'settimeout', 'setinterval', 'promise', 'then', 'catch', 'resolve', 'reject', 'event loop', 'microtask'],
    },
    {
      subtopic: 'Async/Await & Fetch API',
      keywords: ['async', 'await', 'fetch', 'http', 'api', 'response', 'json()', 'try...catch', 'status code'],
    },
    {
      subtopic: 'ES6+ Classes & Modules',
      keywords: ['class', 'constructor', 'extends', 'super', 'import', 'export', 'template literal', 'optional chaining', 'nullish coalescing'],
    },
  ],
  Java: [
    {
      subtopic: 'JVM & Fundamentals',
      keywords: ['jvm', 'jdk', 'jre', 'bytecode', 'main', 'classloader', 'garbage collector', 'compilation', 'syntax', 'sdlc', 'algorithm'],
    },
    {
      subtopic: 'Data Types & Control Flow',
      keywords: ['primitive', 'data type', 'type casting', 'operator', 'if-else', 'switch', 'for', 'while', 'break', 'continue'],
    },
    {
      subtopic: 'Classes, Objects & Constructors',
      keywords: ['class', 'object', 'constructor', 'this keyword', 'new keyword', 'static', 'method', 'overloading', 'instance'],
    },
    {
      subtopic: 'OOP - Inheritance & Polymorphism',
      keywords: ['inheritance', 'extends', 'super', 'polymorphism', 'overriding', 'runtime polymorphism', 'dynamic binding'],
    },
    {
      subtopic: 'OOP - Abstraction & Interfaces',
      keywords: ['abstract', 'interface', 'implements', 'encapsulation', 'access modifier', 'private', 'protected', 'public', 'package'],
    },
    {
      subtopic: 'Exceptions & File I/O',
      keywords: ['exception', 'try', 'catch', 'finally', 'throw', 'throws', 'checked exception', 'unchecked', 'io', 'stream', 'file'],
    },
    {
      subtopic: 'Collections Framework',
      keywords: ['collection', 'list', 'arraylist', 'linkedlist', 'set', 'hashset', 'map', 'hashmap', 'treemap', 'iterator', 'generics'],
    },
    {
      subtopic: 'Multithreading & Concurrency',
      keywords: ['thread', 'runnable', 'synchronized', 'lock', 'deadlock', 'concurrency', 'executor', 'callable', 'future', 'sleep'],
    },
    {
      subtopic: 'Database, SQL & JDBC',
      keywords: ['jdbc', 'connection', 'statement', 'preparedstatement', 'resultset', 'sql', 'rdbms', 'crud', 'database', 'join'],
    },
    {
      subtopic: 'Spring Boot & Microservices',
      keywords: ['spring', 'spring boot', 'dependency injection', 'autowired', 'restcontroller', 'jpa', 'hibernate', 'microservice', 'api'],
    },
  ],
  Python: [
    {
      subtopic: 'Basics & Syntax',
      keywords: ['python', 'print', 'variable', 'data type', 'int', 'float', 'str', 'bool', 'input', 'comment', 'indentation'],
    },
    {
      subtopic: 'Conditionals & Operators',
      keywords: ['if', 'elif', 'else', 'and', 'or', 'not', 'arithmetic', 'comparison', 'identity', 'membership'],
    },
    {
      subtopic: 'Loops & Iterations',
      keywords: ['for loop', 'while loop', 'range()', 'break', 'continue', 'pass', 'enumerate', 'nested loop'],
    },
    {
      subtopic: 'Strings & Slicing',
      keywords: ['string', 'slice', 'upper', 'lower', 'strip', 'split', 'join', 'format', 'f-string', 'replace'],
    },
    {
      subtopic: 'Lists & Tuples',
      keywords: ['list', 'tuple', 'append', 'extend', 'pop', 'sort', 'comprehension', 'immutable', 'index'],
    },
    {
      subtopic: 'Dictionaries & Sets',
      keywords: ['dict', 'dictionary', 'set', 'keys', 'values', 'items', 'get', 'union', 'intersection', 'key-value'],
    },
    {
      subtopic: 'Functions & Lambdas',
      keywords: ['def', 'function', 'return', 'lambda', '*args', '**kwargs', 'scope', 'recursion', 'parameter'],
    },
    {
      subtopic: 'File Handling & Modules',
      keywords: ['open()', 'read()', 'write()', 'with statement', 'file', 'import', 'math', 'os', 'random', 'sys'],
    },
    {
      subtopic: 'Exception Handling',
      keywords: ['try', 'except', 'finally', 'raise', 'exception', 'zero_division', 'value_error', 'custom exception'],
    },
    {
      subtopic: 'Object-Oriented Programming (OOP)',
      keywords: ['class', '__init__', 'self', 'inheritance', 'polymorphism', 'encapsulation', 'method', 'dunder', 'super()'],
    },
  ],
  React: [
    {
      subtopic: 'JSX & Components',
      keywords: ['jsx', 'component', 'functional component', 'virtual dom', 'render', 'fragment', 'react element'],
    },
    {
      subtopic: 'Props & State (useState)',
      keywords: ['props', 'state', 'usestate', 'setstate', 'pass data', 'destructuring props', 'immutable state'],
    },
    {
      subtopic: 'Effects & Lifecycle (useEffect)',
      keywords: ['useeffect', 'lifecycle', 'dependency array', 'cleanup function', 'componentdidmount', 'fetch in useeffect'],
    },
    {
      subtopic: 'Forms & Events',
      keywords: ['controlled component', 'uncontrolled', 'form', 'onchange', 'onsubmit', 'event.target.value', 'useref'],
    },
    {
      subtopic: 'Lists & Keys',
      keywords: ['key prop', 'map() in jsx', 'list rendering', 'unique key', 're-rendering'],
    },
    {
      subtopic: 'Context API & State Management',
      keywords: ['context', 'createcontext', 'usecontext', 'provider', 'redux', 'zustand', 'global state', 'prop drilling'],
    },
    {
      subtopic: 'React Router & Navigation',
      keywords: ['react router', 'route', 'routes', 'link', 'navlink', 'usenavigate', 'useparams', 'browserrouter'],
    },
    {
      subtopic: 'Performance & Custom Hooks',
      keywords: ['custom hook', 'usememo', 'usecallback', 'memo', 'lazy', 'suspense', 'optimization'],
    },
  ],
};

const STORAGE_PROGRESS_KEY = 'wegrow_batch_syllabus_progress_v1';
const STORAGE_CUSTOM_MODULES_KEY = 'wegrow_custom_course_modules_v1';
const STORAGE_CUSTOM_SYLLABUS_FILES_KEY = 'wegrow_custom_syllabus_files_v1';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
};

/**
 * Service to manage course syllabi, batch progress, and module assessment questions
 */
export const syllabusProgressService = {
  /**
   * Get all courses grouped by category
   */
  getCoursesByCategory() {
    return CATEGORIZED_COURSES;
  },

  /**
   * Get all course names across the academy
   */
  getAllCourses(): string[] {
    const list: string[] = [];
    CATEGORIZED_COURSES.forEach((group) => {
      group.courses.forEach((c) => {
        if (!list.includes(c)) list.push(c);
      });
    });
    return list;
  },

  /**
   * Fetch all courses syllabus catalog asynchronously with fallback
   */
  async getAllCoursesSyllabusAsync(): Promise<any[]> {
    try {
      const res = await fetch('/data/all_courses_syllabus.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Could not load /data/all_courses_syllabus.json, falling back to static registry', err);
    }

    return Object.entries(COURSE_SYLLABUS_REGISTRY).map(([courseName, modules], idx) => ({
      id: `course-${idx + 1}`,
      course_name: courseName,
      category: 'Professional Training',
      duration_months: modules.length > 6 ? 6 : 3,
      course_fee: 30000,
      description: `Official WeGrow curriculum for ${courseName}`,
      modules: modules,
    }));
  },

  /**
   * Get structured modules for a course (checking custom additions first)
   */
  getModulesForCourse(courseName: string): CourseModuleDef[] {
    // 1. Check custom user-added modules in local storage
    try {
      const stored = safeStorage.getItem(STORAGE_CUSTOM_MODULES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[courseName] && Array.isArray(parsed[courseName]) && parsed[courseName].length > 0) {
          return parsed[courseName];
        }
      }
    } catch {}

    // 2. Check static database registry
    if (COURSE_SYLLABUS_REGISTRY[courseName]) {
      return COURSE_SYLLABUS_REGISTRY[courseName];
    }

    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/full[\s_-]*stack/g, '')
        .replace(/program|course|syllabus|training|expert|basic|intermediate|master/g, '')
        .replace(/[^a-z0-9]/g, '');

    const targetClean = clean(courseName);

    // Direct clean match
    for (const [key, mods] of Object.entries(COURSE_SYLLABUS_REGISTRY)) {
      if (clean(key) === targetClean) {
        return mods;
      }
    }

    // Partial clean match
    for (const [key, mods] of Object.entries(COURSE_SYLLABUS_REGISTRY)) {
      const kClean = clean(key);
      if (targetClean.includes(kClean) || kClean.includes(targetClean)) {
        return mods;
      }
    }

    const lower = courseName.toLowerCase();
    if (lower.includes('advanced python')) {
      return OFFICIAL_6_COURSES_REGISTRY['Advanced Python Course'] || [];
    }
    if (lower.includes('basic python') || (lower.includes('python') && !lower.includes('full') && !lower.includes('advanced'))) {
      return OFFICIAL_6_COURSES_REGISTRY['Basic Python Course'] || [];
    }
    if (lower.includes('advanced java')) {
      return OFFICIAL_6_COURSES_REGISTRY['Advanced Java Syllabus'] || [];
    }
    if (lower.includes('basic java') || (lower.includes('java') && !lower.includes('full') && !lower.includes('advanced'))) {
      return OFFICIAL_6_COURSES_REGISTRY['Basic Java Course'] || [];
    }
    if (lower.includes('full') && lower.includes('python')) {
      return OFFICIAL_6_COURSES_REGISTRY['Full Stack AI Python'] || [];
    }
    if (lower.includes('full') && lower.includes('java')) {
      return OFFICIAL_6_COURSES_REGISTRY['Full Stack AI Java'] || [];
    }

    if (lower.includes('html') || lower.includes('web tech')) {
      return COURSE_SYLLABUS_REGISTRY['HTML Course Syllabus'] || [];
    }
    if (lower.includes('java')) {
      return COURSE_SYLLABUS_REGISTRY['AI Java Program'] || COURSE_SYLLABUS_REGISTRY['AI Java Full Stack Program'] || [];
    }
    if (lower.includes('python')) {
      return COURSE_SYLLABUS_REGISTRY['AI Python Full Stack Program'] || [];
    }
    if (lower.includes('mern') || lower.includes('react')) {
      return COURSE_SYLLABUS_REGISTRY['MERN Stack Development'] || [];
    }
    if (lower.includes('data')) {
      return COURSE_SYLLABUS_REGISTRY['Data Science'] || [];
    }
    if (lower.includes('flutter')) {
      return COURSE_SYLLABUS_REGISTRY['Flutter Basic'] || [];
    }
    if (lower.includes('cyber') || lower.includes('hack')) {
      return COURSE_SYLLABUS_REGISTRY['Cybersecurity Ethical Hacking Basic'] || [];
    }
    if (lower.includes('tally')) {
      return COURSE_SYLLABUS_REGISTRY['Accounting Software Tally PRIME'] || [];
    }

    // Dynamic fallback generation based on COURSE_TO_TOPICS_MAP
    const mappedTopics = COURSE_TO_TOPICS_MAP[courseName] || ['HTML', 'CSS', 'JavaScript'];
    const generated: CourseModuleDef[] = mappedTopics.map((topic, idx) => ({
      id: `dyn-mod-${idx + 1}-${topic.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      moduleNumber: idx + 1,
      moduleName: `Module ${idx + 1}: ${topic} Core Competency`,
      topic: topic,
      description: `Comprehensive module assessment covering key concepts, best practices & problem solving in ${topic}`,
      durationWeeks: 3,
      suggestedDuration: 30,
      suggestedQuestions: 20,
      subtopics: [topic],
    }));

    if (mappedTopics.length > 1) {
      generated.push({
        id: `dyn-mod-comprehensive`,
        moduleNumber: generated.length + 1,
        moduleName: `Module ${generated.length + 1}: Full Course Comprehensive Assessment`,
        topic: mappedTopics[0],
        additionalTopics: mappedTopics,
        description: `Final integrated assessment evaluating cumulative mastery across all course modules (${mappedTopics.join(', ')})`,
        durationWeeks: 3,
        suggestedDuration: 45,
        suggestedQuestions: 25,
      });
    }

    return generated;
  },

  /**
   * Save a newly added syllabus module to a course (for future syllabus expansion)
   */
  saveCustomModule(courseName: string, newMod: CourseModuleDef): CourseModuleDef[] {
    try {
      const stored = safeStorage.getItem(STORAGE_CUSTOM_MODULES_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      const current = parsed[courseName] || this.getModulesForCourse(courseName);
      const updated = [...current, newMod];
      parsed[courseName] = updated;
      safeStorage.setItem(STORAGE_CUSTOM_MODULES_KEY, JSON.stringify(parsed));
      return updated;
    } catch (e) {
      console.error('Failed to save custom module', e);
      return [];
    }
  },

  /**
   * Get custom or attached syllabus file name for a course
   */
  getCourseSyllabusFile(courseName: string): string | null {
    try {
      const stored = safeStorage.getItem(STORAGE_CUSTOM_SYLLABUS_FILES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[courseName]) return parsed[courseName];
      }
    } catch {}
    return null;
  },

  /**
   * Attach/update a syllabus document file for a course (e.g. .pdf or .docx)
   */
  saveCourseSyllabusFile(courseName: string, fileName: string): void {
    try {
      const stored = safeStorage.getItem(STORAGE_CUSTOM_SYLLABUS_FILES_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      parsed[courseName] = fileName;
      safeStorage.setItem(STORAGE_CUSTOM_SYLLABUS_FILES_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save syllabus file', e);
    }
  },

  /**
   * Get progress for a specific batch and course
   */
  getBatchProgress(courseName: string, batchName: string): Record<string, ModuleProgressStatus> {
    try {
      const stored = safeStorage.getItem(STORAGE_PROGRESS_KEY);
      if (stored) {
        const records: Record<string, BatchProgressRecord> = JSON.parse(stored);
        const key = `${courseName}__${batchName}`;
        if (records[key]) {
          return records[key].modules;
        }
      }
    } catch {}

    // Default initialization: Module 1 is 'in_progress', others 'upcoming'
    const modules = this.getModulesForCourse(courseName);
    const defaults: Record<string, ModuleProgressStatus> = {};
    modules.forEach((m, idx) => {
      defaults[m.id] = {
        moduleId: m.id,
        status: idx === 0 ? 'in_progress' : 'upcoming',
      };
    });
    return defaults;
  },

  /**
   * Save batch progress
   */
  saveBatchProgress(courseName: string, batchName: string, modulesStatus: Record<string, ModuleProgressStatus>): void {
    try {
      const stored = safeStorage.getItem(STORAGE_PROGRESS_KEY);
      const records: Record<string, BatchProgressRecord> = stored ? JSON.parse(stored) : {};
      const key = `${courseName}__${batchName}`;
      records[key] = {
        courseName,
        batchName,
        modules: modulesStatus,
        updatedAt: new Date().toISOString(),
      };
      safeStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(records));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wegrow_syllabus_progress_updated'));
      }
    } catch (err) {
      console.error('Failed to save batch syllabus progress:', err);
    }
  },

  /**
   * Mentor marks a module as completed
   */
  markModuleCompleted(courseName: string, batchName: string, moduleId: string, mentorName = 'Faculty Mentor'): Record<string, ModuleProgressStatus> {
    const current = this.getBatchProgress(courseName, batchName);
    const updated = { ...current };

    updated[moduleId] = {
      ...(updated[moduleId] || { moduleId }),
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: mentorName,
    };

    // Automatically set the next module to 'in_progress' if it was 'upcoming'
    const allModules = this.getModulesForCourse(courseName);
    const currentIdx = allModules.findIndex((m) => m.id === moduleId);
    if (currentIdx >= 0 && currentIdx + 1 < allModules.length) {
      const nextMod = allModules[currentIdx + 1];
      if (!updated[nextMod.id] || updated[nextMod.id].status === 'upcoming') {
        updated[nextMod.id] = {
          ...(updated[nextMod.id] || { moduleId: nextMod.id }),
          status: 'in_progress',
        };
      }
    }

    this.saveBatchProgress(courseName, batchName, updated);
    return updated;
  },

  /**
   * Reset / Undo a module back to in_progress
   */
  markModuleInProgress(courseName: string, batchName: string, moduleId: string): Record<string, ModuleProgressStatus> {
    const current = this.getBatchProgress(courseName, batchName);
    const updated = { ...current };

    updated[moduleId] = {
      ...(updated[moduleId] || { moduleId }),
      status: 'in_progress',
      completedAt: undefined,
      completedBy: undefined,
    };

    this.saveBatchProgress(courseName, batchName, updated);
    return updated;
  },

  /**
   * Record that a test was conducted for this completed module
   */
  recordTestConducted(courseName: string, batchName: string, moduleId: string, testId: string, testPin?: string): Record<string, ModuleProgressStatus> {
    const current = this.getBatchProgress(courseName, batchName);
    const updated = { ...current };

    updated[moduleId] = {
      ...(updated[moduleId] || { moduleId }),
      status: 'completed',
      testConducted: true,
      testId,
      testPin,
      testConductedAt: new Date().toISOString(),
    };

    this.saveBatchProgress(courseName, batchName, updated);
    return updated;
  },

  /**
   * Check if a specific module is marked completed for this batch
   */
  isModuleCompletedForBatch(courseName: string, batchName: string, moduleId: string): boolean {
    const progress = this.getBatchProgress(courseName, batchName);
    return progress[moduleId]?.status === 'completed';
  },

  /**
   * Get overall progression summary for a batch
   */
  getBatchProgressionSummary(courseName: string, batchName: string) {
    const modules = this.getModulesForCourse(courseName);
    const progress = this.getBatchProgress(courseName, batchName);
    const completedCount = modules.filter((m) => progress[m.id]?.status === 'completed').length;
    const currentInProg = modules.find((m) => progress[m.id]?.status === 'in_progress') || modules[0];
    const percentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
    return {
      totalModules: modules.length,
      completedModules: completedCount,
      currentModule: currentInProg,
      percentage,
    };
  },

  /**
   * Get progress for a specific course
   */
  getCourseProgress(courseName: string): Record<string, ModuleProgressStatus> {
    return this.getBatchProgress(courseName, 'Main');
  },

  /**
   * Save course progress
   */
  saveCourseProgress(courseName: string, modulesStatus: Record<string, ModuleProgressStatus>): void {
    this.saveBatchProgress(courseName, 'Main', modulesStatus);
  },

  /**
   * Mentor ticks/marks a module as completed
   */
  markCourseModuleCompleted(courseName: string, moduleId: string, mentorName = 'Faculty Mentor'): Record<string, ModuleProgressStatus> {
    const updated = this.markModuleCompleted(courseName, 'Main', moduleId, mentorName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wegrow_course_module_completed', {
        detail: { courseName, moduleId, mentorName }
      }));
    }
    return updated;
  },

  /**
   * Untick / Mark a module back to in_progress
   */
  markCourseModuleInProgress(courseName: string, moduleId: string): Record<string, ModuleProgressStatus> {
    const updated = this.markModuleInProgress(courseName, 'Main', moduleId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wegrow_course_module_updated', {
        detail: { courseName, moduleId }
      }));
    }
    return updated;
  },

  /**
   * Check if a specific module is marked completed for this course
   */
  isCourseModuleCompleted(courseName: string, moduleId: string): boolean {
    const progress = this.getCourseProgress(courseName);
    return progress[moduleId]?.status === 'completed';
  },

  /**
   * Get overall progression summary for a course
   */
  getCourseProgressionSummary(courseName: string) {
    const modules = this.getModulesForCourse(courseName);
    const progress = this.getCourseProgress(courseName);
    const completedCount = modules.filter((m) => progress[m.id]?.status === 'completed').length;
    const currentInProg = modules.find((m) => progress[m.id]?.status === 'in_progress') || modules[0];
    const percentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
    return {
      totalModules: modules.length,
      completedModules: completedCount,
      pendingModules: modules.length - completedCount,
      currentModule: currentInProg,
      percentage,
      isFullyCompleted: completedCount === modules.length && modules.length > 0,
    };
  },

  /**
   * Pull matching questions for a module from the Central Question Bank
   */
  generateQuestionsForModule(params: {
    moduleDef: CourseModuleDef;
    questionCount?: number;
    difficultyMode?: 'balanced' | 'beginner' | 'advanced';
  }): ExamQuestion[] {
    const { moduleDef, questionCount = 20, difficultyMode = 'balanced' } = params;

    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    if (difficultyMode === 'balanced') {
      easyCount = Math.round(questionCount * 0.5);
      mediumCount = Math.round(questionCount * 0.35);
      hardCount = questionCount - easyCount - mediumCount;
    } else if (difficultyMode === 'beginner') {
      easyCount = Math.round(questionCount * 0.7);
      mediumCount = questionCount - easyCount;
      hardCount = 0;
    } else {
      easyCount = Math.round(questionCount * 0.2);
      mediumCount = Math.round(questionCount * 0.5);
      hardCount = questionCount - easyCount - mediumCount;
    }

    const topics = moduleDef.additionalTopics && moduleDef.additionalTopics.length > 0
      ? moduleDef.additionalTopics
      : [moduleDef.topic];

    const collected: ExamQuestion[] = [];
    const usedIds = new Set<string>();

    const fetchBucket = (difficulty: 'easy' | 'medium' | 'hard', count: number) => {
      if (count <= 0) return;
      const perTopic = Math.max(1, Math.ceil(count / topics.length));

      for (const t of topics) {
        if (collected.filter((q) => q.difficulty === difficulty).length >= count) break;
        const candidates = getEngineRandomQuestions({
          topic: t,
          difficulty: difficulty,
          count: perTopic * 2,
        });

        for (const c of candidates) {
          if (!usedIds.has(c.id)) {
            usedIds.add(c.id);
            collected.push(c);
            if (collected.filter((q) => q.difficulty === difficulty).length >= count) break;
          }
        }
      }
    };

    fetchBucket('easy', easyCount);
    fetchBucket('medium', mediumCount);
    fetchBucket('hard', hardCount);

    if (collected.length < questionCount) {
      const remaining = questionCount - collected.length;
      for (const t of topics) {
        const fillers = getEngineRandomQuestions({ topic: t, count: remaining * 2 });
        for (const f of fillers) {
          if (!usedIds.has(f.id)) {
            usedIds.add(f.id);
            collected.push(f);
            if (collected.length >= questionCount) break;
          }
        }
        if (collected.length >= questionCount) break;
      }
    }

    let result = [...collected].slice(0, questionCount);
    if (result.length === 0) {
      const fallbackTopic = (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('java')
        ? 'Java'
        : (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('react')
        ? 'React'
        : (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('html') || (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('web')
        ? 'HTML'
        : (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('css')
        ? 'CSS'
        : (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('js') || (moduleDef.moduleName + ' ' + (moduleDef.topic || '')).toLowerCase().includes('javascript')
        ? 'JavaScript'
        : 'Python';

      result = getEngineRandomQuestions({ topic: fallbackTopic, count: questionCount });
    }

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  },

  /**
   * Get all eligible questions from the Question Bank matching one or more syllabus modules
   */
  getQuestionsForMultipleModules(
    moduleDefs: CourseModuleDef[],
    allBankQuestions?: ExamQuestion[]
  ): ExamQuestion[] {
    const topics = new Set<string>();
    moduleDefs.forEach((m) => {
      if (m.topic) topics.add(m.topic);
      if (m.additionalTopics) {
        m.additionalTopics.forEach((t) => topics.add(t));
      }
    });

    if (topics.size === 0) topics.add('HTML');

    // Build search keywords & rules from selected moduleDefs
    const moduleSearchTerms: { subtopic: string; terms: string[] }[] = [];

    moduleDefs.forEach((m) => {
      // 1. From predefined keyword rules if topic matches
      const rules = MODULE_KEYWORD_RULES[m.topic] || [];
      const modNum = m.moduleNumber;
      if (rules[modNum - 1]) {
        moduleSearchTerms.push({
          subtopic: rules[modNum - 1].subtopic,
          terms: rules[modNum - 1].keywords,
        });
      } else {
        const matchingRule = rules.find((r) =>
          m.moduleName.toLowerCase().includes(r.subtopic.toLowerCase()) ||
          r.subtopic.toLowerCase().includes(m.moduleName.toLowerCase())
        );
        if (matchingRule) {
          moduleSearchTerms.push({
            subtopic: matchingRule.subtopic,
            terms: matchingRule.keywords,
          });
        }
      }

      // 2. From module subtopics & description
      const dynamicTerms: string[] = [];
      if (m.subtopics) {
        m.subtopics.forEach((st) => {
          st.toLowerCase()
            .split(/[,/&()]+/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 3)
            .forEach((term) => dynamicTerms.push(term));
        });
      }
      if (m.moduleName) {
        m.moduleName
          .toLowerCase()
          .replace(/module\s*\d+\s*:/gi, '')
          .split(/[,/&()]+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 3)
          .forEach((term) => dynamicTerms.push(term));
      }
      if (dynamicTerms.length > 0) {
        moduleSearchTerms.push({
          subtopic: m.moduleName.replace(/module\s*\d+\s*:/gi, '').trim() || m.moduleName,
          terms: dynamicTerms,
        });
      }
    });

    const matching: ExamQuestion[] = [];
    const seen = new Set<string>();

    // Candidate questions from the bank for selected topics
    const bankPool: ExamQuestion[] = [];
    if (allBankQuestions && allBankQuestions.length > 0) {
      allBankQuestions.forEach((q) => {
        if (topics.has(q.topic || '')) {
          bankPool.push(q);
        }
      });
    }

    // Match each question against moduleSearchTerms
    bankPool.forEach((q) => {
      const textToSearch = (
        (q.question_text || '') +
        ' ' +
        (q.explanation || '') +
        ' ' +
        (q.options || []).join(' ') +
        ' ' +
        (q.subtopic || '')
      ).toLowerCase();

      for (const group of moduleSearchTerms) {
        const hasMatch = group.terms.some((term) => textToSearch.includes(term.toLowerCase()));

        if (hasMatch) {
          if (!seen.has(q.id)) {
            seen.add(q.id);
            matching.push({
              ...q,
              subtopic: q.subtopic || group.subtopic,
            });
          }
          break;
        }
      }
    });

    // If specific module keyword filtering found good matches (at least 8), return those
    if (matching.length >= 8) {
      return matching;
    }

    // If few or no keyword matches, include broader bank questions with assigned subtopics
    bankPool.forEach((q) => {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        const assignedSubtopic = moduleSearchTerms[0]?.subtopic || q.topic || 'General';
        matching.push({
          ...q,
          subtopic: q.subtopic || assignedSubtopic,
        });
      }
    });

    // Supplement from engine if needed
    if (matching.length < 20) {
      topics.forEach((t) => {
        const extra = getEngineRandomQuestions({ topic: t, count: 30 });
        extra.forEach((q) => {
          if (!seen.has(q.id)) {
            seen.add(q.id);
            const assignedSubtopic = moduleSearchTerms[0]?.subtopic || q.topic || 'General';
            matching.push({
              ...q,
              subtopic: q.subtopic || assignedSubtopic,
            });
          }
        });
      });
    }

    return matching;
  },

  /**
   * Swap a single question with another matching question from the Central Question Bank
   */
  swapSingleQuestion(
    currentQuestion: ExamQuestion,
    existingQuestionIds: string[]
  ): ExamQuestion | null {
    const topic = currentQuestion.topic || 'Python';
    const difficulty = currentQuestion.difficulty || 'medium';
    const existingSet = new Set(existingQuestionIds);

    const candidates = getEngineRandomQuestions({
      topic: topic,
      difficulty: difficulty,
      count: 25,
    });

    for (const c of candidates) {
      if (!existingSet.has(c.id)) {
        return c;
      }
    }

    const topicFallbacks = getEngineRandomQuestions({
      topic: topic,
      count: 25,
    });
    for (const c of topicFallbacks) {
      if (!existingSet.has(c.id)) {
        return c;
      }
    }

    return null;
  },
};
