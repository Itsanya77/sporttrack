export type Role = 'TEACHER' | 'STUDENT' | 'ADMIN';

export type EquipmentStatus = 
  | 'AVAILABLE' 
  | 'ISSUED' 
  | 'RETURN_PENDING' 
  | 'DAMAGED' 
  | 'LOST' 
  | 'ARCHIVED';

export type RequestStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'ISSUED' 
  | 'RETURNED'
  | 'OVERDUE'
  | 'CANCELLED';

export type ReturnStatus = 
  | 'RETURN_PENDING' 
  | 'RETURNED' 
  | 'REJECTED';

export type EquipmentCondition = 
  | 'EXCELLENT' 
  | 'GOOD' 
  | 'FAIR' 
  | 'DAMAGED';

export type ReturnInspectionOutcome = EquipmentCondition | 'LOST';

export type FeedbackType = 'EQUIPMENT_NEEDED' | 'PROBLEM' | 'SUGGESTION' | 'OTHER';

export type FeedbackStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface FeedbackItem {
  id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  type: FeedbackType;
  subject: string;
  message: string;
  equipment_name?: string;
  quantity?: number;
  status: FeedbackStatus;
  reply?: string;
  replied_by?: string;
  replied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  student_id?: string;
  email: string;
  phone?: string;
  password?: string;
  password_hash?: string;
  salt?: string;
  role: Role;
  course?: string;
  year?: string;
  division?: string;
  avatar?: string;
  profile_completed?: boolean;
  active: boolean;
  created_at: string;
  reset_token?: string;
  reset_token_expires?: string;
}

export interface Sport {
  id: string;
  name: string;
  description: string;
  image?: string;
  active: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  equipment_code: string;
  name: string;
  sport_id: string; // Category ID
  brand?: string;
  quantity: number;
  available_quantity: number;
  issued_quantity: number;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  location?: string;
  price?: number;
  purchase_date: string;
  remarks: string;
  image_url?: string;
  created_at: string;
  active: boolean;
  sample_data_flag?: boolean;
}

export interface EquipmentRequest {
  id: string;
  student_id: string;
  equipment_id: string;
  quantity: number;
  expected_return: string;
  required_date?: string;
  purpose: string;
  notes?: string;
  selfie_path?: string;
  status: RequestStatus;
  rejection_reason?: string;
  teacher_remarks?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  created_by?: string;
  created_by_role?: Role;
  request_source?: 'STUDENT_SUBMITTED' | 'TEACHER_CREATED';
}

export interface IssueRecord {
  id: string;
  request_id: string;
  student_id: string;
  equipment_id: string;
  quantity: number;
  issued_by: string; // Teacher User ID
  issued_at: string;
  expected_return: string;
  actual_return?: string;
  status: 'ISSUED' | 'RETURNED';
  notes?: string;
}

export interface ReturnRecord {
  id: string;
  issue_id: string;
  student_id?: string;
  requested_at: string;
  accepted_at?: string;
  condition?: ReturnInspectionOutcome;
  remarks?: string;
  accepted_by?: string; // Teacher User ID
  status: ReturnStatus;
}

export type LearningContentType = 
  | 'Rules' 
  | 'Equipment usage' 
  | 'Beginner techniques' 
  | 'Common mistakes' 
  | 'Safety tips'
  | 'Cricket Tutorials'
  | 'Football Tutorials'
  | 'Fitness'
  | 'Warm-up'
  | 'Training'
  | 'Sports Tips';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  youtube_url: string;
  duration?: string;
  tags?: string[];
  thumbnail?: string;
  published: boolean;
  created_at: string;
}

export interface LearningContent {
  id: string;
  sport_id: string;
  title: string;
  description: string;
  video_url: string;
  content_type: LearningContentType;
  active: boolean;
  created_at: string;
}

export interface LoginSettings {
  background_image: string;
  overlay_color: string;
  overlay_opacity: number;
  card_opacity: number;
  college_name: string;
  welcome_text: string;
  subtitle: string;
  college_logo_url: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  target_role: 'ALL' | 'TEACHER' | 'STUDENT';
  created_at: string;
  read: boolean;
  target_tab?: string;
  target_id?: string;
  target_type?: 'REQUEST' | 'EQUIPMENT' | 'ISSUE' | 'RETURN' | 'STUDENT' | 'STAFF' | 'GENERAL' | 'VIDEO' | 'FEEDBACK';
}

export interface SystemSettings {
  college_name: string;
  department: string;
  logo_url: string;
  admin_email: string;
  sports_incharge_name?: string;
  academic_year?: string;
  contact_email?: string;
  contact_phone?: string;
  max_borrow_duration_days?: number;
  fine_per_day?: number;
  require_selfie?: boolean;
  auto_approve_enabled?: boolean;
  overdue_reminder_days: number;
  sample_data_watermark: boolean;
  allow_student_registration: boolean;
}
