import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnrollmentPage } from './pages/EnrollmentPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { CoursesPage } from './pages/CoursesPage';
import { EnquiryPage } from './pages/EnquiryPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { DailyReportsPage } from './pages/DailyReportsPage';
import { TasksPage } from './pages/TasksPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { PayrollPage } from './pages/PayrollPage';
import { TestsPage } from './pages/TestsPage';
import { CreditManagementPage } from './pages/CreditManagementPage';
import { StudentsManagementPage } from './pages/StudentsManagementPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

// Student Portal Pages
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { StudentTasksPage } from './pages/student/StudentTasksPage';
import { StudentDailyProcessPage } from './pages/student/StudentDailyProcessPage';
import { StudentSyllabusPage } from './pages/student/StudentSyllabusPage';
import { StudentTutorialsPage } from './pages/student/StudentTutorialsPage';
import { StudentProgressPage } from './pages/student/StudentProgressPage';
import { StudentCreditsPage } from './pages/student/StudentCreditsPage';
import { StudentTestsPage } from './pages/student/StudentTestsPage';
import { StudentTestResultsPage } from './pages/student/StudentTestResultsPage';
import { StudentFeedbackPage } from './pages/student/StudentFeedbackPage';
import { StudentSettingsPage } from './pages/student/StudentSettingsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c16] text-indigo-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment/training"
            element={
              <ProtectedRoute>
                <EnrollmentPage type="training" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment/internship"
            element={
              <ProtectedRoute>
                <EnrollmentPage type="internship" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <ProtectedRoute>
                <ReceiptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <RolesPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries"
            element={
              <ProtectedRoute>
                <EnquiryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <LeavesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-reports"
            element={
              <ProtectedRoute>
                <DailyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests"
            element={
              <ProtectedRoute>
                <TestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <PayrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-management"
            element={
              <ProtectedRoute>
                <CreditManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-settings"
            element={
              <ProtectedRoute>
                <ProfileSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Student Portal Routes */}
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tasks"
            element={
              <ProtectedRoute>
                <StudentTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/task-update"
            element={
              <ProtectedRoute>
                <StudentDailyProcessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/syllabus"
            element={
              <ProtectedRoute>
                <StudentSyllabusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/daily-process"
            element={
              <ProtectedRoute>
                <StudentDailyProcessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tutorials"
            element={
              <ProtectedRoute>
                <StudentTutorialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/progress"
            element={
              <ProtectedRoute>
                <StudentProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/credits"
            element={
              <ProtectedRoute>
                <StudentCreditsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests"
            element={
              <ProtectedRoute>
                <StudentTestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/test-results"
            element={
              <ProtectedRoute>
                <StudentTestResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/feedback"
            element={
              <ProtectedRoute>
                <StudentFeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/settings"
            element={
              <ProtectedRoute>
                <StudentSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
