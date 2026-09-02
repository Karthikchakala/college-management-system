# CloudCampus — AWS Cloud Deployment Report

**Institution:** Indian Institute of Information Technology, Design and Manufacturing Kurnool (IIITDM Kurnool)  
**Department:** Department of Computer Science and Engineering  
**Course:** Cloud Computing (Academic Year 2026–2027)  
**Submitted By:**  
- **Chakala Karthik** (Roll No: `123CS0038`)  
- **Shaik Venkat** (Roll No: `123CS0037`)  
**Project Guide / Course Instructor:** Dr. Anil Kumar (Assistant Professor, Dept. of CSE)

---

## Deliverables in this Directory

- **`CloudCampus_AWS_Cloud_Computing_Report.pdf`**: The official compiled 28-page publication-grade PDF report.
- **`main.pdf`**: Mirror copy of the official PDF.
- **`index.html`**: Clean, self-contained HTML source matching all 28 A4 pages with embedded base64 assets.
- **`main.tex` & `sections/`**: Modular LaTeX source files.
- **`assets/`**: Official IIITDM Kurnool logo and categorized high-resolution verification screenshots.

---

## How to Regenerate the Report PDF

You can regenerate the 28-page report PDF at any time using Headless Chrome or Edge:

```powershell
node ../backend/scripts/generate-report.js
```

Or directly via Chrome CLI:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="CloudCampus_AWS_Cloud_Computing_Report.pdf" "file:///$PWD/index.html"
```

---

## 28-Page Report Chapter Outline

| Page # | Section & Chapter Title |
| :---: | :--- |
| **1** | Title & Cover Page (Official IIITDM Kurnool Logo & Metadata) |
| **2** | Executive Summary & Project Abstract |
| **3** | Table of Contents & Navigation Index |
| **4** | Project Objectives & Complete 14-AWS Service Inventory Table |
| **5** | AWS Service Categorization & "What Each Service Does" Summary Grid |
| **6** | Complete System Cloud Architecture (Full-Page Vector Diagram) |
| **7** | Amazon VPC Network Boundary & Subnet Topology Architecture Diagram |
| **8** | Deployed AWS Cloud Infrastructure Inventory (Live Resource Manifest) |
| **9** | User Identity, Authentication & Role-Based Access Control (AWS Cognito) |
| **10** | API Ingress Layer: AWS API Gateway & Application Load Balancer |
| **11** | Backend Application Compute: AWS EC2 Cluster & PM2 Runtime |
| **12** | Relational Persistence: Amazon RDS for PostgreSQL Managed Database |
| **13** | Object Storage Architecture: Amazon S3 File Storage & Presigned URLs |
| **14** | Profile Management & Real-Time Avatar S3 Pipeline (Flow & UI) |
| **15** | Student Portal Implementation & Verified Features |
| **16** | Faculty Portal Implementation & Teaching Workflows |
| **17** | Administrator Governance Portal & System Controls |
| **18** | Workflow A: Event-Driven Serverless Notifications (AWS Lambda & Amazon SNS) |
| **19** | Workflow B: Automated Assignment Reminders (Amazon EventBridge & Lambda) |
| **20** | Admin Immutable Audit Trails & Activity Logging |
| **21** | Role-Based API Security & RBAC Permission Matrix |
| **22** | AWS IAM Security & AWS Secrets Manager Runtime Credential Injection |
| **23** | CloudWatch Monitoring Dashboard & Metric Alarms (12 Telemetry Widgets) |
| **24** | Three-Layer End-to-End System Verification (Browser &rarr; API &rarr; RDS/S3) |
| **25** | Comprehensive Functional Testing & Test Results Matrix |
| **26** | Cloud vs. Local Architecture Comparison & Scalability |
| **27** | AWS Resource Cost Considerations & "Why This Architecture?" Justification |
| **28** | CloudCampus Demonstrated Capabilities Grid, Conclusion & Academic References |
