export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type SubmissionStatus = 'SUBMITTED' | 'GRADED';
export type ExamStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type ResultStatus = 'DRAFT' | 'PUBLISHED';
export type AnnouncementType = 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EXAM' | 'URGENT';
export type NotificationType = 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EXAM' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  role: Role;
  status?: UserStatus;
  name?: string;
  avatarUrl?: string;
  profileId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  status: UserStatus;
}

export interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  dateOfBirth: string;
  phone?: string;
  address?: string;
  admissionDate: string;
  status: UserStatus;
  departmentId: string;
  department?: Department;
  user?: User;
}

export interface Faculty {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  designation: string;
  status: UserStatus;
  departmentId: string;
  department?: Department;
  user?: User;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  status: UserStatus;
  departmentId: string;
  department?: Department;
  facultyId?: string;
  faculty?: Faculty;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  status: UserStatus;
  student?: Student;
  course?: Course;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  student?: Student;
  course?: Course;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  points: number;
  fileUrl?: string;
  fileName?: string;
  courseId: string;
  course?: Course;
  facultyId: string;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionDate: string;
  fileUrl: string;
  fileName: string;
  status: SubmissionStatus;
  grade?: string;
  feedback?: string;
  gradedAt?: string;
  gradedById?: string;
  student?: Student;
}

export interface Exam {
  id: string;
  courseId: string;
  name: string;
  examDate: string;
  startTime: string;
  endTime: string;
  location: string;
  maxMarks: number;
  status: ExamStatus;
  course?: Course;
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade: string;
  status: ResultStatus;
  remarks?: string;
  exam?: Exam;
  student?: Student;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  time: string;
  location: string;
  organizerId: string;
  status: UserStatus;
  registrations?: EventRegistration[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  registrationDate: string;
  status: UserStatus;
  event?: Event;
  student?: Student;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  courseId?: string;
  authorId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  type: NotificationType;
  createdAt: string;
}
