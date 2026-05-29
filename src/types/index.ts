export type Role = "superadmin" | "school_director" | "school_secretary" | "coordinator" | "teacher" | "guardian" | "student" | "both";

export type Permission = "attendance" | "grading" | "occurrences" | "access_control" | "settings";

export interface School {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  createdAt: number;
  updatedAt: number;
  status: "active" | "inactive";
}

export interface SchoolMember {
  id: string; // Document ID, usually same as userId
  userId: string;
  name: string;
  email: string;
  subject?: string;
  photoUrl?: string;
  role: Role;
  status: "pending" | "approved" | "blocked";
  permissions?: Record<Permission, boolean>;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string; // userId of who approved
}

export interface Guardian {
  id: string;
  userId?: string; // If they have a system account
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  status: "active" | "inactive";
  createdAt: number;
}

export interface GuardianStudentLink {
  id: string;
  guardianId: string;
  studentId: string;
  relationship: string; // e.g. "father", "mother"
  status: "pending" | "approved" | "rejected";
  visibility: "full" | "restricted";
  approvedBy?: string;
  approvedAt?: number;
  createdAt: number;
}

export interface Student {
  id: string;
  name: string;
  birthDate?: string;
  registrationNumber?: string;
  classId: string;
  status: "active" | "transferred" | "inactive";
  guardianIds: string[];
  specialNeeds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade?: string;
  room?: string;
  shift?: string;
  year: number;
  teacherIds: string[];
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "justified" | "none";
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  subject: string;
  bimester: string; // e.g., "1", "2", "3", "4"
  method: string;
  points: number;
  maxPoints?: number;
  date: string;
  visibleToGuardian: boolean;
  visibleFrom?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Occurrence {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  status: "open" | "reviewed" | "resolved";
  visibleToGuardian: boolean;
  visibleFrom?: number;
  reviewedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id: string;
  recipientUserId: string;
  recipientRole: Role;
  studentId?: string;
  title: string;
  message: string;
  type: "alert" | "info" | "warning";
  read: boolean;
  createdAt: number;
}
