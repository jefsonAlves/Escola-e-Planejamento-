import { Role } from "../types";

// Temporarily importing interface or defining basic user type
export interface AppUser {
  uid: string;
  email?: string;
  role?: Role; // The active role
  activeSchoolId?: string;
}

export const canViewAllSchools = (user?: AppUser) => {
  return user?.role === "superadmin";
};

export const isSchoolDirector = (user?: AppUser, schoolId?: string) => {
  if (!user || !schoolId) return false;
  if (user.role === "superadmin") return true;
  return user.role === "school_director" && user.activeSchoolId === schoolId;
};

export const isSecretary = (user?: AppUser, schoolId?: string) => {
  if (!user || !schoolId) return false;
  if (user.role === "superadmin") return true;
  return user.role === "school_secretary" && user.activeSchoolId === schoolId;
};

export const isCoordinator = (user?: AppUser, schoolId?: string) => {
  if (!user || !schoolId) return false;
  if (user.role === "superadmin") return true;
  return user.role === "coordinator" && user.activeSchoolId === schoolId;
};

export const isTeacher = (user?: AppUser, schoolId?: string) => {
  if (!user || !schoolId) return false;
  if (user.role === "superadmin") return true;
  return (user.role === "teacher" || user.role === "both") && user.activeSchoolId === schoolId;
};

export const canManageAccess = (user?: AppUser, schoolId?: string) => {
  return isSchoolDirector(user, schoolId) || isSecretary(user, schoolId);
};

export const canManageClassesAndStudents = (user?: AppUser, schoolId?: string) => {
  return isSchoolDirector(user, schoolId) || isSecretary(user, schoolId) || isCoordinator(user, schoolId);
};

export const canViewGrades = (user?: AppUser, studentId?: string, isStudentLinkedToUser: boolean = false) => {
  if (!user) return false;
  // Teachers, Directors, Secretaries, Coordinators can view if they are in the same school (we assume here higher logic checks school context)
  if (["superadmin", "school_director", "school_secretary", "coordinator", "teacher", "both"].includes(user.role || "")) {
    return true;
  }
  if (user.role === "guardian" && isStudentLinkedToUser) {
    return true; // We also need to check visibility rules at the data level
  }
  return false;
};

export const canViewOccurrences = (user?: AppUser, studentId?: string, isStudentLinkedToUser: boolean = false) => {
  if (!user) return false;
  if (["superadmin", "school_director", "school_secretary", "coordinator", "teacher", "both"].includes(user.role || "")) {
    return true;
  }
  if (user.role === "guardian" && isStudentLinkedToUser) {
    return true;
  }
  return false;
};

export const canRequestMeeting = (user?: AppUser, isStudentLinkedToUser: boolean = false) => {
  return user?.role === "guardian" && isStudentLinkedToUser;
};

export const canViewStudentProfile = (user?: AppUser, isStudentLinkedToUser: boolean = false) => {
  if (!user) return false;
  if (["superadmin", "school_director", "school_secretary", "coordinator", "teacher", "both"].includes(user.role || "")) {
    return true;
  }
  return user.role === "guardian" && isStudentLinkedToUser;
};
