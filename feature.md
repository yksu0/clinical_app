# Features - Clinical Case Management System

## Overview

A web-based system designed for nursing Clinical Instructors (CI) to manage, assign, and track student clinical case exposure. The platform evolves beyond simple record-keeping into a **decision-support system** that ensures balanced learning experiences for all students.

---

# Core Roles

## 1. Admin (Primary Instructor)

* Full system control
* Assign cases to students
* Log and verify completed cases
* Manage system configurations
* Post announcements

## 2. CI (Clinical Instructor - Read Only)

* View student data and case logs
* Monitor progress and exposure

## 3. Student

* Upload case proof (scanned forms)
* View personal case history
* Track progress and statistics
* View announcements

---

# Core Features

## 1. Authentication & Role Management

* Secure login/signup
* Role-based access control (Admin, CI, Student)
* Data isolation (students only see their own data)

---

## 2. Student Upload System

* Upload scanned images of case forms
* File storage integration
* Upload history tracking
* Status tracking:

  * Pending
  * Processed
  * Rejected

---

## 3. Case Logging System (Admin)

* Select student
* View uploaded proofs (sorted by date)
* Log case details:

  * Case type
  * Location
  * Date
  * Notes
* Mark uploads as processed
* Separate raw uploads from confirmed case records

---

## 4. Assignment System (Core Feature)

### Purpose

Ensure balanced student exposure across case types and locations.

### Features

* Assign cases to students
* Define:

  * Case type
  * Location
  * Schedule/date
* Track assignment status:

  * Assigned
  * Completed
  * Missed

---

## 5. Smart Assignment Assistance

### Recommended Students System

When assigning a case, the system suggests students based on:

* Missing required case types
* Low exposure to a specific case
* Avoidance of repeated locations

### Priority Levels

* High Priority: No exposure to selected case
* Medium Priority: Below requirement
* Low Priority: Requirement already completed

---

## 6. Requirements System

### Purpose

Define minimum required exposure per case type.

### Features

* Admin-defined requirements (e.g., Surgery: 3, ER: 2)
* Per-student progress tracking
* Completion indicators

---

## 7. Student Insight Panel (Admin View)

### Displays

* Total cases
* Cases per type
* Cases per location

### Imbalance Detection

* Missing case types
* Overexposure to certain cases
* Repeated location assignments

### Progress Tracking

* Requirement completion status

---

## 8. Smart Filtering System

### Filters

* Students missing specific case types
* Students below requirements
* Students with repeated exposure
* Students with low activity
* Students with pending uploads

---

## 9. Dashboard System

### Admin Dashboard

* Students falling behind
* Exposure imbalance alerts
* Case distribution overview
* Location distribution overview

### CI Dashboard

* Read-only overview of student progress

### Student Dashboard

* Personal progress
* Case statistics
* Requirement completion

---

## 10. Announcement System

* Admin posts announcements
* Visible to all users
* Acts as a mini social feed

---

## 11. File Management System

* Organized storage structure
* Efficient retrieval of uploads
* Link uploads to student profiles

---

## 12. Notification System (Optional Enhancement)

* Notify admin of new uploads
* Notify students of announcements
* Notify students of assignments

---

## 13. Data Integrity & Safety

* Clear separation of:

  * Uploaded data
  * Verified case records
* Status tracking for all processes
* Prevention of duplicate or inconsistent logs

---

## 14. Settings & Configuration

### Admin Configurable Data

* Case types
* Locations
* Requirement thresholds

---

## 15. Future Enhancements

### AI-Assisted Logging (Deferred)

* Scan uploaded images
* Extract case data automatically

### Exposure Scoring System

* Calculate student priority for assignment
* Based on:

  * Missing requirements
  * Imbalance
  * Repetition

### Advanced Analytics

* Trends over time
* Performance insights

---

# System Philosophy

## From Storage → Decision Tool

The system is designed to:

* Track historical data
* Analyze student exposure
* Guide instructors in making better assignment decisions

## Key Principle

> Do not just display data — highlight what action should be taken next.

---

# Development Phases

## Phase 1 (MVP)

* Authentication
* Student uploads
* Case logging
* Basic dashboard

## Phase 2

* Assignment system
* Smart filtering
* Announcements
* CI access

## Phase 3

* Requirement tracking
* Smart recommendations
* Notifications

## Phase 4

* Advanced analytics
* AI-assisted features

---

# Final Goal

A complete **Clinical Training Management System** that ensures:

* Balanced student exposure
* Efficient instructor workflow
* Accurate and structured data tracking
* Actionable insights for decision-making

---

# Additional Considerations (Do Not Skip)

These are lightweight but high-impact features that improve reliability, usability, and long-term maintainability.

## 1. Audit Logs (Critical)

* Track admin actions:

  * Case logs
  * Assignments
  * Edits / deletions
* Fields:

  * action_type
  * performed_by
  * timestamp
* Purpose:

  * Accountability
  * Debugging

---

## 2. Bulk Operations (Admin Efficiency)

* Bulk import students (CSV)
* Bulk assign cases
* Bulk approve uploads

---

## 3. Search & Pagination

* Search students by name
* Paginated lists for scalability (300+ students)

---

## 4. Soft Delete System

* Use "archived" or "inactive" instead of deleting
* Prevent accidental data loss

---

## 5. File Handling Optimization

* Image compression on upload
* File size limits
* Supported formats (jpg, png, pdf)

---

## 6. Duplicate Prevention

* Prevent duplicate student accounts
* Prevent duplicate case logs

---

## 7. Time & Date Consistency

* Standard timezone handling
* Avoid scheduling/logging errors

---

## 8. Data Export Feature

* Export to CSV/Excel:

  * Case records
  * Progress reports

---

## 9. Basic Backup Strategy

* Regular database backups

---

## 10. Role-Based UI Restrictions

* Hide features based on role
* Prevent misuse and confusion

---

## 11. Performance Safeguards

* Lazy loading (especially images)
* Limit records per request

---

## 12. Empty State UX

* Clear messages when no data exists

---

## 13. Error Handling

* Clear feedback for failures
* Prevent silent errors

---

## 14. Mobile Responsiveness (Optional)

* Ensure student upload flow works on mobile

---

## 15. Future-Proofing

* Modular system design
* Easy to extend (AI, analytics)
