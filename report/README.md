# CloudCampus — Academic Project Report (LaTeX Source & PDF)

**Course**: Cloud Computing  
**Institution**: Indian Institute of Information Technology Design and Manufacturing Kurnool (IIITDM Kurnool)  
**Course Instructor**: Dr. Anil Kumar  
**Project Authors**:
- Chakala Karthik (Roll No: `123CS0038`)
- Shaik Venkat (Roll No: `123CS0037`)

---

## 1. Directory Structure

```
report/
├── CloudCampus_AWS_Cloud_Computing_Report.pdf  # Compiled 20-page Academic Report
├── main.tex                                   # Main LaTeX entry point
├── references.bib                             # IEEE Bibliography database
├── README.md                                  # This documentation
├── assets/
│   ├── logo/
│   │   └── iiitdmk_logo.png                   # Official IIITDM Kurnool Logo
│   └── screenshots/
│       ├── aws/                               # AWS Infrastructure Screenshots
│       ├── browser/                           # Verified Browser Screenshots
│       └── terminal/                          # CLI and Terminal Evidence
└── sections/
    ├── page01_title.tex                       # Page 1: Official Title Page
    ├── page02_certificate.tex                 # Page 2: Certificate & Declaration
    ├── page03_abstract.tex                    # Page 3: Academic Abstract
    ├── page04_toc.tex                         # Page 4: Table of Contents & Lists
    ├── page05_introduction.tex                # Page 5: Chapter 1 - Introduction
    ├── page06_system_overview.tex             # Page 6: Chapter 2 - System Overview
    ├── page07_cloud_architecture.tex          # Page 7: Chapter 3 - Cloud Architecture
    ├── page08_aws_services.tex                # Page 8: Chapter 4 - AWS Services Used
    ├── page09_frontend_deployment.tex         # Page 9: Chapter 5 - Frontend S3 Deployment
    ├── page10_backend_deployment.tex          # Page 10: Chapter 6 - Backend EC2 Deployment
    ├── page11_database_rds.tex                # Page 11: Chapter 7 - Amazon RDS Database
    ├── page12_auth_cognito.tex                # Page 12: Chapter 8 - Amazon Cognito Auth
    ├── page13_s3_storage.tex                  # Page 13: Chapter 9 - S3 Storage Separation
    ├── page14_apigw_lambda.tex                # Page 14: Chapter 10 - API Gateway & Lambda
    ├── page15_cloudwatch_monitoring.tex       # Page 15: Chapter 11 - CloudWatch Telemetry
    ├── page16_security.tex                    # Page 16: Chapter 12 - Security Framework
    ├── page17_testing_verification.tex        # Page 17: Chapter 13 - Testing & Verification
    ├── page18_workflows.tex                   # Page 18: Chapter 14 - Application Workflows
    ├── page19_challenges_future.tex           # Page 19: Chapter 15 - Challenges & Roadmap
    └── page20_conclusion_references.tex       # Page 20: Chapter 16 - Conclusion & References
```

---

## 2. Compilation Instructions

The document is designed for modern LaTeX engines. To compile the PDF report:

### Method 1: Using Tectonic (Zero-Configuration Compiler)
```bash
./bin/tectonic report/main.tex --outdir report
```

### Method 2: Using standard pdfLaTeX / latexmk
```bash
cd report
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

---

## 3. Evidence-Based Verification Integrity

All architectural claims, service configurations, test metrics, and security parameters in this report are grounded strictly in the verified repository source code and live AWS infrastructure in `us-east-1`:
- **Frontend S3 Static Website**: `http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com`
- **Amazon API Gateway Endpoint**: `https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod`
- **Amazon Cognito Identity Pool**: `us-east-1_Ic9huqJjL` / App Client: `3kv2vgpkklqtlpfom2t72dn29n`
- **Amazon S3 Data Bucket**: `cloudcampus-511225358997` (100% Block Public Access)
- **CloudWatch Telemetry**: `/aws/ec2/cloudcampus-backend`
- **Automated Tests**: 166 passed out of 187 across 19 suites (Vitest 2.1.9)
