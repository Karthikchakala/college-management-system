import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/Courses';
import StudentAttendance from './pages/student/Attendance';
import StudentAssignments from './pages/student/Assignments';
import StudentResults from './pages/student/Results';
import StudentEvents from './pages/student/Events';
import StudentProfile from './pages/student/Profile';
import StudentNotifications from './pages/student/Notifications';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyCourses from './pages/faculty/Courses';
import FacultyAttendance from './pages/faculty/Attendance';
import FacultyAssignments from './pages/faculty/Assignments';
import FacultySubmissions from './pages/faculty/Submissions';
import FacultyAnnouncements from './pages/faculty/Announcements';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminDepartments from './pages/admin/Departments';
import AdminCourses from './pages/admin/Courses';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminReports from './pages/admin/Reports';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Access Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Student Routes */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="attendance" element={<StudentAttendance />} />
                    <Route path="assignments" element={<StudentAssignments />} />
                    <Route path="results" element={<StudentResults />} />
                    <Route path="events" element={<StudentEvents />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="notifications" element={<StudentNotifications />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Faculty Routes */}
          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<FacultyDashboard />} />
                    <Route path="courses" element={<FacultyCourses />} />
                    <Route path="attendance" element={<FacultyAttendance />} />
                    <Route path="assignments" element={<FacultyAssignments />} />
                    <Route path="submissions" element={<FacultySubmissions />} />
                    <Route path="announcements" element={<FacultyAnnouncements />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="faculty" element={<AdminFaculty />} />
                    <Route path="departments" element={<AdminDepartments />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="enrollments" element={<AdminEnrollments />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}
