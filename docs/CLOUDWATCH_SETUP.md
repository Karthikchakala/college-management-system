# AWS CloudWatch Observability & Telemetry Setup Guide

This document details the configuration, deployment, and operational architecture of Amazon CloudWatch observability for the CloudCampus College Management System.

---

## 1. Observability Architecture

```
                                  Amazon CloudWatch
                      ┌───────────────────┴───────────────────┐
                      ▼                                       ▼
            CloudWatch Metrics & Alarms             CloudWatch Logs Groups
                      ▲                                       ▲
                      │                                       │
        ┌─────────────┼─────────────────────────┐             │
        │             │                         │             │
        ▼             ▼                         ▼             │
    Amazon EC2   API Gateway                 Lambda           │
  (Node/PM2/CWA)  (7k2yo6gy77)         (Health Function)      │
        │             │                         │             │
        │             └─────────────────────────┼─────────────┘
        ▼                                       ▼
  Amazon RDS PostgreSQL                  /cloudcampus/backend
  (cloudcampus-db metrics)               /cloudcampus/security
```

---

## 2. CloudWatch Agent Setup on EC2

To collect OS-level memory and disk metrics beyond standard EC2 hypervisor metrics, the unified Amazon CloudWatch Agent (`amazon-cloudwatch-agent`) is configured.

### Configuration File (`/opt/aws/amazon-cloudwatch-agent/bin/config.json`)
```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "metrics_collected": {
      "mem": {
        "measurement": [
          "mem_used_percent",
          "mem_used",
          "mem_total"
        ]
      },
      "disk": {
        "measurement": [
          "disk_used_percent",
          "disk_free",
          "disk_used"
        ],
        "resources": [
          "/"
        ]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ec2-user/.pm2/logs/*-out.log",
            "log_group_name": "/cloudcampus/backend",
            "log_stream_name": "{instance_id}/pm2-app"
          },
          {
            "file_path": "/home/ec2-user/.pm2/logs/*-error.log",
            "log_group_name": "/cloudcampus/backend",
            "log_stream_name": "{instance_id}/pm2-error"
          }
        ]
      }
    }
  }
}
```

---

## 3. IAM Permissions & Instance Profile

The EC2 instance authenticates via an attached IAM Role using least privilege. No static access keys are embedded.

### Attached IAM Policy (`CloudCampus-CloudWatch-Policy`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchMetricsAndAlarms",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups",
        "logs:FilterLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:511225358997:log-group:/cloudcampus/*",
        "arn:aws:logs:us-east-1:511225358997:log-group:/aws/lambda/*"
      ]
    }
  ]
}
```

---

## 4. Log Groups & Retention

| Log Group Name | Purpose | Retention |
|---|---|---|
| `/cloudcampus/backend` | Node.js Express structured request logs and PM2 stdout | 30 Days |
| `/cloudcampus/security` | 401/403 security anomalies, authorization rejections | 90 Days |
| `/aws/lambda/CloudCampus-Health-Function` | Lambda health execution logs | 14 Days |

---

## 5. Metrics Collected

### Standard AWS Metrics
- **EC2 (`AWS/EC2`)**: `CPUUtilization`, `NetworkIn`, `NetworkOut`, `StatusCheckFailed`
- **API Gateway (`AWS/ApiGateway`)**: `Count`, `4XXError`, `5XXError`, `Latency`, `IntegrationLatency`
- **Lambda (`AWS/Lambda`)**: `Invocations`, `Errors`, `Duration`, `Throttles`
- **RDS (`AWS/RDS`)**: `CPUUtilization`, `DatabaseConnections`, `FreeStorageSpace`, `ReadIOPS`, `WriteIOPS`

### Custom Application Metrics (`CloudCampus/Application`)
- `APIRequests`: Total processed requests (Dimensions: `Endpoint`, `Method`)
- `APIErrors`: Total 4XX/5XX responses
- `AuthenticationFailures`: Failed authentication attempts
- `S3UploadSuccess`: Upload event counters

---

## 6. CloudWatch Alarms

| Alarm Name | Metric | Threshold | Evaluation | Action |
|---|---|---|---|---|
| `CloudCampus-EC2-HighCPU` | `CPUUtilization` | $> 80\%$ for 5 min | 1 datapoint | Status: OK |
| `CloudCampus-EC2-HighMemory` | `mem_used_percent` | $> 80\%$ for 5 min | 1 datapoint | Status: OK |
| `CloudCampus-EC2-HighDisk` | `disk_used_percent` | $> 80\%$ for 5 min | 1 datapoint | Status: OK |
| `CloudCampus-APIGW-5XXErrors` | `5XXError` | $\ge 5$ in 5 min | 1 datapoint | Status: OK |
| `CloudCampus-Lambda-Errors` | `Errors` | $\ge 1$ in 5 min | 1 datapoint | Status: OK |
| `CloudCampus-RDS-HighCPU` | `CPUUtilization` | $> 80\%$ for 5 min | 1 datapoint | Status: OK |

---

## 7. Admin Monitoring API Endpoints

All endpoints require `Authorization: Bearer <ADMIN_JWT>` and enforce `authorize(['ADMIN'])`:

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/admin/monitoring/overview` | `GET` | `ADMIN` | Aggregated system health, quick counters, and alarm summary |
| `/api/admin/monitoring/ec2` | `GET` | `ADMIN` | Detailed CPU, memory, disk, and network metrics |
| `/api/admin/monitoring/api-gateway` | `GET` | `ADMIN` | API Gateway request count, 4XX/5XX error rates, latency |
| `/api/admin/monitoring/lambda` | `GET` | `ADMIN` | Lambda health function invocations, error counts, execution duration |
| `/api/admin/monitoring/rds` | `GET` | `ADMIN` | RDS PostgreSQL database connections, CPU, and storage |
| `/api/admin/monitoring/alarms` | `GET` | `ADMIN` | Status and roster of all CloudWatch alarms |
| `/api/admin/monitoring/logs` | `GET` | `ADMIN` | Filtered application log stream from `/cloudcampus/backend` |

---

## 8. Security Model & Data Sanitization

1. **Role Enforcement**: Student and Faculty roles receive `403 Forbidden` if attempting to query monitoring APIs.
2. **Credential Sanitization**: The API responses never contain AWS credentials, database passwords, or JWT secrets.
3. **Graceful Fallbacks**: If CloudWatch API encounters network throttling, the controller returns a cached status rather than failing or crashing.

---

## 9. Troubleshooting & Diagnostics

- **Missing CloudWatch Metrics**: Verify that the EC2 IAM role includes `cloudwatch:PutMetricData`.
- **Log Stream Empty**: Verify PM2 is running and log files exist in `/home/ec2-user/.pm2/logs/`.
- **CWAgent Status**: Run `sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -m ec2 -a status`.

---

## 10. Cost Considerations

- Standard CloudWatch metrics for AWS resources are included in AWS Free Tier / standard pricing.
- Log Group retention is capped at 30 days to optimize storage cost.
- Metric queries use 5-minute sampling periods to minimize API request volume.
