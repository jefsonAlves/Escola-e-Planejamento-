import { useState, useEffect } from "react";
import { AppUser, isSchoolDirector, isSecretary, isCoordinator, isTeacher, canManageAccess, canViewGrades, canViewOccurrences, canRequestMeeting, canViewStudentProfile } from "../security/permissions";
import { Role } from "../types";

export const usePermissions = (user: AppUser | null, currentSchoolId: string | undefined) => {
  const [permissions, setPermissions] = useState({
    isDirector: false,
    isSecretary: false,
    isCoordinator: false,
    isTeacher: false,
    canManageAccess: false,
    canViewGrades: false,
    canViewOccurrences: false,
    canRequestMeeting: false,
    canViewStudentProfile: false,
  });

  useEffect(() => {
    if (!user) {
      setPermissions({
        isDirector: false,
        isSecretary: false,
        isCoordinator: false,
        isTeacher: false,
        canManageAccess: false,
        canViewGrades: false,
        canViewOccurrences: false,
        canRequestMeeting: false,
        canViewStudentProfile: false,
      });
      return;
    }

    setPermissions({
      isDirector: isSchoolDirector(user, currentSchoolId),
      isSecretary: isSecretary(user, currentSchoolId),
      isCoordinator: isCoordinator(user, currentSchoolId),
      isTeacher: isTeacher(user, currentSchoolId),
      canManageAccess: canManageAccess(user, currentSchoolId),
      canViewGrades: canViewGrades(user, undefined, false), // Simplified for component level checks
      canViewOccurrences: canViewOccurrences(user, undefined, false),
      canRequestMeeting: canRequestMeeting(user, false),
      canViewStudentProfile: canViewStudentProfile(user, false),
    });
  }, [user, currentSchoolId]);

  return permissions;
};
