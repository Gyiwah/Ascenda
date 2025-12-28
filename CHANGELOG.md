# Changelog

All notable changes to the Ascenda School Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Account deactivated screen (`AccountDeactivatedScreen.tsx`) to display when user account is deactivated
- Enhanced admin dashboard with subjects and assignments statistics
- School code display on admin dashboard header
- Real-time stats refresh on `SchoolDetailsScreen` (every 30 seconds)
- Student login authentication using admission number and date of birth (Edge Function: `student_login`)
- RLS policies for school admin to manage teachers, headmasters, and students
- Database constraint to prevent student role in users table
- `StudentUser` type for student authentication (students don't use Supabase Auth)
- `signInStudent()` method in `authService` and `useAuth` hook
- Login screen toggle between Staff and Student login modes
- Student session caching in offline storage
- CHANGELOG.md file to track all changes and modifications

### Changed
- Updated `AddTeacherScreen` to use `userService.inviteUser()` instead of non-existent `invite()` method
- Enhanced `DashboardScreen` with enriched statistics (subjects, assignments, school code)
- Fixed navigation in `StudentsScreen` to properly navigate to `AddStudentScreen` using parent navigator
- Updated `useAuth` to set specific error code `ACCOUNT_DEACTIVATED` when user is inactive
- Updated RLS policies to allow school admins to manage teachers, headmasters, and students within their school
- Updated `LoginScreen` to support both staff (email/password) and student (admission number/DOB) authentication
- Updated `useAuth` hook to handle both staff and student authentication flows
- Updated `RootNavigator` to handle student role navigation
- Updated `DATABASE_SETUP.md` with final RLS policy implementations

### Fixed
- Fixed `AddTeacherScreen` error: `userService.invite is not a function`
- Fixed `AddStudentScreen` navigation issue when clicking "Add Student" button
- Fixed account deactivation message display
- Fixed dashboard stats not updating in real-time
- Fixed navigation error: "The action 'RESET' with payload {"name":"Student"} was not handled" by creating StudentNavigator
- Fixed infinite recursion in RLS policies by using SECURITY DEFINER helper functions
- Updated `DATABASE_SETUP.md` with non-recursive RLS policies that prevent "infinite recursion detected in policy" errors
- Fixed infinite recursion when school admin adds a student by splitting student policies into separate INSERT/UPDATE/DELETE policies
- Fixed student login error by removing auth token requirement (students don't have auth sessions)
- Improved error handling in `student_login` edge function
- Fixed school admin unable to add teachers by implementing `createSchoolUser` API method that uses `create_school_user` edge function
- Fixed student login error message "Edge Function returned a non-2xx status code" by improving error handling in `authService.signInStudent`
- Fixed `AddUserScreen` allowing student creation - now redirects users to create students in the Students table instead
- Fixed `AddStudentScreen` to support both super admin (with school picker) and school admin (uses their school_id)
- Fixed TypeScript error: `'3xl'` spacing doesn't exist - changed to `'2xl'` in LoginScreen
- Added "All Classes" option to StudentsScreen class picker to show all students in the school
- Updated student and teacher card styling to match UsersScreen.tsx for consistency (cardActions with text labels, dividers)
- Created StudentDetailsScreen to display student information when student card is touched
- Added RLS policies for teacher_assignments table to allow school admins to create, update, and delete assignments
- Fixed teacher school assignment issue: Updated `handle_new_user()` trigger to include `school_id` from user metadata and changed edge functions to use `upsert` instead of `insert` to handle race condition with trigger
- Fixed super admin user creation: Updated `invite_user` edge function to use `upsert` to ensure `school_id` is properly set when creating users with a selected school
- Implemented Teacher Academic & Assessment Module:
  - Created MyClassesScreen to display teacher assignments grouped by class and subject
  - Created StudentScoreEntryScreen for entering CA and Exam scores with auto-computed totals and grades
  - Created RemarkEntryScreen for entering behavior, performance, and attendance remarks
  - Added GradeBadge, ScoreInputRow, and RemarkInputCard UI components
  - Added computeGrade and validators utility functions
  - Implemented API functions for assignments, students, assessments, and remarks
  - Added offline support with network status detection
  - Integrated haptic feedback for better UX
- Fixed MyClassesScreen not showing assignments: Removed academic year filter from initial load, fixed foreign key syntax in Supabase queries, added comprehensive logging for debugging
- Fixed total_score generated column error: Removed total_score and grade from upsert operations as they are computed/generated columns in the database
- Restructured ScoreInputRow: Student info now appears on top of score fields (CA, Exam, Total, Grade) for better readability
- Improved keyboard handling across app: Created useKeyboardAvoidance hook with proper safe area insets, increased keyboardVerticalOffset, and added extra padding to ScrollView content for better input field visibility
- Enriched Teacher DashboardScreen: Added comprehensive stats including total classes, subjects, students, pending/completed assessments, completion rate, and quick actions with navigation
- Restructured StudentScoreEntryScreen: Now shows one student at a time with Previous/Next navigation buttons, progress indicator (e.g., "Entry 5 of 25 students"), Save Draft button, and Preview All modal with Submit Final button
- Implemented proper remarks navigation: Remarks feature is accessible from MyClassesScreen with proper navigation to RemarkEntryScreen
- Implemented Headmaster Approvals Module (PHASE 6):
  - Created ApprovalsDashboard with tabs (Pending/Approved/Locked) for reviewing teacher submissions
  - Created ReviewAssessmentScreen for detailed review, editing scores, approving, and locking term results
  - Implemented API functions: listPendingSubmissions, listApprovedSubmissions, listLockedSubmissions, getAssessmentsForReview, updateAssessment, approveAssessment, lockTermResults
  - Added audit trail view with audit_logs integration
  - Enhanced HeadmasterDashboard with real-time approval stats and quick actions
- Implemented Promotion Module (PHASE 7):
  - Created PromotionDashboard showing all classes with Term 3 lock status
  - Created BulkPromotionWizard with 3-step process (Select Target Class → Preview & Exclude → Confirm)
  - Created IndividualPromotionScreen for promoting, repeating, or graduating individual students
  - Implemented API functions: isTerm3Locked, getPromotionCandidates, getTargetClasses, bulkPromote, individualPromote, getPromotionHistory
  - Added promotion_history table integration and audit logging
  - Promotion features only available after Term 3 results are locked

## [2024-01-XX] - Previous Implementation

### Added
- SQLite offline-first caching for schools, users, and auth sessions
- Academic Setup Module (Classes, Subjects, Teacher Assignments)
- Teacher and Student management screens for school admin
- Settings & Theming Module with Zustand store
- Profile settings screen with theme, font size, and password change
- School and User detail screens
- Touchable cards on dashboard and list screens
- Real-time updates on dashboards using `useFocusEffect` and intervals

### Changed
- Replaced modals with dedicated screens for adding schools and users
- Darkened dark mode background colors
- Replaced dark/light mode toggle with profile icon
- Enhanced dashboard statistics

### Fixed
- Keyboard covering input fields (added `KeyboardAvoidingView`)
- Error handling in API services for better error messages
- TypeScript compilation errors
- Linter errors in SQLite implementation

