const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/karth/.gemini/antigravity-ide/brain/1aaaad73-2e39-4c63-9474-385c20e3662a';
const destBase = 'c:/Users/karth/Downloads/CloudComputing/report/assets/screenshots';

const subdirs = ['01-cover', '02-auth', '03-student', '04-faculty', '05-admin', '06-profile', '07-assignments', '08-notifications', '09-audit', '10-security', '11-aws', '12-cloudwatch'];

subdirs.forEach(d => {
  const p = path.join(destBase, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const files = fs.readdirSync(srcDir);
const pngFiles = files.filter(f => f.endsWith('.png'));

console.log(`Found ${pngFiles.length} PNG screenshots in artifact directory.`);

const copyMap = {
  // 02-auth
  'cognito_hosted_ui_login_1788363160003.png': '02-auth/01_cognito_hosted_ui_login.png',
  'cloud_only_login_1788363144477.png': '02-auth/02_cloudcampus_login_screen.png',
  
  // 03-student
  'student_dashboard_qa_1788370796805.png': '03-student/01_student_dashboard.png',
  'student_attendance_qa_1788370915683.png': '03-student/02_student_attendance.png',
  'student_courses_verified_1788371112054.png': '03-student/03_student_courses.png',
  'student_results_qa_1788370953703.png': '03-student/04_student_results.png',
  'student_events_qa_1788370971544.png': '03-student/05_student_events.png',

  // 04-faculty
  'faculty_dashboard_qa_1788371772635.png': '04-faculty/01_faculty_dashboard.png',
  'faculty_courses_qa_1788371790112.png': '04-faculty/02_faculty_courses.png',
  'faculty_attendance_qa_1788371817821.png': '04-faculty/03_faculty_attendance.png',
  'faculty_grading_qa_1788371918968.png': '04-faculty/04_faculty_grading.png',
  'faculty_announcements_qa_1788371962407.png': '04-faculty/05_faculty_announcements.png',

  // 05-admin
  'admin_dashboard_qa_1788369198521.png': '05-admin/01_admin_dashboard.png',
  'admin_students_verified_1788369503715.png': '05-admin/02_admin_students.png',
  'admin_faculty_verified_1788369512290.png': '05-admin/03_admin_faculty.png',
  'admin_departments_qa_1788369344826.png': '05-admin/04_admin_departments.png',
  'admin_courses_qa_1788369369758.png': '05-admin/05_admin_courses.png',
  'admin_enrollments_verified_1788369523090.png': '05-admin/06_admin_enrollments.png',
  'admin_reports_verified_1788369541626.png': '05-admin/07_admin_reports.png',

  // 06-profile
  'student_profile_final_qa_1788374259455.png': '06-profile/01_student_profile_photo.png',
  'faculty_profile_qa_png_1788373569361.png': '06-profile/02_faculty_profile.png',
  'admin_profile_qa_png_1788373828502.png': '06-profile/03_admin_profile.png',
  'student_avatar_top_right_qa_1788374594820.png': '06-profile/04_student_navbar_avatar.png',
  'faculty_avatar_top_right_qa_1788374763744.png': '06-profile/05_faculty_navbar_avatar.png',

  // 07-assignments & 08-notifications
  'student_assignments_qa_1788370933724.png': '07-assignments/01_student_assignments.png',
  'student_notifications_qa_1788370990534.png': '08-notifications/01_student_notifications_live.png',

  // 09-audit & 10-security & 12-cloudwatch
  'admin_audit_logs_verified_1788369534609.png': '09-audit/01_admin_audit_trail_rds.png',
  'admin_monitoring_qa_1788369221277.png': '12-cloudwatch/01_admin_monitoring_telemetry.png'
};

for (const [src, destRel] of Object.entries(copyMap)) {
  const srcPath = path.join(srcDir, src);
  const destPath = path.join(destBase, destRel);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${destRel}`);
  } else {
    console.warn(`Source file not found: ${src}`);
  }
}
