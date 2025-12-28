import { useAuth } from './useAuth';
import { UserRole } from '@/types/database';
import * as permissions from '@/services/helpers/permissions';

export function useRole() {
  const { user } = useAuth();

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return user?.role ? roles.includes(user.role) : false;
  };

  return {
    role: user?.role,
    isSuperAdmin: hasRole('super_admin'),
    isAdmin: hasRole('admin'),
    isHeadmaster: hasRole('headmaster'),
    isTeacher: hasRole('teacher'),
    isStudent: hasRole('student'),
    canManageSchools: user?.role ? permissions.canManageSchools(user.role) : false,
    canManageUsers: user?.role ? permissions.canManageUsers(user.role) : false,
    canManageClasses: user?.role ? permissions.canManageClasses(user.role) : false,
    canManageSubjects: user?.role ? permissions.canManageSubjects(user.role) : false,
    canManageStudents: user?.role ? permissions.canManageStudents(user.role) : false,
    canRecordScores: user?.role ? permissions.canRecordScores(user.role) : false,
    canAddRemarks: user?.role ? permissions.canAddRemarks(user.role) : false,
    canApproveScores: user?.role ? permissions.canApproveScores(user.role) : false,
    canPromoteStudents: user?.role ? permissions.canPromoteStudents(user.role) : false,
    canGenerateReports: user?.role ? permissions.canGenerateReports(user.role) : false,
    canViewAuditLogs: user?.role ? permissions.canViewAuditLogs(user.role) : false,
    hasRole,
    hasAnyRole,
  };
}
