import { PrismaClient, Role, AttendanceStatus, SubmissionStatus, ExamStatus, ResultStatus, AnnouncementType, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset database (order matters because of foreign keys)
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@campus.edu', passwordHash, role: Role.ADMIN },
    { email: 'admin@campus.local', passwordHash, role: Role.ADMIN },
    { email: 'faculty@campus.edu', passwordHash, role: Role.FACULTY },
    { email: 'faculty@campus.local', passwordHash, role: Role.FACULTY },
    { email: 'faculty2@campus.local', passwordHash, role: Role.FACULTY },
    { email: 'faculty3@campus.local', passwordHash, role: Role.FACULTY },
    { email: 'faculty4@campus.local', passwordHash, role: Role.FACULTY },
    { email: 'faculty5@campus.local', passwordHash, role: Role.FACULTY },
    { email: 'student@campus.edu', passwordHash, role: Role.STUDENT },
    { email: 'student@campus.local', passwordHash, role: Role.STUDENT },
    ...Array.from({ length: 11 }).map((_, i) => ({
      email: `student${i + 2}@campus.local`,
      passwordHash,
      role: Role.STUDENT,
    })),
  ];


  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
  }

  const adminUser = createdUsers.find(u => u.role === Role.ADMIN)!;
  const facultyUsers = createdUsers.filter(u => u.role === Role.FACULTY);
  const studentUsers = createdUsers.filter(u => u.role === Role.STUDENT);

  // 2. Create Departments
  const depts = [
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Electronics & Communication Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
  ];

  const createdDepts = [];
  for (const d of depts) {
    const dept = await prisma.department.create({ data: d });
    createdDepts.push(dept);
  }

  const cseDept = createdDepts[0];
  const eceDept = createdDepts[1];
  const meDept = createdDepts[2];

  // 3. Create Faculty records
  const facultiesData = [
    { firstName: 'John', lastName: 'Doe', employeeId: 'FAC001', designation: 'Professor', departmentId: cseDept.id, userId: facultyUsers[0].id },
    { firstName: 'Alice', lastName: 'Smith', employeeId: 'FAC002', designation: 'Associate Professor', departmentId: cseDept.id, userId: facultyUsers[1].id },
    { firstName: 'Robert', lastName: 'Johnson', employeeId: 'FAC003', designation: 'Assistant Professor', departmentId: eceDept.id, userId: facultyUsers[2].id },
    { firstName: 'Emily', lastName: 'Williams', employeeId: 'FAC004', designation: 'Lecturer', departmentId: eceDept.id, userId: facultyUsers[3].id },
    { firstName: 'Michael', lastName: 'Brown', employeeId: 'FAC005', designation: 'Senior Professor', departmentId: meDept.id, userId: facultyUsers[4].id },
  ];

  const createdFaculties = [];
  for (const fd of facultiesData) {
    const faculty = await prisma.faculty.create({ data: fd });
    createdFaculties.push(faculty);
  }

  // 4. Create Student records
  const studentNames = [
    { firstName: 'Karthik', lastName: 'Chakala', enrollmentNumber: 'STU001', dateOfBirth: new Date('2004-05-15'), departmentId: cseDept.id, userId: studentUsers[0].id },
    { firstName: 'Emma', lastName: 'Davis', enrollmentNumber: 'STU002', dateOfBirth: new Date('2003-08-22'), departmentId: cseDept.id, userId: studentUsers[1].id },
    { firstName: 'James', lastName: 'Wilson', enrollmentNumber: 'STU003', dateOfBirth: new Date('2004-01-10'), departmentId: cseDept.id, userId: studentUsers[2].id },
    { firstName: 'Olivia', lastName: 'Martinez', enrollmentNumber: 'STU004', dateOfBirth: new Date('2004-11-30'), departmentId: cseDept.id, userId: studentUsers[3].id },
    { firstName: 'William', lastName: 'Anderson', enrollmentNumber: 'STU005', dateOfBirth: new Date('2003-04-12'), departmentId: eceDept.id, userId: studentUsers[4].id },
    { firstName: 'Sophia', lastName: 'Taylor', enrollmentNumber: 'STU006', dateOfBirth: new Date('2004-07-19'), departmentId: eceDept.id, userId: studentUsers[5].id },
    { firstName: 'Alexander', lastName: 'Thomas', enrollmentNumber: 'STU007', dateOfBirth: new Date('2003-09-05'), departmentId: eceDept.id, userId: studentUsers[6].id },
    { firstName: 'Isabella', lastName: 'Moore', enrollmentNumber: 'STU008', dateOfBirth: new Date('2004-02-25'), departmentId: meDept.id, userId: studentUsers[7].id },
    { firstName: 'Daniel', lastName: 'Jackson', enrollmentNumber: 'STU009', dateOfBirth: new Date('2004-06-18'), departmentId: meDept.id, userId: studentUsers[8].id },
    { firstName: 'Mia', lastName: 'Martin', enrollmentNumber: 'STU010', dateOfBirth: new Date('2003-12-04'), departmentId: meDept.id, userId: studentUsers[9].id },
    { firstName: 'Lucas', lastName: 'Lee', enrollmentNumber: 'STU011', dateOfBirth: new Date('2004-03-14'), departmentId: cseDept.id, userId: studentUsers[10].id },
    { firstName: 'Charlotte', lastName: 'Perez', enrollmentNumber: 'STU012', dateOfBirth: new Date('2004-10-22'), departmentId: eceDept.id, userId: studentUsers[11].id },
  ];

  const createdStudents = [];
  for (const sd of studentNames) {
    const student = await prisma.student.create({ data: sd });
    createdStudents.push(student);
  }

  // 5. Create Courses
  const coursesData = [
    { code: 'CS101', name: 'Introduction to Programming', description: 'Basics of programming using C++ and Python', credits: 3, departmentId: cseDept.id, facultyId: createdFaculties[0].id },
    { code: 'CS301', name: 'Database Management Systems', description: 'Relational database systems, SQL, and query tuning', credits: 4, departmentId: cseDept.id, facultyId: createdFaculties[0].id },
    { code: 'CS302', name: 'Computer Networks', description: 'OSI model, TCP/IP, routing algorithms and network design', credits: 4, departmentId: cseDept.id, facultyId: createdFaculties[1].id },
    { code: 'CS401', name: 'Operating Systems', description: 'Processes, memory management, file systems, and scheduling', credits: 4, departmentId: cseDept.id, facultyId: createdFaculties[1].id },
    { code: 'EC201', name: 'Digital Electronics', description: 'Logic gates, boolean algebra, counters, and flip-flops', credits: 3, departmentId: eceDept.id, facultyId: createdFaculties[2].id },
    { code: 'EC302', name: 'Microprocessors & Microcontrollers', description: 'Assembly language programming for 8086 and 8051', credits: 4, departmentId: eceDept.id, facultyId: createdFaculties[3].id },
    { code: 'EC401', name: 'Wireless Communication', description: 'Principles of cellular systems, 4G/5G, and signal propagation', credits: 3, departmentId: eceDept.id, facultyId: createdFaculties[2].id },
    { code: 'ME101', name: 'Engineering Drawing', description: 'Geometrical constructions, orthographic and isometric projections', credits: 2, departmentId: meDept.id, facultyId: createdFaculties[4].id },
    { code: 'ME301', name: 'Thermodynamics', description: 'Laws of thermodynamics, heat engines, and cycles', credits: 4, departmentId: meDept.id, facultyId: createdFaculties[4].id },
    { code: 'ME302', name: 'Fluid Mechanics', description: 'Fluid properties, Bernoulli\'s equation, and pipe flow', credits: 4, departmentId: meDept.id, facultyId: createdFaculties[4].id },
  ];

  const createdCourses = [];
  for (const cd of coursesData) {
    const course = await prisma.course.create({ data: cd });
    createdCourses.push(course);
  }

  // 6. Create Enrollments
  // Enroll CSE students in CSE courses, ECE in ECE, ME in ME
  const enrollmentsData: any[] = [];
  
  for (const student of createdStudents) {
    // Find courses of student's department
    const deptCourses = createdCourses.filter(c => c.departmentId === student.departmentId);
    for (const course of deptCourses) {
      enrollmentsData.push({
        studentId: student.id,
        courseId: course.id,
      });
    }
  }

  for (const ed of enrollmentsData) {
    await prisma.enrollment.create({ data: ed });
  }

  // 7. Create Attendance Records
  // Create past 10 days of attendance for each enrolled course for STU001 (Karthik) and STU002
  const targetStudents = createdStudents.slice(0, 3);
  const today = new Date();
  
  for (const student of targetStudents) {
    const studentEnrollments = enrollmentsData.filter(e => e.studentId === student.id);
    for (const enrollment of studentEnrollments) {
      for (let day = 1; day <= 10; day++) {
        const attendanceDate = new Date();
        attendanceDate.setDate(today.getDate() - day);
        
        // Random status: 80% Present, 10% Late, 10% Absent
        const rand = Math.random();
        const status = rand < 0.8 ? AttendanceStatus.PRESENT : rand < 0.9 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT;
        
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            courseId: enrollment.courseId,
            date: attendanceDate,
            status,
            remarks: status === AttendanceStatus.ABSENT ? 'Medical reasons' : null,
          },
        });
      }
    }
  }

  // 8. Create Assignments
  const assignmentsData = [
    {
      title: 'Assignment 1 — Relational Algebra & Calculus',
      description: 'Solve the relational queries on the university schema given in the textbook.',
      dueDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
      points: 100,
      courseId: createdCourses[1].id, // CS301 (DBMS)
      facultyId: createdFaculties[0].id,
    },
    {
      title: 'Assignment 2 — Indexing and B+ Trees',
      description: 'Implement a basic B+ tree indexing visualization tool or write the step-by-step tree trace.',
      dueDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 day ago (Closed)
      points: 100,
      courseId: createdCourses[1].id, // CS301
      facultyId: createdFaculties[0].id,
    },
    {
      title: 'Assignment 1 — TCP vs UDP Socket Programming',
      description: 'Create a client-server socket programming application demonstrating differences in loss rates.',
      dueDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      points: 50,
      courseId: createdCourses[2].id, // CS302 (Computer Networks)
      facultyId: createdFaculties[1].id,
    },
  ];

  const createdAssignments = [];
  for (const ad of assignmentsData) {
    const assignment = await prisma.assignment.create({ data: ad });
    createdAssignments.push(assignment);
  }

  // 9. Create Assignment Submissions
  // Submit for Karthik (student@campus.local, STU001) for Assignment 2 (Closed one) and Assignment 1 (Open one)
  const karthik = createdStudents[0];
  
  // Submit closed assignment (Graded)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: createdAssignments[1].id,
      studentId: karthik.id,
      submissionDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      fileUrl: `http://localhost:5000/uploads/dummy-assignment2-karthik.pdf`,
      fileName: 'bplus_tree_karthik.pdf',
      status: SubmissionStatus.GRADED,
      grade: 'A',
      feedback: 'Excellent work showing page splits and index merges.',
      gradedById: createdFaculties[0].id,
      gradedAt: new Date(today.getTime() - 1000 * 60 * 60 * 12), // 12 hours ago
    },
  });

  // Submit open assignment 1 (Submitted, not graded)
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: createdAssignments[0].id,
      studentId: karthik.id,
      submissionDate: new Date(),
      fileUrl: `http://localhost:5000/uploads/dummy-assignment1-karthik.pdf`,
      fileName: 'relational_algebra_karthik.pdf',
      status: SubmissionStatus.SUBMITTED,
    },
  });

  // 10. Create Exams
  const examsData = [
    {
      courseId: createdCourses[1].id, // CS301
      name: 'Midterm Examination',
      examDate: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      location: 'Main Block - Hall A',
      maxMarks: 100,
      status: ExamStatus.COMPLETED,
    },
    {
      courseId: createdCourses[1].id, // CS301
      name: 'End Semester Examination',
      examDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 14), // 14 days from now
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      location: 'Main Block - Hall B',
      maxMarks: 100,
      status: ExamStatus.SCHEDULED,
    },
  ];

  const createdExams = [];
  for (const ed of examsData) {
    const exam = await prisma.exam.create({ data: ed });
    createdExams.push(exam);
  }

  // 11. Create Exam Results for Completed Midterm
  // Create results for first 3 students
  const resultsData = [
    { examId: createdExams[0].id, studentId: createdStudents[0].id, marksObtained: 86, grade: 'A', status: ResultStatus.PUBLISHED, remarks: 'Very good' },
    { examId: createdExams[0].id, studentId: createdStudents[1].id, marksObtained: 78, grade: 'B+', status: ResultStatus.PUBLISHED, remarks: 'Keep improving' },
    { examId: createdExams[0].id, studentId: createdStudents[2].id, marksObtained: 92, grade: 'A+', status: ResultStatus.PUBLISHED, remarks: 'Outstanding performance' },
  ];

  for (const rd of resultsData) {
    await prisma.result.create({ data: rd });
  }

  // 12. Create Campus Events
  const eventsData = [
    {
      title: 'TechNexus Hackathon 2026',
      description: '48-hour challenge to design cloud native applications solving real campus infrastructure problems.',
      eventDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
      time: '09:00 AM',
      location: 'Research Park Seminar Hall',
      organizerId: adminUser.id,
    },
    {
      title: 'National Robotics Seminar',
      description: 'Guest lecture from leading industry experts in automation, ROS, and computer vision.',
      eventDate: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
      time: '11:00 AM',
      location: 'Auditorium - Mechanical Block',
      organizerId: adminUser.id,
    },
  ];

  const createdEvents = [];
  for (const ev of eventsData) {
    const event = await prisma.event.create({ data: ev });
    createdEvents.push(event);
  }

  // 13. Create Event Registrations
  // Register Karthik for the Hackathon
  await prisma.eventRegistration.create({
    data: {
      eventId: createdEvents[0].id,
      studentId: karthik.id,
    },
  });

  // 14. Create Announcements
  const announcementsData = [
    {
      title: 'Campus-wide Cloud Architecture Migration Seminar',
      content: 'All faculty and senior students are invited to the Guest Lecture on cloud readiness and Amazon Web Services on Friday. Speaker: Cloud Engineering Lead, EDB.',
      type: AnnouncementType.GENERAL,
      authorId: adminUser.id,
    },
    {
      title: 'CS301 Midterm Examination Results Published',
      content: 'The Midterm Examination results for Database Management Systems have been evaluated and published. Please verify your marks and report discrepancies by tomorrow.',
      type: AnnouncementType.EXAM,
      courseId: createdCourses[1].id, // CS301 (DBMS)
      authorId: facultyUsers[0].id, // Dr John Doe
    },
    {
      title: 'URGENT: Maintenance Downtime',
      content: 'The campus intranet will experience downtime on Saturday from 02:00 AM to 06:00 AM due to network maintenance.',
      type: AnnouncementType.URGENT,
      authorId: adminUser.id,
    },
  ];

  for (const ad of announcementsData) {
    await prisma.announcement.create({ data: ad });
  }

  // 15. Create Notifications for Karthik (STU001)
  const notificationsData = [
    {
      userId: studentUsers[0].id,
      title: 'Welcome to CloudCampus!',
      message: 'Your enrollment in Computer Science & Engineering department has been configured. Access your course materials now.',
      type: NotificationType.GENERAL,
      isRead: true,
      readAt: new Date(),
    },
    {
      userId: studentUsers[0].id,
      title: 'New Assignment Published',
      message: 'Dr. John Doe published Assignment 1: Relational Algebra in Database Management Systems.',
      type: NotificationType.ACADEMIC,
      isRead: false,
    },
    {
      userId: studentUsers[0].id,
      title: 'Midterm Examination Results out',
      message: 'Your result for Midterm Examination has been published. Marks: 86/100.',
      type: NotificationType.EXAM,
      isRead: false,
    },
  ];

  for (const nd of notificationsData) {
    await prisma.notification.create({ data: nd });
  }

  // 16. Audit Log Seed
  const auditLogsData = [
    { userId: adminUser.id, action: 'CREATE_USER', resource: 'User', resourceId: studentUsers[0].id, metadata: { email: 'student@campus.local', role: 'STUDENT' } },
    { userId: adminUser.id, action: 'CREATE_COURSE', resource: 'Course', resourceId: createdCourses[1].id, metadata: { code: 'CS301', name: 'Database Management Systems' } },
    { userId: facultyUsers[0].id, action: 'CREATE_ASSIGNMENT', resource: 'Assignment', resourceId: createdAssignments[0].id, metadata: { title: 'Assignment 1 — Relational Algebra' } },
    { userId: studentUsers[0].id, action: 'SUBMIT_ASSIGNMENT', resource: 'AssignmentSubmission', resourceId: karthik.id, metadata: { assignmentId: createdAssignments[0].id } },
  ];

  for (const ald of auditLogsData) {
    await prisma.auditLog.create({ data: ald });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
