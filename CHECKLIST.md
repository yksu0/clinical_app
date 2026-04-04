# Clinical Case Management System — Development Checklist

> **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel  
> **Roles:** Admin (Primary Instructor) · CI (Read-Only Instructor) · Student

---

## Phase 0: Project Setup

- [x] Initialize Next.js project with TypeScript, Tailwind, ESLint, App Router
- [x] Install Supabase client SDK (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Install utility libraries (`lucide-react`, `date-fns`)
- [x] Create Supabase client helpers (browser, server, middleware)
- [x] Set up Next.js middleware for session refresh
- [x] Create `.env.local.example` with required env vars
- [x] Define TypeScript types for all entities
- [x] Create Supabase project & obtain keys
- [x] Add keys to `.env.local`
- [x] Verify dev server runs (`npm run dev`)

---

## Phase 1: Database Schema (Supabase)

- [x] Create `profiles` table (id, full_name, email, role, section, is_verified, is_active, timestamps)
- [x] Create `case_types` table (id, name, is_active, timestamps)
- [x] Create `locations` table (id, name, is_active, timestamps)
- [x] Create `requirements` table (id, case_type_id FK, required_count, timestamps)
- [x] Create `assignments` table (id, student_id FK, case_type_id FK, location_id FK, scheduled_date, status, assigned_by FK, timestamps)
- [x] Create `uploads` table (id, student_id FK, file_path, file_name, status, uploaded_at, processed_at)
- [x] Create `case_logs` table (id, student_id FK, case_type_id FK, location_id FK, upload_id FK nullable, date, notes, logged_by FK, timestamps)
- [x] Create `announcements` table (id, title, content, created_by FK, created_at)
- [x] Create `audit_logs` table (id, action_type, performed_by FK, target_table, target_id, details JSONB, created_at)
- [x] Set up Row-Level Security (RLS) policies per role
- [x] Create Supabase Storage bucket for uploads (max 10 MB, no file type restriction)
- [x] Add database indexes on foreign keys and frequently queried columns
- [x] Add unique constraints for duplicate prevention (e.g., student + date + case_type)

---

## Phase 2: Authentication & Role Management

- [x] Build signup page (`/signup`)
- [x] Build login page (`/login`)
- [x] Implement Supabase Auth (email/password)
- [x] On signup: match student name against pre-registered roster
- [x] Admin approval flow for new student accounts (`is_verified` flag) — UI in Phase 3
- [x] Create auth callback route (`/auth/callback`)
- [x] Implement role-based route protection in middleware
- [x] Redirect users to role-specific dashboards after login — done in Phase 3
- [x] Build logout functionality

---

## Phase 3: Admin — System Configuration

- [x] Case Types management page (CRUD, soft delete)
- [x] Locations management page (CRUD, soft delete)
- [x] Requirements management page (set required count per case type)
- [x] Student roster management page
  - [x] Manual add student (name, email, section)
  - [ ] Bulk import students via CSV
  - [x] Verify / approve student accounts
  - [x] Deactivate / archive students

---

## Phase 4: Student — Upload System

- [x] Upload page — file picker (jpg, png, pdf)
- [x] Client-side validation (file type, file size)
- [x] Image compression before upload
- [x] Upload to Supabase Storage
- [x] Create upload record with status = "pending"
- [x] Upload history list with status badges (pending / processed / rejected)
- [x] Empty state UX ("No uploads yet")

---

## Phase 5: Admin — Case Logging

- [x] Case logging page — select student
- [x] Display student's uploaded proofs (sorted by date)
- [x] Log case form: case type dropdown, location dropdown, date picker, notes
- [x] On save: create case_log record, update upload status to "processed"
- [x] Duplicate prevention (same student + date + case type)
- [x] Create audit log entry on case log creation
- [x] Bulk approve uploads

---

## Phase 6: Assignment System

- [x] Assignment creation page
  - [x] Select case type, location, date
  - [x] Display recommended students list (prioritized by exposure)
  - [x] Select student and confirm assignment
- [x] Smart recommendation engine
  - [x] High priority: no exposure to selected case type
  - [x] Medium priority: below requirement threshold
  - [x] Low priority: requirement already met
  - [ ] Factor in location repetition avoidance
- [x] Assignment tracking (assigned / completed / missed)
- [ ] Bulk assign cases
- [x] Create audit log entry on assignment

---

## Phase 7: Student — Views & Progress

- [x] Student dashboard — personal progress overview
  - [x] Completed vs. required cases per type
  - [x] Case statistics (by type, by location)
- [x] Assigned cases view (upcoming assignments with details)
- [x] Case history view (all logged cases)
- [x] Upload status tracker (pending / processed / rejected)
- [x] Requirement completion indicators

---

## Phase 8: Admin Dashboard & Smart Filtering

- [x] Admin dashboard
  - [x] Students falling behind alerts
  - [x] Exposure imbalance alerts
  - [x] Case distribution overview (by type)
  - [x] Location distribution overview
- [x] Smart filters
  - [x] Students missing specific case types
  - [x] Students below requirements
  - [ ] Students with repeated locations
  - [x] Students with low activity
  - [x] Students with pending uploads
- [x] Student insight panel
  - [x] Total cases, cases per type, cases per location
  - [x] Imbalance detection warnings
  - [x] Requirement completion status
- [x] Search students by name
- [x] Pagination (300+ students support)

---

## Phase 9: CI (Read-Only Instructor) Views

- [x] CI dashboard — read-only overview of student progress
- [x] View individual student profiles and case logs
- [x] View case distribution and progress dashboards
- [ ] Ensure no edit/create permissions in UI and RLS

---

## Phase 10: Announcement System

- [x] Admin: create / delete announcements
- [x] All roles: view announcements feed
- [x] Sorted by date (newest first)
- [x] Empty state UX

---

## Phase 11: Data Export

- [ ] Export student case records to CSV
- [ ] Export progress reports to CSV
- [ ] Admin-only access

---

## Phase 12: Audit Logs

- [ ] Record all admin actions (case logs, assignments, edits, deletions)
- [ ] Audit log viewer page (admin only)
- [ ] Filter by action type, user, date range

---

## Phase 13: Notifications (Optional Enhancement)

- [ ] Notify admin of new uploads
- [ ] Notify students of new assignments
- [ ] Notify students of new announcements

---

## Phase 14: Polish & Production Readiness

### UI / UX
- [ ] Mobile responsive layout (especially student upload flow)
- [ ] Empty state messages across all pages
- [ ] Loading states and skeletons
- [ ] Error handling with clear user feedback (toast / alert)
- [ ] Role-based UI restrictions (hide inaccessible features)

### Performance
- [ ] Lazy loading for images
- [ ] Paginate all list views
- [ ] Limit records per API request

### Security
- [ ] Verify all RLS policies lock down data per role
- [ ] Validate file uploads server-side (type, size)
- [ ] Sanitize all user inputs
- [ ] Ensure service role key is never exposed to client

### Data Integrity
- [ ] Soft delete everywhere (archive/inactive, never hard delete)
- [ ] Standardize timezone handling (UTC storage, local display)
- [ ] Duplicate prevention constraints in DB

### Deployment
- [ ] Connect repo to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure Supabase production project
- [ ] Set up database backups in Supabase
- [ ] Test production build locally (`npm run build`)
- [ ] Verify all routes work in production

---

## Future Phases (Deferred)

- [ ] AI-assisted logging (scan uploaded images, extract case data)
- [ ] Exposure scoring system (priority calculation for assignments)
- [ ] Advanced analytics (trends over time, performance insights)
- [ ] In-app notification center

---

## Project Structure

```
clinical-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup, callback)
│   │   ├── admin/              # Admin pages
│   │   ├── student/            # Student pages
│   │   ├── ci/                 # CI pages
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing / redirect
│   ├── components/             # Shared UI components
│   ├── lib/
│   │   └── supabase/           # Supabase client helpers
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Auth session middleware
├── public/
├── .env.local.example
├── package.json
└── tsconfig.json
```
