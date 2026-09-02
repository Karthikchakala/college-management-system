# CloudFront Deployment & Cognito Production SSO Status Report

**Target File**: `CLOUDFRONT_COGNITO_PRODUCTION_FIX_REPORT.md`  
**Application**: CloudCampus (College Campus Management System)  
**Execution Target**: Amazon CloudFront HTTPS Distribution in front of `cloudcampus-frontend-production`  
**AWS Account ID**: `511225358997`  
**AWS Region**: `us-east-1`  
**Status**: **BLOCKED BY AWS ACCOUNT-LEVEL RESTRICTION**  
**Audit Date**: September 2, 2026  

---

## 1. Executive Summary

As approved, deployment of an **Amazon CloudFront Distribution** in front of the S3 static frontend bucket (`cloudcampus-frontend-production`) was initiated using the existing Origin Access Control (`CloudCampus-Frontend-OAC`, ID: `E1CYD36SO7P5RD`) to provide a valid AWS HTTPS domain for Amazon Cognito OAuth 2.0 PKCE redirect compliance.

During the execution of `CreateDistributionCommand` via the AWS CloudFront API, AWS rejected the request due to an account-level restriction requiring manual verification from AWS Support.

In accordance with the safety directive (**"If CloudFront creation is blocked again by an AWS account-level restriction: STOP. Do not modify Cognito or frontend configuration. Report the exact AWS error and stop."**), execution was immediately halted with **zero modifications made to Cognito, S3 buckets, RDS, EC2, or API Gateway**.

---

## 2. Exact AWS CloudFront API Error

```
================================================================
[CloudFront Setup] Initiating CloudFront Distribution Deployment
================================================================
Target S3 Bucket: cloudcampus-frontend-production
Origin Access Control (OAC): E1CYD36SO7P5RD

[Step 1] Sending CreateDistributionCommand to CloudFront...
❌ CloudFront Creation Failed:
  Error Code: AccessDenied
  HTTP Status: 403 Forbidden
  Message: "Your account must be verified before you can add new CloudFront resources. To verify your account, please contact AWS Support (https://console.aws.amazon.com/support/home#/) and include this error message."
```

---

## 3. Root Cause Analysis

1. **AWS Account-Level Restriction**:
   New or unverified AWS accounts have a default safety restriction preventing the automated creation of new Amazon CloudFront distributions until the account owner opens an AWS Support ticket or completes identity/billing verification for CloudFront CDN resources.
2. **Cognito HTTPS Policy**:
   Amazon Cognito Managed Login strictly enforces the OAuth 2.0 specification (RFC 6749 §3.1.2), requiring all non-localhost redirect URIs to use the `https://` scheme. 
3. **Current Infrastructure Status**:
   - The S3 frontend is fully deployed and accessible over HTTP at:  
     `http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com`
   - Because Amazon S3 Static Website Hosting endpoints do not natively support HTTPS on `*.s3-website-us-east-1.amazonaws.com`, CloudFront is the required AWS service to attach an AWS-managed SSL certificate.

---

## 4. Current Configuration & Resource Verification

| Resource | Identifier / Value | Current Status |
| :--- | :--- | :---: |
| **S3 Frontend Bucket** | `cloudcampus-frontend-production` | **Active** (Static hosting enabled, production bundle deployed) |
| **S3 Data Bucket** | `cloudcampus-511225358997` | **Preserved & Untouched** |
| **Origin Access Control (OAC)** | `CloudCampus-Frontend-OAC` (`E1CYD36SO7P5RD`) | **Active & Ready** |
| **Cognito User Pool** | `us-east-1_Ic9huqJjL` | **Active** (11 confirmed users across Student, Faculty, Admin) |
| **Cognito App Client** | `3kv2vgpkklqtlpfom2t72dn29n` | **Active** (`CallbackURLs: ['http://localhost:3000']`) |
| **API Gateway HTTP API v2** | `7k2yo6gy77` | **Active** (`/prod`) |
| **RDS PostgreSQL Database** | `cloudcampus-db` (`campusadmin`) | **Active & Untouched** |
| **Backend Compute** | Amazon EC2 (`i-03681025582d882c5`) behind ALB | **Active & Untouched** |

---

## 5. What Was NOT Modified (Safety Compliance)

- **NO** changes were applied to Amazon Cognito User Pool `us-east-1_Ic9huqJjL` or App Client `3kv2vgpkklqtlpfom2t72dn29n`.
- **NO** changes were made to the private application data bucket `cloudcampus-511225358997`.
- **NO** changes were made to Amazon RDS PostgreSQL (`cloudcampus-db`).
- **NO** frontend code or environment variables were modified.
- **NO** API Gateway routes or VPC configurations were modified.

---

## 6. Options to Resolve

### Path 1: AWS Support Verification (Recommended for Production CDN)
Open an AWS Support ticket in the AWS Console (Case Type: *Account and billing support* or *Service Limit Increase / CloudFront Verification*) with the message:
> *"Please verify my AWS Account (511225358997) to enable creation of Amazon CloudFront distributions for our college campus management system project."*

Once AWS Support lifts the restriction, running `node scripts/create-cloudfront-distribution.js` will immediately create the CloudFront distribution and allow registering `https://<id>.cloudfront.net` in Cognito.

### Path 2: Localhost Development / Demonstration Verification
For immediate demonstration and grading/academic evaluation:
- Local frontend development server (`http://localhost:3000`) is already registered in Cognito App Client `3kv2vgpkklqtlpfom2t72dn29n`.
- Running the frontend locally connects to AWS Cognito Managed Login, exchanges tokens over OAuth 2.0 PKCE, and communicates seamlessly with the live AWS API Gateway, ALB, EC2 backend, and Amazon RDS PostgreSQL database.
