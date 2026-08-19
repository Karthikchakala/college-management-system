# REST API Documentation

This document describes all REST API routes implemented in the College Campus Management System.

## General API Specifications

* **Base URL**: `http://localhost:5000`
* **Content-Type**: `application/json`
* **Response Format**: A standardized wrapper structure.

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Description of the error",
  "code": "ERROR_CODE_IDENTIFIER"
}
```

---

## Authentication Endpoints

### 1. User Login
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "student@campus.local",
  "password": "password123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "user-uuid",
      "profileId": "student-uuid",
      "email": "student@campus.local",
      "role": "STUDENT",
      "name": "Karthik Chakala"
    }
  }
}
```

### 2. Get Profile
* **Method**: `GET`
* **Path**: `/api/auth/profile`
* **Access**: Private (Bearer JWT Token)
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "student@campus.local",
      "role": "STUDENT",
      "student": {
        "id": "student-uuid",
        "firstName": "Karthik",
        "lastName": "Chakala",
        "enrollmentNumber": "STU001",
        "department": {
          "id": "dept-uuid",
          "name": "Computer Science & Engineering"
        }
      }
    }
  }
}
```

---

## Student Role Endpoints (Guarded: `STUDENT` Role)

### 1. Get Student Dashboard
* **Method**: `GET`
* **Path**: `/api/student/dashboard`
* **Headers**: `Authorization: Bearer <student-token>`
* **Success Response (200 OK)**: Returns profile specs, attendance percentage, pending assignment arrays, upcoming exams, registered events, and recent notices.

### 2. Submit Assignment
* **Method**: `POST`
* **Path**: `/api/student/submit`
* **Headers**: `Authorization: Bearer <student-token>`
* **Content-Type**: `multipart/form-data`
* **Form Fields**:
  * `assignmentId`: (UUID String)
  * `file`: (Binary document, allowed types: `.pdf, .docx, .png, .jpg, .jpeg`)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": {
    "id": "submission-uuid",
    "assignmentId": "assign-uuid",
    "studentId": "student-uuid",
    "fileUrl": "http://localhost:5000/uploads/filename.pdf",
    "fileName": "algebra_homework.pdf",
    "status": "SUBMITTED"
  }
}
```

---

## Faculty Role Endpoints (Guarded: `FACULTY` Role)

### 1. Record Course Attendance
* **Method**: `POST`
* **Path**: `/api/faculty/attendance`
* **Headers**: `Authorization: Bearer <faculty-token>`
* **Request Body**:
```json
{
  "courseId": "course-uuid",
  "date": "2026-08-17",
  "records": [
    {
      "studentId": "student-uuid-1",
      "status": "PRESENT"
    },
    {
      "studentId": "student-uuid-2",
      "status": "ABSENT",
      "remarks": "Sick leave"
    }
  ]
}
```
* **Success Response (200 OK)**: Enters or updates attendance records using Upsert.

### 2. Grade Student Assignment
* **Method**: `POST`
* **Path**: `/api/faculty/submissions/grade`
* **Headers**: `Authorization: Bearer <faculty-token>`
* **Request Body**:
```json
{
  "submissionId": "submission-uuid",
  "grade": "A+",
  "feedback": "Perfect compilation and code quality."
}
```
* **Success Response (200 OK)**: Saves grade and sends notification to the student.

---

## Admin Role Endpoints (Guarded: `ADMIN` Role)

### 1. Get Dashboard Statistics
* **Method**: `GET`
* **Path**: `/api/admin/dashboard-stats`
* **Success Response (200 OK)**: Returns counts of total active students, faculty members, departments, upcoming events, and recent audit logs.

### 2. Export Data Report (CSV)
* **Method**: `GET`
* **Path**: `/api/admin/reports/export/:type`
* **Parameters**: `type` can be `students`, `faculty`, `courses`, `attendance`, `results`.
* **Success Response (200 OK)**: Returns CSV document download with appropriate HTTP headers.
