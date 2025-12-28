import { UserRole } from '@/types/database';

export const canManageSchools = (role: UserRole) => {
  return role === 'super_admin';
};

export const canManageUsers = (role: UserRole) => {
  return role === 'super_admin' || role === 'admin';
};

export const canManageClasses = (role: UserRole) => {
  return role === 'super_admin' || role === 'admin';
};

export const canManageSubjects = (role: UserRole) => {
  return role === 'super_admin' || role === 'admin';
};

export const canManageStudents = (role: UserRole) => {
  return role === 'super_admin' || role === 'admin';
};

export const canRecordScores = (role: UserRole) => {
  return role === 'teacher' || role === 'admin';
};

export const canAddRemarks = (role: UserRole) => {
  return role === 'teacher' || role === 'headmaster' || role === 'admin';
};

export const canApproveScores = (role: UserRole) => {
  return role === 'headmaster';
};

export const canPromoteStudents = (role: UserRole) => {
  return role === 'headmaster';
};

export const canGenerateReports = (role: UserRole) => {
  return role === 'headmaster' || role === 'admin';
};

export const canViewAuditLogs = (role: UserRole) => {
  return role === 'super_admin' || role === 'admin' || role === 'headmaster';
};
