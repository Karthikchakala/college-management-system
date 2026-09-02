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

- **`CloudCampus_AWS_Cloud_Computing_Report.pdf`**: The official compiled 26-page publication-grade PDF report.
- **`main.pdf`**: Mirror copy of the official PDF.
- **`index.html`**: Clean, self-contained HTML source matching all 26 A4 pages with embedded base64 assets.
- **`main.tex` & `sections/`**: Modular LaTeX source files.
- **`assets/`**: Official IIITDM Kurnool logo and categorized high-resolution verification screenshots.

---

## How to Regenerate the Report PDF

You can regenerate the 26-page report PDF at any time using Headless Chrome or Edge:

```powershell
node ../backend/scripts/generate-report.js
```

Or directly via Chrome CLI:

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="CloudCampus_AWS_Cloud_Computing_Report.pdf" "file:///$PWD/index.html"
```

---

## 26-Page Report Chapter Outline

| Page # | Section & Chapter Title |
| :---: | :--- |
| **1** | Title & Cover Page (Official IIITDM Kurnool Logo & Metadata) |
| **2** | Executive Summary & Project Abstract |
| **3** | Table of Contents & Navigation Index |
| **4** | Project Objectives & AWS Service-to-Feature Mapping Table |
| **5** | Complete System Cloud Architecture (Full-Page Vector Diagram) |
| **6** | Deployed AWS Cloud Infrastructure Inventory |
| **7** | User Authentication & Role-Based Access Control (AWS Cognito) |
| **8** | API Ingress Layer: AWS API Gateway & Application Load Balancer |
| **9** | Backend Application Compute: AWS EC2 Cluster & PM2 Runtime |
| **10** | Relational Persistence: AWS RDS PostgreSQL Managed Database |
| **11** | Object Storage Architecture: Amazon S3 File Storage |
| **12** | Profile Management & Real-Time Avatar S3 Pipeline |
| **13** | Student Portal Implementation & Verified Features |
| **14** | Faculty Portal Implementation & Teaching Workflows |
| **15** | Administrator Governance Portal & System Controls |
| **16** | Event-Driven Serverless Notifications: AWS Lambda & Amazon SNS |
| **17** | Automated Assignment Reminders: Amazon EventBridge & Lambda |
| **18** | Admin Immutable Audit Trails & Activity Logging |
| **19** | Role-Based API Security & RBAC Permission Matrix |
| **20** | CloudWatch Monitoring Dashboard & Metric Alarms |
| **21** | Three-Layer End-to-End System Verification (Browser &rarr; API &rarr; RDS/S3) |
| **22** | Comprehensive Functional Testing & Test Results Matrix |
| **23** | Cloud vs. Local Architecture Comparison & Scalability |
| **24** | AWS Resource Cost Considerations & "Why This Architecture?" |
| **25** | CloudCampus Demonstrated Capabilities (Visual 9-Service Grid) |
| **26** | Conclusion, Future Scope & Academic References |
