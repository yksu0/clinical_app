export type UserRole = "admin" | "ci" | "student";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  section: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AreaOfDuty {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Requirement {
  id: string;
  case_type_id: string;
  required_count: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  case_type_id: string;
  area_of_duty_id: string;
  scheduled_date: string;
  status: "assigned" | "completed" | "missed";
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  student_id: string;
  file_path: string;
  file_name: string;
  status: "pending" | "processed" | "rejected";
  uploaded_at: string;
  processed_at: string | null;
}

export interface CaseLog {
  id: string;
  student_id: string;
  case_type_id: string;
  area_of_duty_id: string;
  upload_id: string | null;
  date: string;
  notes: string | null;
  logged_by: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action_type: string;
  performed_by: string;
  target_table: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}
