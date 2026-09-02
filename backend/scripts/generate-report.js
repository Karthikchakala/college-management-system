const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reportDir = 'c:/Users/karth/Downloads/CloudComputing/report';
const assetsDir = path.join(reportDir, 'assets');

function getBase64Img(relPath) {
  const fullPath = path.join(assetsDir, relPath);
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(fullPath).slice(1);
    const b64 = fs.readFileSync(fullPath).toString('base64');
    return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${b64}`;
  }
  return '';
}

const logoB64 = getBase64Img('logo/iiitdmk_logo.png');

// Screenshots
const sCognitoHosted = getBase64Img('screenshots/02-auth/01_cognito_hosted_ui_login.png');
const sLoginApp = getBase64Img('screenshots/02-auth/02_cloudcampus_login_screen.png');

const sStudentDash = getBase64Img('screenshots/03-student/01_student_dashboard.png');
const sStudentAtt = getBase64Img('screenshots/03-student/02_student_attendance.png');
const sStudentCourses = getBase64Img('screenshots/03-student/03_student_courses.png');
const sStudentResults = getBase64Img('screenshots/03-student/04_student_results.png');
const sStudentEvents = getBase64Img('screenshots/03-student/05_student_events.png');

const sFacultyDash = getBase64Img('screenshots/04-faculty/01_faculty_dashboard.png');
const sFacultyCourses = getBase64Img('screenshots/04-faculty/02_faculty_courses.png');
const sFacultyAtt = getBase64Img('screenshots/04-faculty/03_faculty_attendance.png');
const sFacultyGrading = getBase64Img('screenshots/04-faculty/04_faculty_grading.png');
const sFacultyAnnounce = getBase64Img('screenshots/04-faculty/05_faculty_announcements.png');

const sAdminDash = getBase64Img('screenshots/05-admin/01_admin_dashboard.png');
const sAdminStudents = getBase64Img('screenshots/05-admin/02_admin_students.png');
const sAdminFaculty = getBase64Img('screenshots/05-admin/03_admin_faculty.png');
const sAdminDepts = getBase64Img('screenshots/05-admin/04_admin_departments.png');
const sAdminCourses = getBase64Img('screenshots/05-admin/05_admin_courses.png');
const sAdminEnroll = getBase64Img('screenshots/05-admin/06_admin_enrollments.png');
const sAdminReports = getBase64Img('screenshots/05-admin/07_admin_reports.png');

const sStudentProfile = getBase64Img('screenshots/06-profile/01_student_profile_photo.png');
const sFacultyProfile = getBase64Img('screenshots/06-profile/02_faculty_profile.png');
const sAdminProfile = getBase64Img('screenshots/06-profile/03_admin_profile.png');
const sStudentNavAvatar = getBase64Img('screenshots/06-profile/04_student_navbar_avatar.png');
const sFacultyNavAvatar = getBase64Img('screenshots/06-profile/05_faculty_navbar_avatar.png');

const sStudentAssign = getBase64Img('screenshots/07-assignments/01_student_assignments.png');
const sStudentNotifs = getBase64Img('screenshots/08-notifications/01_student_notifications_live.png');
const sAdminAudit = getBase64Img('screenshots/09-audit/01_admin_audit_trail_rds.png');
const sAdminMonitor = getBase64Img('screenshots/12-cloudwatch/01_admin_monitoring_telemetry.png');

console.log('Generating perfected 28-page report with 75-90% vertical page utilization...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CloudCampus — AWS Multi-Tier Cloud Deployment Report (IIITDM Kurnool)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.6pt;
      line-height: 1.42;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 12mm 14mm 12mm 14mm;
      position: relative;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Header / Footer */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 3.5px;
      margin-bottom: 6px;
      font-size: 7pt;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .page-header .brand {
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-header .brand-badge {
      background: #ff9900;
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 800;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 7pt;
      color: #64748b;
      font-weight: 600;
      margin-top: auto;
    }

    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 6px;
    }

    /* Headings */
    h1.sec-title {
      font-size: 12.5pt;
      font-weight: 800;
      color: #0b192c;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 3.5px solid #ff9900;
      padding-left: 7px;
      margin-bottom: 3px;
      line-height: 1.2;
    }

    h2.sub-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 3px;
      margin-bottom: 2px;
    }

    p {
      color: #334155;
      text-align: justify;
    }

    strong {
      color: #0f172a;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      height: 100%;
      padding: 8mm 6mm;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      background: radial-gradient(circle at 50% 0%, #f8fafc 0%, #ffffff 100%);
    }

    .cover-logo {
      height: 95px;
      object-fit: contain;
      margin-bottom: 8px;
    }

    .cover-inst {
      font-size: 11.5pt;
      font-weight: 800;
      color: #0b192c;
      letter-spacing: 0.3px;
      line-height: 1.3;
    }

    .cover-dept {
      font-size: 10pt;
      font-weight: 700;
      color: #0284c7;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cover-hero {
      margin: 14px 0;
      padding: 16px 24px;
      background: linear-gradient(135deg, #0b192c 0%, #1e293b 100%);
      border-radius: 10px;
      color: #ffffff;
      width: 96%;
      box-shadow: 0 4px 12px rgba(11, 25, 44, 0.15);
      border-bottom: 3.5px solid #ff9900;
    }

    .cover-hero h1 {
      font-size: 26pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .cover-hero h2 {
      font-size: 11.5pt;
      font-weight: 500;
      color: #cbd5e1;
      margin-top: 2px;
    }

    .cover-hero .tagline {
      font-size: 9pt;
      color: #ff9900;
      font-weight: 700;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 94%;
      text-align: left;
      margin: 10px 0;
    }

    .cover-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }

    .cover-card h3 {
      font-size: 8.5pt;
      font-weight: 800;
      color: #0b192c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }

    .cover-card p {
      font-size: 8.2pt;
      line-height: 1.45;
      color: #334155;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.6pt;
      margin: 3px 0;
      background: #ffffff;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    table.data-table th {
      background: #0b192c;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 4.5px 6px;
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    table.data-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }

    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-pass {
      background: #dcfce7;
      color: #15803d;
      font-weight: 800;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.8pt;
      display: inline-block;
    }

    .badge-aws {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
      font-weight: 700;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.8pt;
    }

    .badge-mgmt {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      font-weight: 700;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.8pt;
    }

    .badge-denied {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 800;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 6.8pt;
    }

    /* Callout Boxes */
    .callout {
      background: #f8fafc;
      border-left: 3px solid #0284c7;
      border-radius: 0 6px 6px 0;
      padding: 5px 8px;
      margin: 3px 0;
      font-size: 7.8pt;
    }

    .callout.aws {
      border-left-color: #ff9900;
      background: #fffbeb;
    }

    .callout.success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    /* Screenshot containers */
    .img-grid {
      display: grid;
      gap: 6px;
      margin: 3px 0;
    }

    .img-grid.cols-2 {
      grid-template-columns: 1fr 1fr;
    }

    .img-grid.cols-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .img-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .img-box img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      display: block;
      border-bottom: 1px solid #e2e8f0;
    }

    .img-box.tall img {
      height: 155px;
    }

    .img-box.hero-img img {
      height: 190px;
    }

    .img-caption {
      font-size: 6.8pt;
      font-weight: 700;
      color: #475569;
      padding: 3px 5px;
      background: #f8fafc;
      text-align: center;
      line-height: 1.25;
    }

    /* Flow Diagrams */
    .flow-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      margin: 3px 0;
    }

    .flow-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin: 3px 0;
      font-size: 7.2pt;
    }

    .flow-step {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      flex: 1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .flow-step.highlight {
      background: #0b192c;
      color: #ffffff;
      border-color: #0b192c;
    }

    .flow-step.aws-step {
      background: #fff7ed;
      color: #c2410c;
      border-color: #fdba74;
    }

    .flow-arrow {
      color: #94a3b8;
      font-weight: 800;
      font-size: 8pt;
    }

    /* Grid cards */
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
      margin: 3px 0;
    }

    .card-stat {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 6px;
      text-align: center;
    }

    .card-stat .val {
      font-size: 11pt;
      font-weight: 800;
      color: #0b192c;
      font-family: 'JetBrains Mono', monospace;
    }

    .card-stat .lbl {
      font-size: 6.5pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .code-pill {
      font-family: 'JetBrains Mono', monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 7pt;
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER PAGE ================= -->
  <div class="page">
    <div class="cover-page">
      <div>
        <img src="${logoB64}" class="cover-logo" alt="IIITDM Kurnool Logo" />
        <div class="cover-inst">
          INDIAN INSTITUTE OF INFORMATION TECHNOLOGY<br/>
          DESIGN AND MANUFACTURING KURNOOL
        </div>
        <div style="font-size: 7.8pt; color: #64748b; margin-top: 2px;">
          (An Institute of National Importance under Ministry of Education, Govt. of India)<br/>
          Jagannathagattu, Dinnedevarapadu, Kurnool, Andhra Pradesh — 518008
        </div>
        <div class="cover-dept">
          Department of Computer Science and Engineering
        </div>
      </div>

      <div class="cover-hero">
        <h1>CLOUDCAMPUS</h1>
        <h2>College Campus Management System</h2>
        <div class="tagline">AWS Multi-Tier Cloud Deployment & Engineering Report</div>
        <div style="font-size: 7.8pt; color: #94a3b8; margin-top: 6px;">
          Course: Cloud Computing &bull; Academic Session: 2026–2027
        </div>
      </div>

      <div class="cover-meta-grid">
        <div class="cover-card">
          <h3>Project Developed & Submitted By:</h3>
          <p><strong>Chakala Karthik</strong> &bull; Roll No: <span class="code-pill">123CS0038</span></p>
          <p style="margin-top: 3px;"><strong>Shaik Venkat</strong> &bull; Roll No: <span class="code-pill">123CS0037</span></p>
          <p style="margin-top: 4px; font-size: 7.5pt; color: #64748b;">B.Tech Computer Science & Engineering</p>
        </div>

        <div class="cover-card">
          <h3>Course Instructor & Project Guide:</h3>
          <p><strong>Dr. Anil Kumar</strong></p>
          <p style="font-size: 7.8pt; color: #475569;">Assistant Professor</p>
          <p style="font-size: 7.5pt; color: #64748b;">Department of Computer Science & Engineering<br/>IIITDM Kurnool</p>
        </div>
      </div>

      <div style="font-size: 7.5pt; color: #64748b; font-weight: 600;">
        September 2026 &bull; Production Architecture Verification on Amazon Web Services (us-east-1)
      </div>
    </div>
  </div>

  <!-- ================= PAGE 2: EXECUTIVE SUMMARY & ABSTRACT ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 2</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">1. Executive Summary & Project Abstract</h1>
        <p>
          <strong>CloudCampus</strong> is an enterprise-grade, multi-tier College Campus Management System architected, deployed, and verified entirely on <strong>Amazon Web Services (AWS)</strong> in the <code>us-east-1</code> (N. Virginia) region. The system transitions traditional monolithic campus administration into a high-availability, secure, and observable cloud platform serving three distinct academic roles: <strong>Students</strong>, <strong>Faculty</strong>, and <strong>Administrators</strong>.
        </p>

        <div class="callout aws" style="margin-top: 4px;">
          <strong>Primary Engineering Thesis:</strong> Rather than using cloud infrastructure solely for basic virtual machine hosting, CloudCampus deeply integrates <strong>14 native AWS services</strong>—mapping each architectural responsibility (Identity, Ingress, Routing, Compute, Managed Database, Object Storage, Event-Driven Serverless, Message Queuing, Scheduled Automation, Secrets Governance, Access Control, Auditing, Network Isolation, and Observability) to specialized cloud primitives.
        </div>

        <h2 class="sub-title">1.1 Core Architectural Highlights</h2>
        <ul style="padding-left: 14px; font-size: 7.8pt; line-height: 1.4; color: #334155;">
          <li><strong>Serverless Cloud Identity:</strong> Complete deprecation of local database passwords in favor of <strong>AWS Cognito User Pools</strong> (<code>us-east-1_Ic9huqJjL</code>) with Cognito Groups and cryptographically verified JWT tokens.</li>
          <li><strong>Ingress & Private Routing:</strong> Zero direct public exposure of backend servers; external traffic enters via <strong>AWS API Gateway HTTP API</strong> (<code>7k2yo6gy77</code>) and routes across an <strong>AWS Application Load Balancer (ALB)</strong> into private EC2 subnets.</li>
          <li><strong>Dual Database & Storage Separation:</strong> Relational institutional data resides in <strong>Amazon RDS PostgreSQL</strong> (<code>cloudcampus-db</code>) while unstructured binary artifacts and profile images are stored directly in <strong>Amazon S3</strong> (<code>cloudcampus-511225358997</code>).</li>
          <li><strong>Asynchronous Serverless Workflows:</strong> Faculty assignment creation asynchronously triggers <strong>AWS Lambda</strong> (<code>CloudCampus-Assignment-Notification</code>) to identify enrolled students and dispatch alerts via <strong>Amazon SNS</strong>; scheduled deadlines are tracked by <strong>Amazon EventBridge</strong> triggering reminder Lambdas with duplicate prevention.</li>
          <li><strong>Full-Stack Observability & Auditing:</strong> Native <strong>AWS CloudWatch Monitoring Dashboard</strong> (<code>CloudCampus-Monitoring</code>) tracking 12 live telemetry metrics across EC2, ALB, RDS, and Lambda alongside immutable RDS audit logging.</li>
        </ul>
      </div>

      <div class="img-grid cols-2" style="margin-top: 4px;">
        <div class="img-box">
          <img src="${sLoginApp}" alt="CloudCampus Cloud Login" />
          <div class="img-caption">Figure 1.1 — CloudCampus Cloud-Only Authentication Interface</div>
        </div>
        <div class="img-box">
          <img src="${sCognitoHosted}" alt="AWS Cognito Managed UI" />
          <div class="img-caption">Figure 1.2 — AWS Cognito Hosted UI & Identity Provider</div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Executive Summary &bull; Page 2 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 3: TABLE OF CONTENTS ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 3</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">2. Table of Contents & Navigation Index</h1>
        <table class="data-table" style="font-size: 7.5pt;">
          <thead>
            <tr>
              <th style="width: 10%;">Sec #</th>
              <th style="width: 75%;">Report Chapter & Technical Section</th>
              <th style="width: 15%; text-align: right;">Page #</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>1</strong></td><td><strong>Executive Summary & Project Abstract</strong></td><td style="text-align: right;"><strong>2</strong></td></tr>
            <tr><td><strong>2</strong></td><td><strong>Table of Contents & Navigation Index</strong></td><td style="text-align: right;"><strong>3</strong></td></tr>
            <tr><td><strong>3</strong></td><td><strong>Project Objectives & Complete 14-AWS Service Inventory Table</strong></td><td style="text-align: right;"><strong>4</strong></td></tr>
            <tr><td><strong>4</strong></td><td><strong>AWS Service Categorization & Architectural Role Breakdown</strong></td><td style="text-align: right;"><strong>5</strong></td></tr>
            <tr><td><strong>5</strong></td><td><strong>Complete System Cloud Architecture (Full-Page Vector Diagram)</strong></td><td style="text-align: right;"><strong>6</strong></td></tr>
            <tr><td><strong>6</strong></td><td><strong>Amazon VPC Network Boundary & Subnet Topology Architecture</strong></td><td style="text-align: right;"><strong>7</strong></td></tr>
            <tr><td><strong>7</strong></td><td><strong>Deployed AWS Cloud Infrastructure Directory (Live Resource Manifest)</strong></td><td style="text-align: right;"><strong>8</strong></td></tr>
            <tr><td><strong>8</strong></td><td><strong>User Identity, Authentication & RBAC (AWS Cognito OIDC Flow)</strong></td><td style="text-align: right;"><strong>9</strong></td></tr>
            <tr><td><strong>9</strong></td><td><strong>API Ingress Layer: AWS API Gateway HTTP API & Application Load Balancer</strong></td><td style="text-align: right;"><strong>10</strong></td></tr>
            <tr><td><strong>10</strong></td><td><strong>Backend Application Compute: AWS EC2 Cluster & PM2 Runtime</strong></td><td style="text-align: right;"><strong>11</strong></td></tr>
            <tr><td><strong>11</strong></td><td><strong>Relational Persistence: Amazon RDS for PostgreSQL Managed Database</strong></td><td style="text-align: right;"><strong>12</strong></td></tr>
            <tr><td><strong>12</strong></td><td><strong>Object Storage Architecture: Amazon S3 File Storage & Presigned URLs</strong></td><td style="text-align: right;"><strong>13</strong></td></tr>
            <tr><td><strong>13</strong></td><td><strong>Profile Management & Real-Time Avatar S3 Pipeline (Flow & UI)</strong></td><td style="text-align: right;"><strong>14</strong></td></tr>
            <tr><td><strong>14</strong></td><td><strong>Student Portal Implementation & Verified Feature Set</strong></td><td style="text-align: right;"><strong>15</strong></td></tr>
            <tr><td><strong>15</strong></td><td><strong>Faculty Portal Implementation & Teaching Workflows</strong></td><td style="text-align: right;"><strong>16</strong></td></tr>
            <tr><td><strong>16</strong></td><td><strong>Administrator Governance Portal & System Controls</strong></td><td style="text-align: right;"><strong>17</strong></td></tr>
            <tr><td><strong>17</strong></td><td><strong>Workflow A: Event-Driven Serverless Notifications (AWS Lambda & SNS)</strong></td><td style="text-align: right;"><strong>18</strong></td></tr>
            <tr><td><strong>18</strong></td><td><strong>Workflow B: Scheduled Due-Date Reminders (Amazon EventBridge & Lambda)</strong></td><td style="text-align: right;"><strong>19</strong></td></tr>
            <tr><td><strong>19</strong></td><td><strong>Admin Immutable Audit Logging System (RDS Audit Trails & Evidence)</strong></td><td style="text-align: right;"><strong>20</strong></td></tr>
            <tr><td><strong>20</strong></td><td><strong>Role-Based API Security & RBAC Permission Matrix (401/403 Tests)</strong></td><td style="text-align: right;"><strong>21</strong></td></tr>
            <tr><td><strong>21</strong></td><td><strong>AWS IAM Security & AWS Secrets Manager Runtime Credential Injection</strong></td><td style="text-align: right;"><strong>22</strong></td></tr>
            <tr><td><strong>22</strong></td><td><strong>CloudWatch Monitoring Dashboard & Infrastructure Metric Alarms</strong></td><td style="text-align: right;"><strong>23</strong></td></tr>
            <tr><td><strong>23</strong></td><td><strong>Three-Layer End-to-End System Verification (Browser &rarr; API &rarr; RDS/S3)</strong></td><td style="text-align: right;"><strong>24</strong></td></tr>
            <tr><td><strong>24</strong></td><td><strong>Comprehensive Functional Testing & Test Results Matrix</strong></td><td style="text-align: right;"><strong>25</strong></td></tr>
            <tr><td><strong>25</strong></td><td><strong>Cloud vs. Local Architecture Comparison & Scalability Analysis</strong></td><td style="text-align: right;"><strong>26</strong></td></tr>
            <tr><td><strong>26</strong></td><td><strong>AWS Resource Cost Considerations & "Why This Architecture?" Rationale</strong></td><td style="text-align: right;"><strong>27</strong></td></tr>
            <tr><td><strong>27</strong></td><td><strong>CloudCampus Demonstrated Capabilities Grid, Conclusion & References</strong></td><td style="text-align: right;"><strong>28</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div class="flow-card" style="margin-top: 4px;">
        <h2 class="sub-title" style="margin-top: 0;">Key Figure & Architecture Table Index</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 7.2pt; color: #475569;">
          <div>
            <p><strong>Figure 5.1:</strong> Full-Page Multi-Tier Cloud Architecture (p. 6)</p>
            <p><strong>Figure 6.1:</strong> Amazon VPC Subnet & Endpoint Topology (p. 7)</p>
            <p><strong>Figure 8.1:</strong> Cognito Hosted UI & JWT Exchange (p. 9)</p>
            <p><strong>Figure 13.1:</strong> S3 Object Upload & Presigned URL Flow (p. 14)</p>
          </div>
          <div>
            <p><strong>Figure 17.1:</strong> Event-Driven Notification Execution (p. 18)</p>
            <p><strong>Figure 19.1:</strong> Live RDS Immutable Audit Trail (p. 20)</p>
            <p><strong>Figure 20.1:</strong> Read-Only API Role Permission Matrix (p. 21)</p>
            <p><strong>Figure 22.1:</strong> CloudWatch 12-Widget Live Dashboard (p. 23)</p>
          </div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Table of Contents &bull; Page 3 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 4: AWS SERVICE INVENTORY (ALL 14 SERVICES) ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 4</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">3. AWS Services Used in CloudCampus</h1>
        <p>
          CloudCampus leverages a comprehensive suite of AWS services divided into <strong>Runtime Application Services</strong> (direct participants in user requests and asynchronous jobs) and <strong>AWS Management / Development Services</strong> (used for administrative deployment and governance).
        </p>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th style="width: 22%;">AWS Service</th>
              <th style="width: 14%;">Classification</th>
              <th style="width: 64%;">Specific Architectural Purpose in CloudCampus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Amazon EC2</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Hosts the clustered Express + Prisma application server (<code>i-03681025582d882c5</code>) on Amazon Linux 2023 under PM2.</td>
            </tr>
            <tr>
              <td><strong>Amazon API Gateway</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>HTTP API (<code>7k2yo6gy77</code>) providing public HTTPS entry, CORS headers, edge throttling, and direct ALB forwarding.</td>
            </tr>
            <tr>
              <td><strong>AWS Cognito</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>User Pool (<code>us-east-1_Ic9huqJjL</code>) managing user identities, password authentication, OAuth2 OIDC tokens, and RBAC groups.</td>
            </tr>
            <tr>
              <td><strong>AWS ALB</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Application Load Balancer distributing HTTP traffic across target instances with automated <code>/health</code> health checking.</td>
            </tr>
            <tr>
              <td><strong>Amazon RDS PostgreSQL</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Primary relational database (<code>cloudcampus-db</code>) running PostgreSQL 17.5 in private database subnets with SSL encryption.</td>
            </tr>
            <tr>
              <td><strong>Amazon S3</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Encrypted object storage bucket (<code>cloudcampus-511225358997</code>) for user profile photos and assignment submission files.</td>
            </tr>
            <tr>
              <td><strong>AWS Secrets Manager</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Secure storage of PostgreSQL connection credentials (<code>cloudcampus/rds</code>); injected via IAM at runtime without hardcoding.</td>
            </tr>
            <tr>
              <td><strong>AWS Lambda</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>In-VPC serverless functions for event-driven assignment notification fanout and deadline reminder verification.</td>
            </tr>
            <tr>
              <td><strong>Amazon SNS</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Publish/subscribe topic (<code>CloudCampus-Notifications</code>) broadcasting academic notifications to enrolled students.</td>
            </tr>
            <tr>
              <td><strong>Amazon EventBridge</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Automated scheduled cron rule (<code>rate(1 day)</code>) triggering daily assignment due-date reminder scans.</td>
            </tr>
            <tr>
              <td><strong>Amazon CloudWatch</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>12-widget monitoring dashboard (<code>CloudCampus-Monitoring</code>), 4 metric alarms, and application log stream aggregation.</td>
            </tr>
            <tr>
              <td><strong>Amazon VPC</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Network isolation boundary (<code>vpc-0146f9a06bf1163a6</code>) with private subnets, security groups, and Interface Endpoints.</td>
            </tr>
            <tr>
              <td><strong>AWS IAM</strong></td>
              <td><span class="badge-aws">RUNTIME</span></td>
              <td>Least-privilege execution roles (<code>CloudCampus-EC2-Role</code>, <code>CloudCampus-Lambda-Execution-Role</code>) and security policies.</td>
            </tr>
            <tr>
              <td><strong>AWS CloudShell</strong></td>
              <td><span class="badge-mgmt">MANAGEMENT</span></td>
              <td>Browser-based CLI environment used for deployment, database migrations, and AWS CLI verification (not in runtime path).</td>
            </tr>
            <tr>
              <td><strong>Billing & Cost Mgmt</strong></td>
              <td><span class="badge-mgmt">MANAGEMENT</span></td>
              <td>Cost allocation, budget tracking, and Free Tier consumption governance across provisioned project resources.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="callout aws" style="margin-top: 4px;">
        <strong>Database Engine Clarification:</strong> While the AWS console groups relational engines under <em>"Aurora and RDS"</em>, CloudCampus specifically deploys <strong>Amazon RDS for PostgreSQL</strong> (v17.5).
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>AWS Service Inventory &bull; Page 4 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 5: SERVICE CATEGORIZATION ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 5</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">4. AWS Service Categorization & Architecture Roles</h1>
        <p>
          The table below categorizes the deployed AWS cloud services according to foundational cloud computing domains, highlighting the separation of concerns across compute, networking, data persistence, and governance.
        </p>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th style="width: 26%;">Functional Domain</th>
              <th style="width: 32%;">AWS Services Utilized</th>
              <th style="width: 42%;">Architectural Role & Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Compute & Processing</strong></td>
              <td>Amazon EC2, AWS Lambda</td>
              <td>Stateless REST API backend cluster and event-driven serverless background workers.</td>
            </tr>
            <tr>
              <td><strong>Networking & Ingress</strong></td>
              <td>Amazon VPC, AWS ALB, Amazon API Gateway</td>
              <td>Network perimeter isolation, edge SSL termination, Layer-7 load balancing, and routing.</td>
            </tr>
            <tr>
              <td><strong>Relational Persistence</strong></td>
              <td>Amazon RDS for PostgreSQL</td>
              <td>ACID-compliant relational database for academic records, enrollments, and audit logs.</td>
            </tr>
            <tr>
              <td><strong>Object Storage</strong></td>
              <td>Amazon S3</td>
              <td>High-durability storage for user avatars, assignment PDFs, and submission archives.</td>
            </tr>
            <tr>
              <td><strong>Identity & Security</strong></td>
              <td>AWS Cognito, AWS IAM, AWS Secrets Manager</td>
              <td>OIDC user authentication, RBAC group tokens, least-privilege IAM, and runtime secret injection.</td>
            </tr>
            <tr>
              <td><strong>Messaging & Scheduling</strong></td>
              <td>Amazon SNS, Amazon EventBridge</td>
              <td>Asynchronous pub/sub notification delivery and scheduled cron automation.</td>
            </tr>
            <tr>
              <td><strong>Observability & Alarms</strong></td>
              <td>Amazon CloudWatch</td>
              <td>Live multi-service telemetry dashboard, metric threshold alarms, and log stream collection.</td>
            </tr>
            <tr>
              <td><strong>Cloud Administration</strong></td>
              <td>AWS CloudShell, AWS Billing & Cost Mgmt</td>
              <td>Browser-based CLI administration, SSM remote execution, and cost budget monitoring.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">Service Responsibility & Integration Pipelines</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 7.5pt; margin-top: 3px;">
          <div class="flow-card">
            <strong style="color: #0b192c;">1. Request Ingress & Backend Compute Pipeline:</strong><br/>
            Client Browser (HTTPS) &rarr; AWS Cognito JWT &rarr; API Gateway (7k2yo6gy77) &rarr; AWS ALB &rarr; EC2 Express Backend (Port 5000) &rarr; RDS PostgreSQL / S3.
          </div>
          <div class="flow-card">
            <strong style="color: #0b192c;">2. Asynchronous Serverless & Monitoring Pipeline:</strong><br/>
            Faculty Action &rarr; EC2 Lambda Invoke &rarr; In-VPC Lambda &rarr; Amazon SNS Broadcast &bull; Amazon EventBridge Cron &rarr; Reminder Lambda &bull; CloudWatch Telemetry.
          </div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Service Categorization &bull; Page 5 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 6: COMPLETE SYSTEM ARCHITECTURE DIAGRAM ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 6</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">5. Complete System Cloud Architecture</h1>
        <p style="font-size: 8pt; margin-bottom: 4px;">
          The diagram below illustrates the end-to-end multi-tier cloud architecture of CloudCampus. Requests originate from client browsers over HTTPS, authenticate with AWS Cognito, enter through AWS API Gateway, balance across the Application Load Balancer, execute on the clustered EC2 compute instance, persist in Amazon RDS PostgreSQL and Amazon S3, and trigger asynchronous AWS Lambda functions and CloudWatch telemetry.
        </p>
      </div>

      <div class="flow-card" style="background: #ffffff; border: 1.5px solid #cbd5e1; padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="text-align: center; margin-bottom: 6px;">
          <span style="font-size: 9pt; font-weight: 800; color: #0b192c; text-transform: uppercase; letter-spacing: 0.5px;">
            Figure 5.1 — Full-Page Multi-Tier Cloud Deployment Architecture Diagram
          </span>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 6px;">
          <div style="background: #e0f2fe; border: 1.5px solid #7dd3fc; border-radius: 6px; padding: 5px 14px; font-size: 8pt; font-weight: 800; color: #0369a1;">STUDENT (Browser)</div>
          <div style="background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 6px; padding: 5px 14px; font-size: 8pt; font-weight: 800; color: #b45309;">FACULTY (Browser)</div>
          <div style="background: #f3e8ff; border: 1.5px solid #d8b4fe; border-radius: 6px; padding: 5px 14px; font-size: 8pt; font-weight: 800; color: #7e22ce;">ADMIN (Browser)</div>
        </div>

        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800;">│ HTTPS / localhost:3000</div>
        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800;">▼</div>

        <div class="flow-step aws-step" style="width: 86%; margin: 0 auto; padding: 6px;">
          <strong style="font-size: 8.5pt;">AWS Cognito User Pool (us-east-1_Ic9huqJjL)</strong><br/>
          <span style="font-size: 7.2pt; font-weight: 500;">OAuth2 / OIDC JWT Tokens &bull; Client ID: 3kv2vgpkklqtlpfom2t72dn29n &bull; Groups: STUDENT, FACULTY, ADMIN</span>
        </div>

        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800; margin: 2px 0;">│ Bearer JWT Token Authorization</div>
        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800;">▼</div>

        <div class="flow-step aws-step" style="width: 86%; margin: 0 auto; padding: 6px;">
          <strong style="font-size: 8.5pt;">AWS API Gateway HTTP API (7k2yo6gy77)</strong><br/>
          <span style="font-size: 7.2pt; font-weight: 500;">Public Ingress &bull; Route: /prod/api/* &bull; Direct VPC Integration & Throttling</span>
        </div>

        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800; margin: 2px 0;">│ Target Traffic (Port 80/5000)</div>
        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800;">▼</div>

        <div class="flow-step aws-step" style="width: 86%; margin: 0 auto; padding: 6px;">
          <strong style="font-size: 8.5pt;">AWS Application Load Balancer (CloudCampus-ALB)</strong><br/>
          <span style="font-size: 7.2pt; font-weight: 500;">Target Group: CloudCampus-Backend-TG &bull; Automated Health Checks on /health</span>
        </div>

        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800; margin: 2px 0;">│ Forwarded Clustered Requests</div>
        <div style="text-align: center; font-size: 7.5pt; color: #64748b; font-weight: 800;">▼</div>

        <div class="flow-step highlight" style="width: 90%; margin: 0 auto; padding: 7px;">
          <strong style="font-size: 9pt;">AWS EC2 Application Server (i-03681025582d882c5)</strong><br/>
          <span style="font-size: 7.5pt; font-weight: 500; color: #cbd5e1;">Express 4.19 + Prisma ORM Cluster (PM2) &bull; Port 5000 &bull; Private Subnet in VPC vpc-0146f9a06bf1163a6</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px;">
          <div class="flow-step aws-step" style="padding: 6px;">
            <strong style="font-size: 8pt;">Amazon RDS PostgreSQL (cloudcampus-db)</strong><br/>
            <span style="font-size: 7pt; font-weight: 500;">Relational Data &bull; Port 5432 &bull; campusadmin &bull; SSL Enabled</span>
          </div>
          <div class="flow-step aws-step" style="padding: 6px;">
            <strong style="font-size: 8pt;">Amazon S3 Bucket (cloudcampus-511225358997)</strong><br/>
            <span style="font-size: 7pt; font-weight: 500;">Object Storage &bull; Profile Photos &bull; Assignment Submissions</span>
          </div>
        </div>

        <div style="margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <div class="flow-step" style="font-size: 7pt; padding: 4px;">
            <strong>AWS Lambda Services</strong><br/>Assignment & Reminder Functions
          </div>
          <div class="flow-step" style="font-size: 7pt; padding: 4px;">
            <strong>Amazon EventBridge</strong><br/>Daily Reminder Schedule
          </div>
          <div class="flow-step" style="font-size: 7pt; padding: 4px;">
            <strong>Amazon SNS</strong><br/>CloudCampus-Notifications Topic
          </div>
        </div>
      </div>

      <div class="callout success" style="margin-top: 4px;">
        <strong>Decoupled Cloud Primitives:</strong> User authentication, public ingress, application compute, relational persistence, and object storage operate as isolated managed tiers.
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Complete Cloud Architecture &bull; Page 6 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 7: VPC NETWORK TOPOLOGY ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 7</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">6. Amazon VPC Network Boundary & Subnets</h1>
        <p>
          All compute, database, and serverless Lambda executions are enclosed inside <strong>Amazon Virtual Private Cloud (VPC)</strong> <code>vpc-0146f9a06bf1163a6</code> across availability zones in <code>us-east-1</code>.
        </p>
      </div>

      <div class="flow-card" style="border: 2px solid #0284c7; background: #f0f9ff; padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="font-weight: 800; font-size: 8.8pt; color: #0369a1; margin-bottom: 6px; text-align: center;">
          Figure 6.1 — Amazon VPC Network Isolation: vpc-0146f9a06bf1163a6 (CIDR: 10.0.0.0/16)
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 8px;">
            <strong style="color: #0369a1; font-size: 7.8pt;">Public / Ingress Subnets</strong>
            <p style="font-size: 7.2pt; color: #475569; margin-top: 3px;">
              &bull; <code>subnet-030b656a0b401b23d</code> (us-east-1a)<br/>
              &bull; <code>subnet-0b8c7db479db1b113</code> (us-east-1b)<br/>
              Hosts: AWS Application Load Balancer (ALB)
            </p>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 8px;">
            <strong style="color: #0369a1; font-size: 7.8pt;">Private Compute & DB Subnets</strong>
            <p style="font-size: 7.2pt; color: #475569; margin-top: 3px;">
              &bull; <code>subnet-0ea7b2a7ac8952aa9</code> (us-east-1a)<br/>
              &bull; <code>subnet-02f2f01a92b63d057</code> (us-east-1b)<br/>
              Hosts: EC2 Backend, RDS PostgreSQL, VPC Lambdas
            </p>
          </div>
        </div>

        <div style="margin-top: 8px; background: #ffffff; border: 1.5px solid #bae6fd; border-radius: 6px; padding: 8px;">
          <strong style="color: #0369a1; font-size: 7.8pt;">VPC Interface & Gateway Endpoints</strong>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 7pt; color: #334155; margin-top: 3px;">
            <div><strong>S3 Gateway:</strong><br/><code>vpce-0abe4018a7179df71</code></div>
            <div><strong>Secrets Manager:</strong><br/><code>vpce-03453d022c9090b54</code></div>
            <div><strong>Amazon SNS:</strong><br/><code>vpce-01779161bced06bc7</code></div>
          </div>
        </div>
      </div>

      <div>
        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Security Group</th>
              <th>Associated Resource</th>
              <th>Ingress Security Rule</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sg-05b0adcaad20ea66f</code></td>
              <td>CloudCampus-EC2-SG (Backend & ALB)</td>
              <td>Accepts port 5000 from ALB; port 443 for VPC endpoints.</td>
            </tr>
            <tr>
              <td><code>sg-084f06c983a45c8b6</code></td>
              <td>RDS & VPC Lambda SG</td>
              <td>Accepts port 5432 (PostgreSQL) strictly from EC2 SG & Lambda ENIs.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>VPC Network Topology &bull; Page 7 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 8: INFRASTRUCTURE INVENTORY ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 8</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">7. Deployed AWS Infrastructure Inventory</h1>
        <p>
          The table below provides a verified inventory of all live AWS cloud resources provisioned for CloudCampus in the <code>us-east-1</code> region.
        </p>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Service</th>
              <th>Resource Identifier / Name</th>
              <th>Configuration / Parameters</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Auth</strong></td>
              <td>Cognito</td>
              <td><code>us-east-1_Ic9huqJjL</code></td>
              <td>User Pool with App Client <code>3kv2vgpkklqtlpfom2t72dn29n</code>, Hosted UI active.</td>
            </tr>
            <tr>
              <td><strong>Ingress</strong></td>
              <td>API Gateway</td>
              <td><code>7k2yo6gy77</code> (CloudCampus-API)</td>
              <td>HTTP API with <code>/prod</code> stage, CORS enabled, direct ALB integration.</td>
            </tr>
            <tr>
              <td><strong>Routing</strong></td>
              <td>ALB</td>
              <td><code>CloudCampus-ALB</code></td>
              <td>Internet-facing ALB, Target Group <code>CloudCampus-Backend-TG</code>, health check <code>/health</code>.</td>
            </tr>
            <tr>
              <td><strong>Compute</strong></td>
              <td>EC2</td>
              <td><code>i-03681025582d882c5</code></td>
              <td>Amazon Linux 2023, Node.js v20.20, PM2 cluster (2 worker instances), port 5000.</td>
            </tr>
            <tr>
              <td><strong>Database</strong></td>
              <td>RDS</td>
              <td><code>cloudcampus-db</code></td>
              <td>PostgreSQL 17.5, db.t3.micro, 20 GB gp2, database name <code>campusadmin</code>.</td>
            </tr>
            <tr>
              <td><strong>Storage</strong></td>
              <td>S3</td>
              <td><code>cloudcampus-511225358997</code></td>
              <td>Private bucket, SSE-S3 encryption, presigned URLs for client downloads.</td>
            </tr>
            <tr>
              <td><strong>Serverless</strong></td>
              <td>Lambda</td>
              <td><code>CloudCampus-Assignment-Notification</code></td>
              <td>Node.js 20.x, 256MB RAM, VPC subnets & endpoints for in-VPC RDS queries.</td>
            </tr>
            <tr>
              <td><strong>Serverless</strong></td>
              <td>Lambda</td>
              <td><code>CloudCampus-Assignment-Reminder</code></td>
              <td>Node.js 20.x, 256MB RAM, 60s timeout, duplicate-check logic against RDS.</td>
            </tr>
            <tr>
              <td><strong>Schedule</strong></td>
              <td>EventBridge</td>
              <td><code>CloudCampus-Assignment-Reminder-Schedule</code></td>
              <td>Schedule rule: <code>rate(1 day)</code> targeting Reminder Lambda.</td>
            </tr>
            <tr>
              <td><strong>Messaging</strong></td>
              <td>SNS</td>
              <td><code>CloudCampus-Notifications</code></td>
              <td>Standard SNS topic for academic notification fan-out.</td>
            </tr>
            <tr>
              <td><strong>Observability</strong></td>
              <td>CloudWatch</td>
              <td><code>CloudCampus-Monitoring</code></td>
              <td>12-widget dashboard tracking EC2, ALB, RDS, Lambda metrics & 4 alarms.</td>
            </tr>
            <tr>
              <td><strong>Secrets</strong></td>
              <td>Secrets Manager</td>
              <td><code>cloudcampus/rds</code></td>
              <td>Secure storage of PostgreSQL credentials with IAM-based retrieval on EC2 & Lambda.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">Verified Operating Health Across Cloud Clusters</h2>
        <div class="grid-4" style="margin-top: 3px;">
          <div class="card-stat"><div class="val">HTTP 200</div><div class="lbl">API Gateway</div></div>
          <div class="card-stat"><div class="val">HEALTHY</div><div class="lbl">ALB Targets</div></div>
          <div class="card-stat"><div class="val">ONLINE</div><div class="lbl">PM2 Workers</div></div>
          <div class="card-stat"><div class="val">AVAILABLE</div><div class="lbl">RDS Instance</div></div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Infrastructure Directory &bull; Page 8 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 9: COGNITO AUTH ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 9</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">8. User Identity & Authentication (AWS Cognito)</h1>
        <p>
          Authentication is fully decoupled from the application database. Users authenticate directly against <strong>AWS Cognito User Pool</strong> (<code>us-east-1_Ic9huqJjL</code>). Upon successful password validation, Cognito issues a signed OpenID Connect (OIDC) JWT ID token containing user identity claims and group memberships.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 8.1 — Cognito Cryptographic Verification & User Identity Linking Pipeline</div>
          <div class="flow-steps">
            <div class="flow-step">Browser Login</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Cognito User Pool</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">JWT Bearer Token</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">Express Backend</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">RDS User Link</div>
          </div>
        </div>
      </div>

      <div class="img-grid cols-2">
        <div class="img-box">
          <img src="${sLoginApp}" alt="CloudCampus Login UI" />
          <div class="img-caption">Figure 8.2 — CloudCampus Cloud-Only Authentication Interface</div>
        </div>
        <div class="img-box">
          <img src="${sCognitoHosted}" alt="Cognito Hosted UI" />
          <div class="img-caption">Figure 8.3 — AWS Cognito Managed OAuth2 Hosted UI</div>
        </div>
      </div>

      <div>
        <h2 class="sub-title">8.1 Server-Side Cryptographic Token Validation</h2>
        <p style="font-size: 7.8pt;">
          Every API request contains the Cognito JWT in the <code>Authorization: Bearer &lt;token&gt;</code> header. The Express <code>authenticate</code> middleware verifies the cryptographic signature against the official Cognito JSON Web Key Set (JWKS) URL at <code>https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Ic9huqJjL/.well-known/jwks.json</code>. The token subject (<code>cognitoSub</code>) is mapped to the corresponding active record in the RDS <code>User</code> table.
        </p>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Identity & Authentication &bull; Page 9 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 10: API GATEWAY & ALB ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 10</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">9. API Ingress Layer: API Gateway & ALB</h1>
        <p>
          The ingress architecture isolates the backend compute cluster behind a managed two-tier routing pipeline. <strong>Amazon API Gateway HTTP API</strong> acts as the single public entrypoint, proxying requests into the <strong>AWS Application Load Balancer (ALB)</strong>.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 9.1 — API Gateway to ALB Request Routing Flow</div>
          <div class="flow-steps">
            <div class="flow-step">Client Request (HTTPS)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">API Gateway (7k2yo6gy77)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">ALB (CloudCampus-ALB)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">EC2 Backend (:5000)</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Ingress Layer</th>
              <th>Configuration Detail</th>
              <th>Security & Operational Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>API Gateway</strong></td>
              <td>HTTP API ID: <code>7k2yo6gy77</code><br/>Base URL: <code>https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api</code></td>
              <td>DDoS mitigation, automated HTTPS certificates, global edge routing, and path rewriting.</td>
            </tr>
            <tr>
              <td><strong>Application Load Balancer</strong></td>
              <td>Name: <code>CloudCampus-ALB</code><br/>ARN: <code>.../app/CloudCampus-ALB/8dd3b61204d02d3a</code></td>
              <td>Layer-7 HTTP request distribution across backend target group instances.</td>
            </tr>
            <tr>
              <td><strong>Target Group Health Check</strong></td>
              <td>Name: <code>CloudCampus-Backend-TG</code><br/>Path: <code>/health</code> &bull; Port: <code>5000</code> &bull; Interval: 30s</td>
              <td>Automated failover detection ensuring only healthy EC2 backend instances receive traffic.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">9.1 Network Verification in Browser DevTools</h2>
        <div class="callout success">
          <strong>DevTools Network Audit:</strong> F12 inspection verifies 100% of XHR/Fetch API requests originate against <code>https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api/*</code>. Zero requests target localhost:5000 or local proxies.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>API Ingress & ALB &bull; Page 10 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 11: EC2 COMPUTE ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 11</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">10. Backend Compute: AWS EC2 & PM2 Cluster</h1>
        <p>
          The application backend executes on an <strong>Amazon EC2</strong> instance (<code>i-03681025582d882c5</code>) running Amazon Linux 2023. The Node.js / Express application is orchestrated using <strong>PM2 process manager</strong> in cluster mode across multiple worker processes.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 10.1 — EC2 Runtime Process & Secrets Lifecycle</div>
          <div class="flow-steps">
            <div class="flow-step">System Boot / PM2 Start</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">AWS Secrets Manager</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">Inject DATABASE_URL</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">Prisma Client Connect</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>EC2 Production Specification</th>
              <th>Operational Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Instance ID</strong></td>
              <td><code>i-03681025582d882c5</code></td>
              <td>Primary compute host in VPC <code>vpc-0146f9a06bf1163a6</code>.</td>
            </tr>
            <tr>
              <td><strong>Operating System</strong></td>
              <td>Amazon Linux 2023 (Kernel 6.1)</td>
              <td>Hardened enterprise Linux with AWS SSM Agent pre-installed.</td>
            </tr>
            <tr>
              <td><strong>Process Manager</strong></td>
              <td>PM2 Cluster Mode (2 workers)</td>
              <td>Zero-downtime reloads, automatic crash restarts, log rotation.</td>
            </tr>
            <tr>
              <td><strong>Application Stack</strong></td>
              <td>Express 4.19 + TypeScript + Prisma ORM</td>
              <td>REST API controllers, validation schemas, and database mappings.</td>
            </tr>
            <tr>
              <td><strong>IAM Instance Role</strong></td>
              <td><code>CloudCampus-EC2-Role</code></td>
              <td>Least-privilege access for Secrets Manager, S3, SSM, and Lambda invoke.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">10.1 Secrets Manager Integration Without Hardcoded Keys</h2>
        <p style="font-size: 7.8pt;">
          Zero database passwords or Cognito secrets exist in plaintext on the EC2 filesystem or Git repository. The EC2 instance retrieves credentials at runtime from AWS Secrets Manager (<code>cloudcampus/rds</code>) via IAM execution credentials.
        </p>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Backend Compute & EC2 &bull; Page 11 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 12: RDS POSTGRESQL ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 12</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">11. Relational Persistence: Amazon RDS PostgreSQL</h1>
        <p>
          All structured institutional entities are persisted in <strong>Amazon RDS for PostgreSQL 17.5</strong> (<code>cloudcampus-db</code>). The database is isolated inside private database subnets and accessible only from authorized security groups over SSL.
        </p>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Database Entity / Table</th>
              <th>Primary Keys & Relationships</th>
              <th>Core Attributes & Governance Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>User</code></td>
              <td><code>id (UUID)</code>, unique <code>email</code></td>
              <td>Role (<code>STUDENT</code>, <code>FACULTY</code>, <code>ADMIN</code>), <code>cognitoSub</code>, status, avatar S3 key.</td>
            </tr>
            <tr>
              <td><code>Student</code></td>
              <td><code>id</code>, FK <code>userId</code>, FK <code>departmentId</code></td>
              <td>Roll number, semester, batch year, GPA calculation, personal profile details.</td>
            </tr>
            <tr>
              <td><code>Faculty</code></td>
              <td><code>id</code>, FK <code>userId</code>, FK <code>departmentId</code></td>
              <td>Employee ID, designation, qualification, specialization, teaching experience.</td>
            </tr>
            <tr>
              <td><code>Course</code></td>
              <td><code>id</code>, unique <code>code</code>, FK <code>facultyId</code></td>
              <td>Course code, course name, credits, syllabus description, assigned faculty.</td>
            </tr>
            <tr>
              <td><code>Enrollment</code></td>
              <td><code>id</code>, FK <code>studentId</code>, FK <code>courseId</code></td>
              <td>Active course enrollments controlling student assignment & attendance access.</td>
            </tr>
            <tr>
              <td><code>Assignment</code></td>
              <td><code>id</code>, FK <code>courseId</code>, FK <code>facultyId</code></td>
              <td>Title, instructions, due date, max points, attached file reference.</td>
            </tr>
            <tr>
              <td><code>Attendance</code></td>
              <td><code>id</code>, FK <code>studentId</code>, FK <code>courseId</code></td>
              <td>Daily attendance logs (<code>PRESENT</code>, <code>ABSENT</code>, <code>LATE</code>) and aggregate percentages.</td>
            </tr>
            <tr>
              <td><code>Notification</code></td>
              <td><code>id</code>, FK <code>userId</code></td>
              <td>System notifications, unread flags, academic alerts created by Lambda.</td>
            </tr>
            <tr>
              <td><code>AuditLog</code></td>
              <td><code>id</code>, FK <code>userId</code></td>
              <td>Immutable audit records of user actions, timestamps, and target resources.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">11.1 Data Integrity & Constraint Governance</h2>
        <div class="callout success">
          <strong>Relational Isolation:</strong> Foreign key constraints, unique indexes on roll numbers and course codes, and transactional Prisma operations prevent orphaned records or invalid institutional state transitions.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Relational Persistence & RDS &bull; Page 12 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 13: S3 OBJECT STORAGE ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 13</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">12. Object Storage: Amazon S3 File Storage</h1>
        <p>
          Unstructured binary assets (profile avatars, assignment PDFs, and submission archives) are stored in <strong>Amazon S3</strong> (<code>cloudcampus-511225358997</code>). Rather than storing blobs in PostgreSQL, RDS stores only the S3 object key.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 12.1 — S3 Object Storage & Presigned Retrieval Pipeline</div>
          <div class="flow-steps">
            <div class="flow-step">Browser Upload</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">EC2 Upload Handler</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Amazon S3 PutObject</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">RDS Stores Key</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">Presigned GetObject</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Object Category</th>
              <th>S3 Key Path Structure</th>
              <th>Storage & Access Policy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>User Profile Photos</strong></td>
              <td><code>avatars/{userId}-{timestamp}.jpg</code></td>
              <td>Private S3 object; server signs presigned URLs valid for 1 hour on profile fetch.</td>
            </tr>
            <tr>
              <td><strong>Assignment Attachments</strong></td>
              <td><code>assignments/{courseId}/{assignmentId}.pdf</code></td>
              <td>Course materials uploaded by faculty with MIME type validation.</td>
            </tr>
            <tr>
              <td><strong>Student Submissions</strong></td>
              <td><code>submissions/{assignmentId}/{studentId}.zip</code></td>
              <td>Encrypted student lab files linked to submission records in RDS.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">12.1 Security & Access Control</h2>
        <p style="font-size: 7.8pt;">
          The bucket enforces <strong>Block Public Access</strong>. Client browsers never interact with public S3 URLs. When a user requests their profile or assignment documents, the backend generates short-lived AWS SDK presigned URLs, ensuring strict authorization before file delivery.
        </p>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Object Storage & S3 &bull; Page 13 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 14: PROFILE MANAGEMENT ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 14</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">13. Profile Management & S3 Avatar Pipeline</h1>
        <p>
          The Profile Management module enables Students, Faculty, and Administrators to update personal details and upload profile photos. Uploaded images are streamed to S3, recorded in RDS, and dynamically propagated to the top-right navigation header across all pages.
        </p>
      </div>

      <div class="img-grid cols-3">
        <div class="img-box">
          <img src="${sStudentProfile}" alt="Student Profile Management" />
          <div class="img-caption">Figure 13.1 — Student Profile Page with Photo</div>
        </div>
        <div class="img-box">
          <img src="${sFacultyProfile}" alt="Faculty Profile Management" />
          <div class="img-caption">Figure 13.2 — Faculty Profile Page Details</div>
        </div>
        <div class="img-box">
          <img src="${sAdminProfile}" alt="Admin Profile Management" />
          <div class="img-caption">Figure 13.3 — Admin System Profile</div>
        </div>
      </div>

      <div class="img-grid cols-2" style="margin-top: 3px;">
        <div class="img-box tall">
          <img src="${sStudentNavAvatar}" alt="Student Navbar Avatar" />
          <div class="img-caption">Figure 13.4 — Student Navigation Bar Top-Right Avatar Rendering</div>
        </div>
        <div class="img-box tall">
          <img src="${sFacultyNavAvatar}" alt="Faculty Navbar Avatar" />
          <div class="img-caption">Figure 13.5 — Faculty Navigation Bar Top-Right Avatar Rendering</div>
        </div>
      </div>

      <div class="callout success" style="margin-top: 3px;">
        <strong>Persistence Verification:</strong> After page reload and re-login, the top-right header automatically retrieves the presigned S3 avatar URL from the Cognito-authenticated session.
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Profile Management &bull; Page 14 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 15: STUDENT PORTAL ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 15</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">14. Student Portal Implementation & Verification</h1>
        <p>
          The Student portal provides authenticated access to course enrollments, attendance tracking, assignment deadlines, published semester examination marks, and campus event registrations.
        </p>
      </div>

      <div class="img-grid cols-2">
        <div class="img-box tall">
          <img src="${sStudentDash}" alt="Student Dashboard" />
          <div class="img-caption">Figure 14.1 — Student Dashboard with Live Academic Overview</div>
        </div>
        <div class="img-box tall">
          <img src="${sStudentAtt}" alt="Student Attendance" />
          <div class="img-caption">Figure 14.2 — Student Attendance Tracker & Percentage Breakdown</div>
        </div>
      </div>

      <div class="img-grid cols-3" style="margin-top: 3px;">
        <div class="img-box">
          <img src="${sStudentCourses}" alt="Student Enrolled Courses" />
          <div class="img-caption">Figure 14.3 — Enrolled Courses & Syllabus</div>
        </div>
        <div class="img-box">
          <img src="${sStudentResults}" alt="Student Semester Results" />
          <div class="img-caption">Figure 14.4 — Examination Grades & GPA</div>
        </div>
        <div class="img-box">
          <img src="${sStudentEvents}" alt="Student Campus Events" />
          <div class="img-caption">Figure 14.5 — Campus Events Directory</div>
        </div>
      </div>

      <div>
        <table class="data-table" style="margin-top: 3px;">
          <thead>
            <tr>
              <th>Student Module</th>
              <th>API Route</th>
              <th>Backend Data Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dashboard Metrics</strong></td>
              <td><code>GET /api/student/dashboard</code></td>
              <td>RDS Enrollment + Attendance + Results Aggregation</td>
              <td><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Course Catalog</strong></td>
              <td><code>GET /api/student/courses</code></td>
              <td>RDS Course Table with Faculty Details</td>
              <td><span class="badge-pass">PASS</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Student Portal &bull; Page 15 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 16: FACULTY PORTAL ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 16</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">15. Faculty Portal Implementation & Workflows</h1>
        <p>
          The Faculty portal provides educators with class roster management, student attendance marking, assignment authoring with automated Lambda notification triggers, and student submission grading.
        </p>
      </div>

      <div class="img-grid cols-2">
        <div class="img-box tall">
          <img src="${sFacultyDash}" alt="Faculty Dashboard" />
          <div class="img-caption">Figure 15.1 — Faculty Dashboard with Assigned Classes Overview</div>
        </div>
        <div class="img-box tall">
          <img src="${sFacultyCourses}" alt="Faculty Assigned Courses" />
          <div class="img-caption">Figure 15.2 — Faculty Course Catalog & Enrolled Student Lists</div>
        </div>
      </div>

      <div class="img-grid cols-3" style="margin-top: 3px;">
        <div class="img-box">
          <img src="${sFacultyAtt}" alt="Faculty Attendance Marking" />
          <div class="img-caption">Figure 15.3 — Live Attendance Marking</div>
        </div>
        <div class="img-box">
          <img src="${sFacultyGrading}" alt="Faculty Grading Submissions" />
          <div class="img-caption">Figure 15.4 — Submission Grading</div>
        </div>
        <div class="img-box">
          <img src="${sFacultyAnnounce}" alt="Faculty Announcements" />
          <div class="img-caption">Figure 15.5 — Notice Broadcast</div>
        </div>
      </div>

      <div>
        <table class="data-table" style="margin-top: 3px;">
          <thead>
            <tr>
              <th>Faculty Feature</th>
              <th>API Endpoint</th>
              <th>AWS Integration Trigger</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Publish Assignment</strong></td>
              <td><code>POST /api/faculty/assignments</code></td>
              <td>Triggers <code>CloudCampus-Assignment-Notification</code> Lambda</td>
              <td><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Record Attendance</strong></td>
              <td><code>POST /api/faculty/attendance</code></td>
              <td>Batch inserts Attendance records and creates AuditLog in RDS</td>
              <td><span class="badge-pass">PASS</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Faculty Portal &bull; Page 16 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 17: ADMIN PORTAL ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 17</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">16. Administrator Governance Portal</h1>
        <p>
          The Administrator portal provides institution-level governance over student admissions, faculty appointments, departmental structures, course allocations, institutional reporting, and immutable audit logs.
        </p>
      </div>

      <div class="img-grid cols-2">
        <div class="img-box tall">
          <img src="${sAdminDash}" alt="Admin Overview Dashboard" />
          <div class="img-caption">Figure 16.1 — Admin Command Dashboard with Cluster Statistics</div>
        </div>
        <div class="img-box tall">
          <img src="${sAdminStudents}" alt="Admin Student Records" />
          <div class="img-caption">Figure 16.2 — Student Admissions & Records Governance</div>
        </div>
      </div>

      <div class="img-grid cols-3" style="margin-top: 3px;">
        <div class="img-box">
          <img src="${sAdminFaculty}" alt="Admin Faculty Roster" />
          <div class="img-caption">Figure 16.3 — Faculty Roster</div>
        </div>
        <div class="img-box">
          <img src="${sAdminDepts}" alt="Admin Departments" />
          <div class="img-caption">Figure 16.4 — Academic Depts</div>
        </div>
        <div class="img-box">
          <img src="${sAdminCourses}" alt="Admin Courses" />
          <div class="img-caption">Figure 16.5 — Course Allocation</div>
        </div>
      </div>

      <div class="img-grid cols-2" style="margin-top: 3px;">
        <div class="img-box">
          <img src="${sAdminEnroll}" alt="Admin Enrollments" />
          <div class="img-caption">Figure 16.6 — Course Enrollments</div>
        </div>
        <div class="img-box">
          <img src="${sAdminReports}" alt="Admin Export Reports" />
          <div class="img-caption">Figure 16.7 — Institutional Reports (JSON/CSV)</div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Admin Portal &bull; Page 17 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 18: WORKFLOW A — LAMBDA NOTIFICATIONS ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 18</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">17. Serverless Notifications: AWS Lambda & SNS</h1>
        <p>
          <strong>Workflow A (Event-Driven Assignment Creation):</strong> When a faculty member publishes an assignment, the EC2 Express backend saves the assignment in RDS and asynchronously invokes <strong>AWS Lambda</strong> (<code>CloudCampus-Assignment-Notification</code>) with <code>InvocationType: 'Event'</code>.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 17.1 — Workflow A: Asynchronous Serverless Notification Pipeline</div>
          <div class="flow-steps">
            <div class="flow-step">Faculty Publishes Assignment</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">EC2 Express Backend</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Lambda (Assignment-Notification)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Amazon SNS Topic</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">Student Notification Feed</div>
          </div>
        </div>
      </div>

      <div class="img-grid cols-2">
        <div class="img-box tall">
          <img src="${sStudentAssign}" alt="Student Assignment View" />
          <div class="img-caption">Figure 17.2 — Newly Published Assignment Visible to Enrolled Students</div>
        </div>
        <div class="img-box tall">
          <img src="${sStudentNotifs}" alt="Student Notification Alert" />
          <div class="img-caption">Figure 17.3 — Real-Time Lambda Notification Delivered to Student Feed</div>
        </div>
      </div>

      <div>
        <h2 class="sub-title">17.1 In-VPC Lambda Execution & Enrolled Student Isolation</h2>
        <ul style="padding-left: 14px; font-size: 7.8pt; line-height: 1.4; color: #334155;">
          <li>Lambda connects to RDS PostgreSQL over VPC subnets using credentials retrieved from AWS Secrets Manager.</li>
          <li>Lambda queries active enrollments (<code>courseId = assignment.courseId AND status = 'ACTIVE'</code>).</li>
          <li><strong>Enrolled Isolation Verified:</strong> Enrolled students received notifications; non-enrolled students received 0 alerts.</li>
          <li><strong>Duplicate Prevention:</strong> Duplicate check queries ensure repeated triggers do not create duplicate notification rows.</li>
        </ul>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Serverless Notifications &bull; Page 18 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 19: WORKFLOW B — EVENTBRIDGE REMINDERS ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 19</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">18. Scheduled Reminders: EventBridge & Lambda</h1>
        <p>
          <strong>Workflow B (Scheduled Assignment Due-Date Reminders):</strong> An <strong>Amazon EventBridge</strong> rule executes on a recurring schedule to trigger <code>CloudCampus-Assignment-Reminder</code>. The Lambda scans RDS for assignments due in the next 48 hours and alerts enrolled students.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 18.1 — Workflow B: Scheduled EventBridge Automation Flow</div>
          <div class="flow-steps">
            <div class="flow-step aws-step">EventBridge Rule (rate(1 day))</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Lambda (Assignment-Reminder)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">Query RDS (Due &lt; 48h)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">Check Duplicate Reminder</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">Insert Notification</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Workflow Component</th>
              <th>AWS Specification</th>
              <th>Verification Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>EventBridge Rule</strong></td>
              <td><code>CloudCampus-Assignment-Reminder-Schedule</code> (State: ENABLED)</td>
              <td>Rule triggers Lambda on schedule without manual intervention.</td>
            </tr>
            <tr>
              <td><strong>Reminder Lambda</strong></td>
              <td><code>CloudCampus-Assignment-Reminder</code> (Node.js 20.x, VPC enabled)</td>
              <td>Successfully identified 1 assignment due in 24h for 3 enrolled students.</td>
            </tr>
            <tr>
              <td><strong>Duplicate Prevention</strong></td>
              <td>DB Title Query: <code>Reminder: Assignment Due Soon — {title}</code></td>
              <td>100% duplicate suppression verified: 0 duplicate rows created on re-runs.</td>
            </tr>
            <tr>
              <td><strong>SNS Fanout</strong></td>
              <td>ARN: <code>arn:aws:sns:us-east-1:511225358997:CloudCampus-Notifications</code></td>
              <td>Broadcast summary payload published to SNS topic via VPC endpoint.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">18.1 Live Execution Evidence from CloudWatch</h2>
        <div class="callout aws">
          <strong>Execution Payload:</strong> <code>{"success":true,"data":{"assignmentsChecked":1,"totalRemindersCreated":3,"totalRemindersSkipped":0}}</code>. Subsequent immediate re-execution returned <code>{"totalRemindersCreated":0,"totalRemindersSkipped":3}</code>, proving perfect idempotency.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Scheduled Reminders &bull; Page 19 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 20: ADMIN AUDIT LOGS ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 20</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">19. Admin Immutable Audit Logging System</h1>
        <p>
          Security and institutional governance require full accountability. CloudCampus logs critical business events (assignment creation, profile photo uploads, attendance marking, and grade publishing) into the immutable RDS <code>AuditLog</code> table.
        </p>
      </div>

      <div class="img-box hero-img">
        <img src="${sAdminAudit}" alt="Admin Audit Log UI" />
        <div class="img-caption">Figure 19.1 — Admin Audit Trail UI Displaying Real Verified Actions from AWS RDS PostgreSQL</div>
      </div>

      <div>
        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>User Identity & Role</th>
              <th>Action Code</th>
              <th>Target Resource & ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>2026-09-02 19:00:07</code></td>
              <td><code>faculty@campus.local</code> (FACULTY)</td>
              <td><code>CREATE_ASSIGNMENT</code></td>
              <td><code>Assignment (b0c978fb-d5f6)</code></td>
              <td><span class="badge-pass">VERIFIED</span></td>
            </tr>
            <tr>
              <td><code>2026-09-02 18:46:39</code></td>
              <td><code>faculty@campus.local</code> (FACULTY)</td>
              <td><code>UPLOAD_AVATAR</code></td>
              <td><code>User (76dceb49-d497)</code></td>
              <td><span class="badge-pass">VERIFIED</span></td>
            </tr>
            <tr>
              <td><code>2026-09-02 18:43:41</code></td>
              <td><code>student@campus.local</code> (STUDENT)</td>
              <td><code>UPLOAD_AVATAR</code></td>
              <td><code>User (535ae6e1-7b5a)</code></td>
              <td><span class="badge-pass">VERIFIED</span></td>
            </tr>
            <tr>
              <td><code>2026-09-02 17:58:22</code></td>
              <td><code>faculty@campus.local</code> (FACULTY)</td>
              <td><code>GRADE_SUBMISSION</code></td>
              <td><code>Submission (c1fc099c-4e9e)</code></td>
              <td><span class="badge-pass">VERIFIED</span></td>
            </tr>
          </tbody>
        </table>

        <div class="callout success" style="margin-top: 3px;">
          <strong>Zero Sensitive Exposure:</strong> Passwords, Cognito JWTs, session tokens, and database credentials are strictly scrubbed before audit persistence.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Admin Audit Logging &bull; Page 20 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 21: ROLE-BASED API SECURITY ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 21</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">20. Role-Based API Security & RBAC Matrix</h1>
        <p>
          Security is enforced strictly on the server-side. Modifying frontend URLs or manipulating client-side state cannot bypass authorization; the Express <code>authorize(['STUDENT'|'FACULTY'|'ADMIN'])</code> middleware enforces authorization on every request.
        </p>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>API Endpoint & Method</th>
              <th style="text-align: center;">STUDENT</th>
              <th style="text-align: center;">FACULTY</th>
              <th style="text-align: center;">ADMIN</th>
              <th>Enforced Scope & Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>GET /api/auth/profile</code></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td>Retrieve authenticated profile & presigned avatar</td>
            </tr>
            <tr>
              <td><code>POST /api/auth/profile/avatar</code></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td>Upload profile image to private S3 bucket</td>
            </tr>
            <tr>
              <td><code>GET /api/student/dashboard</code></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td>Student academic summary & course metrics</td>
            </tr>
            <tr>
              <td><code>POST /api/student/assignments/submit</code></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td>Submit student lab assignment file to S3</td>
            </tr>
            <tr>
              <td><code>GET /api/faculty/dashboard</code></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td>Faculty teaching overview & assigned classes</td>
            </tr>
            <tr>
              <td><code>POST /api/faculty/assignments</code></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td>Create assignment & invoke Lambda notification</td>
            </tr>
            <tr>
              <td><code>GET /api/admin/dashboard</code></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td>Cluster statistics, user admissions, system health</td>
            </tr>
            <tr>
              <td><code>GET /api/admin/audit-logs</code></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-denied">✗</span></td>
              <td style="text-align: center;"><span class="badge-pass">✓</span></td>
              <td>View system audit trail & security events</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">20.1 Automated HTTP Security Test Results</h2>
        <div class="grid-4" style="margin-top: 3px;">
          <div class="card-stat"><div class="val">401</div><div class="lbl">Unauthenticated</div></div>
          <div class="card-stat"><div class="val">403</div><div class="lbl">Student &rarr; Faculty</div></div>
          <div class="card-stat"><div class="val">403</div><div class="lbl">Faculty &rarr; Admin</div></div>
          <div class="card-stat"><div class="val">200</div><div class="lbl">Admin &rarr; Admin</div></div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Role-Based API Security &bull; Page 21 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 22: IAM & SECRETS MANAGER ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 22</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">21. AWS IAM Security & Secrets Manager</h1>
        <p>
          The security posture of CloudCampus enforces the principle of <strong>Least Privilege</strong> across compute instances and serverless functions via AWS Identity and Access Management (IAM) and AWS Secrets Manager.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 21.1 — Runtime Secret Resolution & IAM Permission Boundaries</div>
          <div class="flow-steps">
            <div class="flow-step">EC2 / Lambda Boot</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">IAM Role Assumed</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">Secrets Manager (cloudcampus/rds)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">In-Memory Connection String</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>IAM Role / Policy</th>
              <th>Assigned Resource</th>
              <th>Permitted Operations & Boundaries</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>CloudCampus-EC2-Role</code></td>
              <td>EC2 Backend Instance (<code>i-03681025582d882c5</code>)</td>
              <td><code>secretsmanager:GetSecretValue</code>, <code>s3:PutObject</code>, <code>s3:GetObject</code>, <code>lambda:InvokeFunction</code>.</td>
            </tr>
            <tr>
              <td><code>CloudCampus-Lambda-Execution-Role</code></td>
              <td>Assignment Notification & Reminder Lambdas</td>
              <td><code>AWSLambdaVPCAccessExecutionRole</code>, <code>secretsmanager:GetSecretValue</code>, <code>sns:Publish</code>.</td>
            </tr>
            <tr>
              <td><code>CloudCampus-SNS-Publish</code></td>
              <td>Lambda Execution Role</td>
              <td>Allows publication strictly to <code>arn:aws:sns:...:CloudCampus-Notifications</code>.</td>
            </tr>
            <tr>
              <td><code>CloudCampus-EC2-Invoke-Lambda</code></td>
              <td>EC2 IAM Role</td>
              <td>Allows EC2 to invoke <code>CloudCampus-Assignment-Notification</code> asynchronously.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">21.1 Zero Hardcoded Secrets Assurance</h2>
        <div class="callout success">
          <strong>Hardened Credential Security:</strong> Database connection strings, database passwords, and Cognito API credentials are never written to source code, environment files, or terminal logs.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>IAM & Secrets Manager &bull; Page 22 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 23: CLOUDWATCH MONITORING ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 23</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">22. CloudWatch Monitoring & Metric Alarms</h1>
        <p>
          Full-stack system observability is maintained via <strong>Amazon CloudWatch Dashboard</strong> (<code>CloudCampus-Monitoring</code>). The dashboard consolidates 12 telemetry metrics across EC2, ALB, API Gateway, RDS, and Lambda alongside 4 proactive alarms.
        </p>
      </div>

      <div class="img-box hero-img">
        <img src="${sAdminMonitor}" alt="CloudWatch Monitoring Dashboard" />
        <div class="img-caption">Figure 22.1 — Live AWS CloudWatch Telemetry Dashboard & Alarms Status</div>
      </div>

      <div>
        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Monitored Resource</th>
              <th>CloudWatch Metrics Tracked</th>
              <th>Configured Alarm & Threshold</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>EC2 Instance</strong></td>
              <td><code>CPUUtilization</code>, <code>NetworkIn/Out</code>, <code>StatusCheckFailed</code></td>
              <td><code>CloudCampus-EC2-HighCPU</code> (&gt;= 80% CPU for 10 min)</td>
            </tr>
            <tr>
              <td><strong>Load Balancer (ALB)</strong></td>
              <td><code>RequestCount</code>, <code>TargetResponseTime</code>, <code>HTTPCode_Target_5XX</code></td>
              <td><code>CloudCampus-ALB-5XX-Errors</code> (&gt;= 5 errors in 5 min)</td>
            </tr>
            <tr>
              <td><strong>RDS Database</strong></td>
              <td><code>CPUUtilization</code>, <code>DatabaseConnections</code>, <code>FreeStorageSpace</code></td>
              <td><code>CloudCampus-RDS-HighCPU</code> (&gt;= 80% CPU for 10 min)</td>
            </tr>
            <tr>
              <td><strong>Lambda Functions</strong></td>
              <td><code>Invocations</code>, <code>Duration</code>, <code>Errors</code>, <code>Throttles</code></td>
              <td><code>CloudCampus-Lambda-Errors</code> (&gt;= 1 error in 5 min)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>CloudWatch Monitoring &bull; Page 23 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 24: THREE-LAYER VERIFICATION ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 24</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">23. Three-Layer End-to-End System Verification</h1>
        <p>
          To ensure production integrity, every major capability is validated across three independent architectural layers: <strong>Browser UI &rarr; API Gateway / Network &rarr; AWS RDS / S3 Cloud Persistence</strong>.
        </p>

        <div class="flow-card" style="margin-top: 4px;">
          <div style="font-weight: 700; font-size: 7.5pt; color: #0b192c; margin-bottom: 2px;">Figure 23.1 — Three-Layer Verification Methodology</div>
          <div class="flow-steps">
            <div class="flow-step">1. Real User Action in UI</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step aws-step">2. API Gateway HTTP 200</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step highlight">3. Query RDS / S3 Direct</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-step">4. Browser Cross-Verification</div>
          </div>
        </div>

        <table class="data-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th>Workflow Tested</th>
              <th>Layer 1: Browser UI Action</th>
              <th>Layer 2: API Gateway Inspection</th>
              <th>Layer 3: AWS RDS / S3 Proof</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Profile Photo Upload</strong></td>
              <td>User selects JPEG file & clicks "Upload Photo"</td>
              <td><code>POST /api/auth/profile/avatar</code> &rarr; HTTP 200 with presigned URL</td>
              <td>S3 object created in <code>cloudcampus-511225358997</code>; key stored in RDS User table</td>
            </tr>
            <tr>
              <td><strong>Assignment Notification</strong></td>
              <td>Faculty creates assignment "VLSI Synthesis Lab"</td>
              <td><code>POST /api/faculty/assignments</code> &rarr; HTTP 201 response</td>
              <td>Lambda triggered asynchronously; 3 rows inserted in RDS Notification table; SNS alert sent</td>
            </tr>
            <tr>
              <td><strong>Attendance Recording</strong></td>
              <td>Faculty marks attendance for CSE203 class</td>
              <td><code>POST /api/faculty/attendance</code> &rarr; HTTP 200 batch response</td>
              <td>Batch rows in RDS Attendance; AuditLog entry inserted; Student UI updates %</td>
            </tr>
            <tr>
              <td><strong>Audit Trail Logging</strong></td>
              <td>User performs administrative action</td>
              <td><code>GET /api/admin/audit-logs</code> returns paginated logs</td>
              <td>Immutable row in RDS <code>AuditLog</code> with timestamp, user email, and action</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">23.1 Cross-Verification Integrity</h2>
        <div class="callout success">
          <strong>Zero Artificial Mocking:</strong> Modifying a record in RDS directly reflects in the UI upon reload; conversely, creating a record in the UI immediately creates verified rows in AWS PostgreSQL.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Three-Layer Verification &bull; Page 24 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 25: FUNCTIONAL TESTING MATRIX (REFLOWED & PERFECTED) ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 25</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">24. Comprehensive Functional Testing & Results</h1>
        <p>
          The table below details the exhaustive end-to-end verification executed across all system modules, authentication states, and cloud services on the live AWS production deployment.
        </p>

        <table class="data-table" style="margin-top: 5px; font-size: 7.8pt;">
          <thead>
            <tr>
              <th style="width: 22%;">Test Scenario</th>
              <th style="width: 24%;">Execution Method</th>
              <th style="width: 24%;">Expected Result</th>
              <th style="width: 20%;">Observed Result</th>
              <th style="width: 10%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Student Cognito Login</strong></td>
              <td>Authenticate <code>student@campus.local</code></td>
              <td>Receive valid JWT, redirect to /student/dashboard</td>
              <td>HTTP 200, JWT stored, dashboard rendered</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Faculty Cognito Login</strong></td>
              <td>Authenticate <code>faculty@campus.local</code></td>
              <td>Receive valid JWT, redirect to /faculty/dashboard</td>
              <td>HTTP 200, JWT stored, dashboard rendered</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Admin Cognito Login</strong></td>
              <td>Authenticate <code>admin@campus.local</code></td>
              <td>Receive valid JWT, redirect to /admin/dashboard</td>
              <td>HTTP 200, JWT stored, dashboard rendered</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Avatar Upload to S3</strong></td>
              <td>Upload avatar from Student profile</td>
              <td>Image saved to S3, top-right avatar updates</td>
              <td>S3 key stored in RDS, avatar rendered in navbar</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>New Assignment Lambda</strong></td>
              <td>Faculty creates assignment in EC201</td>
              <td>Lambda triggered, alerts inserted in RDS for enrolled</td>
              <td>2 notifications created, 0 for non-enrolled</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Reminder Lambda Cron</strong></td>
              <td>Trigger <code>CloudCampus-Assignment-Reminder</code></td>
              <td>Find assignments due in 48h, prevent duplicates</td>
              <td>3 reminders created; 2nd run created 0 (skipped 3)</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Student Role Security</strong></td>
              <td>Student token &rarr; <code>/api/faculty/dashboard</code></td>
              <td>Server returns HTTP 403 Forbidden</td>
              <td>HTTP 403 Forbidden with error payload</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Faculty Role Security</strong></td>
              <td>Faculty token &rarr; <code>/api/admin/dashboard</code></td>
              <td>Server returns HTTP 403 Forbidden</td>
              <td>HTTP 403 Forbidden with error payload</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Unauthenticated Access</strong></td>
              <td>No Authorization header &rarr; protected route</td>
              <td>Server returns HTTP 401 Unauthorized</td>
              <td>HTTP 401 Unauthorized</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>Audit Trail Persistence</strong></td>
              <td>Execute assignment creation</td>
              <td>Row inserted in RDS AuditLog table</td>
              <td>Row verified in RDS; visible in Admin Audit UI</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
            <tr>
              <td><strong>CloudWatch Dashboard</strong></td>
              <td>Query <code>CloudCampus-Monitoring</code></td>
              <td>12 active widgets with live data points</td>
              <td>Active metrics retrieved for EC2, RDS, Lambda</td>
              <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flow-card" style="margin-top: 6px; padding: 8px 10px;">
        <h2 class="sub-title" style="margin-top: 0; color: #0b192c;">Testing Coverage & Quality Gate Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 4px;">
          <div class="card-stat">
            <div class="val" style="color: #15803d;">11 / 11</div>
            <div class="lbl">Automated Scenarios</div>
          </div>
          <div class="card-stat">
            <div class="val" style="color: #0369a1;">100%</div>
            <div class="lbl">Role RBAC Pass Rate</div>
          </div>
          <div class="card-stat">
            <div class="val" style="color: #c2410c;">0</div>
            <div class="lbl">Critical Cloud Defects</div>
          </div>
          <div class="card-stat">
            <div class="val" style="color: #7e22ce;">3 / 3</div>
            <div class="lbl">Roles End-to-End</div>
          </div>
        </div>
        <p style="font-size: 7.4pt; color: #475569; margin-top: 5px;">
          <em>All tests were executed through real browser user sessions backed by AWS API Gateway and PostgreSQL persistence, confirming seamless multi-tier coordination across all academic modules.</em>
        </p>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Functional Testing Matrix &bull; Page 25 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 26: CLOUD VS LOCAL & SCALABILITY (REFLOWED & PERFECTED) ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 26</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">25. Cloud vs. Local Architecture & Scalability</h1>
        <p>
          Migrating from a single-machine local development environment to an enterprise multi-tier AWS cloud architecture provides substantial durability, security, and scalability advantages.
        </p>

        <table class="data-table" style="margin-top: 5px; font-size: 7.8pt;">
          <thead>
            <tr>
              <th style="width: 25%;">Architecture Dimension</th>
              <th style="width: 35%; background: #334155;">Local Development Environment</th>
              <th style="width: 40%; background: #ff9900; color: #000000;">CloudCampus AWS Production Architecture</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>User Authentication</strong></td>
              <td>Local bcrypt in database (vulnerable to leak)</td>
              <td><strong>AWS Cognito:</strong> Managed OIDC, OAuth2, brute-force protection.</td>
            </tr>
            <tr>
              <td><strong>API Access & Routing</strong></td>
              <td>Direct port binding (localhost:5000)</td>
              <td><strong>API Gateway + ALB:</strong> Edge throttling, SSL offloading.</td>
            </tr>
            <tr>
              <td><strong>Compute Process</strong></td>
              <td>Single node process in terminal</td>
              <td><strong>EC2 + PM2 Cluster:</strong> Automated process restart & zero downtime.</td>
            </tr>
            <tr>
              <td><strong>Database Persistence</strong></td>
              <td>Local PostgreSQL instance</td>
              <td><strong>AWS RDS PostgreSQL:</strong> Managed storage, automated snapshots.</td>
            </tr>
            <tr>
              <td><strong>File & Media Storage</strong></td>
              <td>Local server disk filesystem</td>
              <td><strong>Amazon S3:</strong> Durable 99.999999999% object storage.</td>
            </tr>
            <tr>
              <td><strong>Background Jobs</strong></td>
              <td>In-process setTimeout / blocking loops</td>
              <td><strong>AWS Lambda:</strong> Event-driven asynchronous compute.</td>
            </tr>
            <tr>
              <td><strong>Scheduled Automation</strong></td>
              <td>Local system cron daemon</td>
              <td><strong>Amazon EventBridge:</strong> Reliable serverless cron rules.</td>
            </tr>
            <tr>
              <td><strong>System Observability</strong></td>
              <td>Terminal stdout / console.log</td>
              <td><strong>AWS CloudWatch:</strong> Centralized metrics, log streams & alarms.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flow-card" style="margin-top: 6px; padding: 8px 10px;">
        <h2 class="sub-title" style="margin-top: 0; color: #0b192c;">25.1 Scalability & Fault Isolation Principles</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 7.4pt; color: #334155; margin-top: 4px;">
          <div>
            <strong>1. Stateless Compute Tier:</strong><br/>
            The Express backend running on EC2 stores zero session state on disk. All user sessions are encapsulated in cryptographic Cognito JWTs, allowing horizontal compute scaling behind the Application Load Balancer.
          </div>
          <div>
            <strong>2. Managed Persistence Tier:</strong><br/>
            Separating structured academic records in Amazon RDS PostgreSQL from binary media in Amazon S3 prevents database I/O bottlenecks and enables independent storage auto-scaling.
          </div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Cloud vs Local & Scalability &bull; Page 26 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 27: COST & JUSTIFICATION (REFLOWED & PERFECTED) ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 27</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">26. AWS Cost Considerations & Architectural Rationale</h1>
        <p>
          The cloud resource selection was guided by a strict balance of architectural capability, high reliability, and educational cost optimization.
        </p>

        <table class="data-table" style="margin-top: 4px; font-size: 7.6pt;">
          <thead>
            <tr>
              <th style="width: 25%;">AWS Service</th>
              <th style="width: 35%;">Resource Sizing in CloudCampus</th>
              <th style="width: 40%;">AWS Billing & Cost Model</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Amazon EC2</strong></td>
              <td>t3.medium (2 vCPU, 4GB RAM)</td>
              <td>Hourly instance compute pricing ($0.0416/hr in us-east-1).</td>
            </tr>
            <tr>
              <td><strong>Amazon RDS</strong></td>
              <td>db.t3.micro (PostgreSQL 17.5, 20GB gp2)</td>
              <td>Free Tier eligible / low-cost instance runtime + allocated storage.</td>
            </tr>
            <tr>
              <td><strong>AWS Cognito</strong></td>
              <td>User Pool (us-east-1_Ic9huqJjL)</td>
              <td>Free Tier covers up to 50,000 Monthly Active Users (MAUs).</td>
            </tr>
            <tr>
              <td><strong>Amazon S3</strong></td>
              <td>Standard Bucket (cloudcampus-511225358997)</td>
              <td>Pay-per-GB stored ($0.023/GB-month) + PUT/GET request fees.</td>
            </tr>
            <tr>
              <td><strong>AWS Lambda</strong></td>
              <td>2 Functions (256MB RAM, &lt;1s runtime)</td>
              <td>Free Tier covers 1,000,000 requests & 3.2M seconds of compute/month.</td>
            </tr>
            <tr>
              <td><strong>Amazon API Gateway</strong></td>
              <td>HTTP API (7k2yo6gy77)</td>
              <td>Low-cost request pricing ($1.00 per million requests).</td>
            </tr>
            <tr>
              <td><strong>Amazon CloudWatch</strong></td>
              <td>Dashboard + 4 Alarms + Log Ingestion</td>
              <td>Free Tier covers 10 metrics, 3 dashboards, 10 alarms, 5GB logs.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2 class="sub-title">26.1 "Why This Architecture?" Justification Matrix</h2>
        <table class="data-table" style="font-size: 7.4pt; margin-top: 3px;">
          <thead>
            <tr>
              <th style="width: 28%;">Design Decision</th>
              <th style="width: 72%;">Engineering Rationale & Production Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>EC2 for Express Backend</strong></td>
              <td>Preserves full compatibility with Prisma ORM, WebSocket readiness, and complex multi-step transactions.</td>
            </tr>
            <tr>
              <td><strong>RDS PostgreSQL for Data</strong></td>
              <td>Provides enterprise relational integrity, ACID transactions, foreign key constraints, and automated snapshots.</td>
            </tr>
            <tr>
              <td><strong>S3 for Avatars & Files</strong></td>
              <td>Offloads heavy binary I/O from PostgreSQL, preventing database memory pressure and storage bloat.</td>
            </tr>
            <tr>
              <td><strong>Cognito for Identity</strong></td>
              <td>Eliminates security liabilities of local password hashing, token generation, and credential leaks on the server.</td>
            </tr>
            <tr>
              <td><strong>Lambda for Notifications</strong></td>
              <td>Decouples notification dispatch from user request loops, guaranteeing instantaneous API response times.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Cost & Architectural Rationale &bull; Page 27 of 28</div>
    </div>
  </div>

  <!-- ================= PAGE 28: CAPABILITIES GRID & CONCLUSION ================= -->
  <div class="page">
    <div class="page-header">
      <div class="brand"><span class="brand-badge">AWS</span> CloudCampus Deployment Report</div>
      <div>IIITDM Kurnool &bull; Page 28</div>
    </div>
    <div class="page-content">
      <div>
        <h1 class="sec-title">27. CloudCampus Capabilities, Conclusion & References</h1>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin: 4px 0;">
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🔐</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">AWS Cognito</div>
            <div style="font-size: 6pt; color: #64748b;">Identity & JWT RBAC</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">☁️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">API Gateway</div>
            <div style="font-size: 6pt; color: #64748b;">HTTPS Ingress</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">⚖️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">AWS ALB</div>
            <div style="font-size: 6pt; color: #64748b;">Layer-7 Routing</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🖥️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">AWS EC2</div>
            <div style="font-size: 6pt; color: #64748b;">PM2 Express Cluster</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🗄️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">RDS PostgreSQL</div>
            <div style="font-size: 6pt; color: #64748b;">Relational Persistence</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">📦</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">Amazon S3</div>
            <div style="font-size: 6pt; color: #64748b;">Object Storage</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">⚡</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">AWS Lambda</div>
            <div style="font-size: 6pt; color: #64748b;">Serverless Events</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🔔</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">Amazon SNS</div>
            <div style="font-size: 6pt; color: #64748b;">Pub/Sub Broadcasts</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">⏱️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">EventBridge</div>
            <div style="font-size: 6pt; color: #64748b;">Daily Cron Schedules</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">📊</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">CloudWatch</div>
            <div style="font-size: 6pt; color: #64748b;">Dashboard & Alarms</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🛡️</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">AWS IAM & Secrets</div>
            <div style="font-size: 6pt; color: #64748b;">Least-Privilege Roles</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px; text-align: center;">
            <div style="font-size: 11pt;">🌐</div>
            <div style="font-size: 7pt; font-weight: 800; color: #0b192c;">Amazon VPC</div>
            <div style="font-size: 6pt; color: #64748b;">Subnets & Endpoints</div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="sub-title">27.1 Conclusion</h2>
        <p style="font-size: 7.6pt;">
          The <strong>CloudCampus</strong> project demonstrates the engineering, deployment, integration, and verification of an enterprise campus management system on <strong>Amazon Web Services (AWS)</strong>. By leveraging Cognito for identity, API Gateway and ALB for ingress, EC2 and PM2 for compute, RDS PostgreSQL for relational persistence, S3 for storage, Lambda and EventBridge for serverless automation, and CloudWatch for monitoring, the system provides a robust, observable, and role-segregated cloud computing platform.
        </p>

        <h2 class="sub-title" style="margin-top: 3px;">27.2 References & Documentation</h2>
        <ol style="padding-left: 14px; font-size: 6.6pt; line-height: 1.3; color: #475569;">
          <li>Amazon Web Services, <em>AWS Well-Architected Framework: Reliability and Security Pillars</em>, AWS Whitepapers, 2024.</li>
          <li>Amazon Cognito Documentation, <em>Using Tokens with User Pools and OIDC Identity Providers</em>, AWS Documentation, 2026.</li>
          <li>PostgreSQL Global Development Group, <em>PostgreSQL 17.5 Documentation: Relational Integrity & Transactions</em>, 2026.</li>
          <li>Prisma Inc., <em>Prisma Client & Schema Reference for PostgreSQL Architectures</em>, 2026.</li>
          <li>Amazon Web Services, <em>Serverless Applications with AWS Lambda, EventBridge, and Amazon SNS</em>, AWS Architecture Center, 2026.</li>
        </ol>
      </div>

      <div style="margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 5px; text-align: center;">
        <div style="font-size: 7.8pt; font-weight: 800; color: #0b192c;">INDIAN INSTITUTE OF INFORMATION TECHNOLOGY DESIGN AND MANUFACTURING KURNOOL</div>
        <div style="font-size: 6.8pt; color: #64748b; margin-top: 1px;">Department of Computer Science and Engineering &bull; Cloud Computing Project Evaluation 2026–2027</div>
      </div>
    </div>
    <div class="page-footer">
      <div>IIITDM Kurnool &bull; Dept of Computer Science & Engineering</div>
      <div>Capabilities & Conclusion &bull; Page 28 of 28</div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(reportDir, 'index.html'), htmlContent);
console.log('✓ report/index.html updated.');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.join(reportDir, 'index.html');
const pdfPath = path.join(reportDir, 'CloudCampus_AWS_Cloud_Computing_Report.pdf');
const mainPdfPath = path.join(reportDir, 'main.pdf');

console.log('Compiling 28-page PDF using Headless Chrome...');
const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\\\/g, '/')}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✓ PDF compiled successfully: ${pdfPath}`);
  fs.copyFileSync(pdfPath, mainPdfPath);
  console.log(`✓ Copied to: ${mainPdfPath}`);
} catch (err) {
  console.error('Error compiling PDF with Chrome:', err);
}
