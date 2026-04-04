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
- [ ] Create Supabase project & obtain keys
- [ ] Add keys to `.env.local`
- [ ] Verify dev server runs (`npm run dev`)

---

## Phase 1: Database Schema (Supabase)

- [ ] Create `profiles` table (id, full_name, email, role, section, is_verified, is_active, timestamps)
- [ ] Create `case_types` table (id, name, is_active, timestamps)
- [ ] Create `locations` table (id, name, is_active, timestamps)
- [ ] Create `requirements` table (id, case_type_id FK, required_count, timestamps)
- [ ] Create `assignments` table (id, student_id FK, case_type_id FK, location_id FK, scheduled_date, status, assigned_by FK, timestamps)
- [ ] Create `uploads` table (id, student_id FK, file_path, file_name, status, uploaded_at, processed_at)
- [ ] Create `case_logs` table (id, student_id FK, case_type_id FK, location_id FK, upload_id FK nullable, date, notes, logged_by FK, timestamps)
- [ ] Create `announcements` table (id, title, content, created_by FK, created_at)
- [ ] Create `audit_logs` table (id, action_type, performed_by FK, target_table, target_id, details JSONB, created_at)
- [ ] Set up Row-Level Security (RLS) policies per role
- [ ] Create Supabase Storage bucket for uploads (accepted: jpg, png, pdf; max size limit)
- [ ] Add database indexes on foreign keys and frequently queried columns
- [ ] Add unique constraints for duplicate prevention (e.g., student + date + case_type)

---

## Phase 2: Authentication & Role Management

- [ ] Build signup page (`/signup`)
- [ ] Build login page (`/login`)
- [ ] Implement Supabase Auth (email/password)
- [ ] On signup: match student name against pre-registered roster
- [ ] Admin approval flow for new student accounts (`is_verified` flag)
- [ ] Create auth callback route (`/auth/callback`)
- [ ] Implement role-based route protection in middleware
- [ ] Redirect users to role-specific dashboards after login
- [ ] Build logout functionality

---

## Phase 3: Admin — System Configuration

- [ ] Case Types management page (CRUD, soft delete)
- [ ] Locations management page (CRUD, soft delete)
- [ ] Requirements management page (set required count per case type)
- [ ] Student roster management page
  - [ ] Manual add student (name, email, section)
  - [ ] Bulk import students via CSV
  - [ ] Verify / approve student accounts
  - [ ] Deactivate / archive students

---

## Phase 4: Student — Upload System

- [ ] Upload page — file picker (jpg, png, pdf)
- [ ] Client-side validation (file type, file size)
- [ ] Image compression before upload
- [ ] Upload to Supabase Storage
- [ ] Create upload record with status = "pending"
- [ ] Upload history list with status badges (pending / processed / rejected)
- [ ] Empty state UX ("No uploads yet")

---

## Phase 5: Admin — Case Logging

- [ ] Case logging page — select student
- [ ] Display student's uploaded proofs (sorted by date)
- [ ] Log case form: case type dropdown, location dropdown, date picker, notes
- [ ] On save: create case_log record, update upload status to "processed"
- [ ] Duplicate prevention (same student + date + case type)
- [ ] Create audit log entry on case log creation
- [ ] Bulk approve uploads

---

## Phase 6: Assignment System

- [ ] Assignment creation page
  - [ ] Select case type, location, date
  - [ ] Display recommended students list (prioritized by exposure)
  - [ ] Select student and confirm assignment
- [ ] Smart recommendation engine
  - [ ] High priority: no exposure to selected case type
  - [ ] Medium priority: below requirement threshold
  - [ ] Low priority: requirement already met
  - [ ] Factor in location repetition avoidance
- [ ] Assignment tracking (assigned / completed / missed)
- [ ] Bulk assign cases
- [ ] Create audit log entry on assignment

---

## Phase 7: Student — Views & Progress

- [ ] Student dashboard — personal progress overview
  - [ ] Completed vs. required cases per type
  - [ ] Case statistics (by type, by location)
- [ ] Assigned cases view (upcoming assignments with details)
- [ ] Case history view (all logged cases)
- [ ] Upload status tracker (pending / processed / rejected)
- [ ] Requirement completion indicators

---

## Phase 8: Admin Dashboard & Smart Filtering

- [ ] Admin dashboard
  - [ ] Students falling behind alerts
  - [ ] Exposure imbalance alerts
  - [ ] Case distribution overview (by type)
  - [ ] Location distribution overview
- [ ] Smart filters
  - [ ] Students missing specific case types
  - [ ] Students below requirements
  - [ ] Students with repeated locations
  - [ ] Students with low activity
  - [ ] Students with pending uploads
- [ ] Student insight panel
  - [ ] Total cases, cases per type, cases per location
  - [ ] Imbalance detection warnings
  - [ ] Requirement completion status
- [ ] Search students by name
- [ ] Pagination (300+ students support)

---

## Phase 9: CI (Read-Only Instructor) Views

- [ ] CI dashboard — read-only overview of student progress
- [ ] View individual student profiles and case logs
- [ ] View case distribution and progress dashboards
- [ ] Ensure no edit/create permissions in UI and RLS

---

## Phase 10: Announcement System

- [ ] Admin: create / edit / delete announcements
- [ ] All roles: view announcements feed
- [ ] Sorted by date (newest first)
- [ ] Empty state UX

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
