# Clinical Case Management System

## Role-Based Workflows

This document outlines the **step-by-step operational flow** for each role in the system. It is designed to reflect real-world usage, ensuring the platform supports efficient, accurate, and secure workflows.

---

# 1. Admin Workflow (Primary Instructor)

## Phase 0: Initial System Setup

### 1. Student Roster Initialization

* Admin manually inputs all students into the system
* Required fields:

  * Full name
  * Email (optional at this stage)
  * Section / group (if applicable)
* Purpose:

  * Establish a **trusted whitelist** of valid students
  * Prevent unauthorized registrations

---

### 2. Student Verification System

* When a student signs up:

  * Their name must match an existing record in the system
* Admin verifies or approves account activation
* Prevents:

  * Fake accounts
  * Duplicate entries

---

### 3. System Configuration (Critical Step)

Admin defines all structured data before operations begin:

#### Case Types Setup

* Add all case categories (e.g., Surgery, Delivery, ER)

#### Locations Setup

* Add all hospital/clinic locations (e.g., Ward A, OR, ER)

#### Requirement Definitions

* Set required number of cases per type

  * Example:

    * Surgery: 3
    * Delivery: 5
    * ER: 2

---

## Phase 1: Assignment Workflow

### 1. Open Assignment Page

* Admin selects:

  * Case type
  * Location
  * Schedule/date

---

### 2. Review Recommended Students

* System displays prioritized list:

  * High priority: no exposure
  * Medium: below requirement
  * Low: requirement completed

---

### 3. Inspect Student Details (Optional)

* View student insight panel:

  * Case counts
  * Missing requirements
  * Exposure imbalance warnings

---

### 4. Assign Case

* Select student
* Confirm assignment
* Assignment is recorded with status = "Assigned"

---

## Phase 2: Execution & Upload Tracking

### 1. Student Completes Case

* Student performs assigned task in real-world setting

---

### 2. Student Uploads Proof

* Upload scanned case form
* Status automatically set to "Pending"

---

### 3. Monitor Upload Activity

* Admin views incoming uploads
* Filters:

  * Pending uploads
  * Recent uploads

---

## Phase 3: Case Logging Workflow

### 1. Open Case Logging Page

* Admin selects a student

---

### 2. Review Uploaded Proofs

* View all uploads sorted by date
* Identify unprocessed entries

---

### 3. Log Case Details

* Select from dropdowns:

  * Case type
  * Location
* Input:

  * Date
  * Notes (optional)

---

### 4. Confirm & Save

* System creates official case record
* Upload status updated to "Processed"

---

## Phase 4: Monitoring & Decision-Making

### 1. Use Dashboard

* Identify:

  * Students falling behind
  * Imbalance in exposure

---

### 2. Apply Smart Filters

* Filter students by:

  * Missing case types
  * Low total cases
  * Repeated locations

---

### 3. Adjust Assignments Accordingly

* Use insights to guide future assignments

---

## Phase 5: Communication

### 1. Post Announcements

* Admin creates announcements
* Visible to all users

---

### 2. Monitor Engagement (Optional)

* Track if students are active

---

# 2. Student Workflow

## Phase 1: Registration

### 1. Sign Up

* Student creates account
* Must match pre-registered name

---

### 2. Account Verification

* Wait for admin approval (if enabled)

---

## Phase 2: Assignment Awareness

### 1. View Assigned Cases

* See upcoming assignments
* View:

  * Case type
  * Location
  * Date

---

## Phase 3: Case Completion

### 1. Perform Assigned Case

* Complete real-world clinical activity

---

### 2. Upload Proof

* Upload scanned form/image
* Status = "Pending"

---

## Phase 4: Progress Tracking

### 1. View Case History

* See all logged cases

---

### 2. View Progress Dashboard

* Track:

  * Completed vs required cases
  * Personal statistics

---

### 3. Monitor Upload Status

* Pending
* Processed
* Rejected

---

## Phase 5: Communication

### 1. View Announcements

* Stay updated with instructor posts

---

# 3. CI Workflow (Read-Only Instructor)

## Phase 1: Access System

* Login with CI role

---

## Phase 2: Monitor Students

### 1. View Student Profiles

* Access individual student data

---

### 2. Review Case Logs

* See verified cases
* No editing permissions

---

### 3. View Dashboards

* Overview of:

  * Student progress
  * Case distribution

---

## Phase 3: Oversight Role

* Identify trends or issues
* Provide feedback externally (outside system)

---

# System Flow Summary

## Full Lifecycle

1. Admin sets up system
2. Students register and get verified
3. Admin assigns cases
4. Students complete and upload proof
5. Admin logs and verifies cases
6. System analyzes data
7. Admin makes better assignment decisions

---

# Key Principle

> Every workflow should reduce manual effort and improve decision accuracy.

The system is designed to ensure that each step naturally feeds into the next, creating a continuous cycle of:

**Assignment → Execution → Verification → Analysis → Improved Assignment**

---

# Additional Considerations (Do Not Skip)

These are lightweight but high-impact features and safeguards that significantly improve reliability, usability, and maintainability.

## 1. Audit Logs (Critical)

* Track all admin actions:

  * Case logs
  * Assignments
  * Edits / deletions
* Fields:

  * action_type
  * performed_by
  * timestamp
* Purpose:

  * Accountability
  * Debugging mistakes

---

## 2. Bulk Operations (Admin Efficiency)

* Bulk import students (CSV upload)
* Bulk assign cases
* Bulk approve uploads

---

## 3. Search & Pagination

* Search students by name
* Paginate long lists (300+ students)
* Prevent slow UI and clutter

---

## 4. Soft Delete System

* Instead of deleting records:

  * Mark as "archived" or "inactive"
* Prevents accidental data loss

---

## 5. File Handling Optimization

* Automatic image compression on upload
* File size limits
* Accepted formats (jpg, png, pdf)
* Prevent storage bloat and slow loading

---

## 6. Duplicate Prevention

* Prevent duplicate:

  * Student accounts
  * Case logs (same date + type + student)

---

## 7. Time & Date Consistency

* Standardize timezone handling
* Avoid incorrect scheduling/logging

---

## 8. Data Export Feature

* Export data to CSV/Excel:

  * Student case records
  * Progress reports
* Useful for reporting outside the system

---

## 9. Basic Backup Strategy

* Regular database backups
* Prevent catastrophic data loss

---

## 10. Role-Based UI Restrictions

* Hide UI elements based on role
* Prevent confusion and misuse

---

## 11. Performance Safeguards

* Lazy loading for images
* Limit number of records loaded at once

---

## 12. Empty State UX

* Show helpful messages when no data exists

  * "No uploads yet"
  * "No assignments available"

---

## 13. Error Handling

* Clear user feedback:

  * Upload failed
  * Invalid input
* Prevent silent failures

---

## 14. Mobile Responsiveness (Optional but Valuable)

* Students may upload via phone
* Ensure upload page works well on mobile

---

## 15. Future-Proofing

* Keep system modular:

  * Easy to add AI later
  * Easy to expand analytics

---

# Final Reminder

Small features like these often determine whether a system feels:

* Fragile
* or Professional

They are easy to overlook early, but expensive to add later—so accounting for them now is the right move.

---

# Additional Considerations (Do Not Skip)

These are lightweight but high-impact features that improve system reliability, usability, and long-term maintainability.

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
