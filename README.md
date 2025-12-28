# Ascenda - School Management System

A comprehensive mobile-first school management system built with React Native Expo and Supabase.

## Features

### Role-Based Access Control

- **Super Admin**: Manage multiple schools and assign school admins
- **School Admin**: Manage users, classes, subjects, and students
- **Headmaster**: Approve assessments, promote students, generate reports
- **Teacher**: Record scores and remarks for assigned classes
- **Student**: View-only access (future implementation)

### Core Functionality

- User authentication with email/password
- Role-based navigation and permissions
- Student assessment management (CA + Exam scores)
- Automated grade calculation (A-F scale)
- Teacher remarks and comments
- Student promotion tracking
- Report generation and export

## Technology Stack

- **Frontend**: React Native with Expo SDK
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Authentication**: Supabase Auth
- **State Management**: React Hooks
- **UI Components**: Custom component library
- **Icons**: Lucide React Native

## Project Structure

```
ascenda/
├── app/                          # Screen routes
│   ├── (auth)/                  # Authentication screens
│   ├── (superadmin)/            # Super admin screens
│   ├── (admin)/                 # School admin screens
│   ├── (teacher)/               # Teacher screens
│   ├── (headmaster)/            # Headmaster screens
│   └── index.tsx                # Root navigator
├── components/
│   └── ui/                      # Reusable UI components
├── hooks/                       # Custom React hooks
├── services/
│   ├── supabase/               # Supabase service layer
│   └── helpers/                # Utility functions
├── theme/                       # Design system tokens
├── types/                       # TypeScript definitions
└── supabase/
    ├── migrations/             # Database migrations
    └── functions/              # Edge functions
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- Supabase account and project

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. The Supabase database migrations have already been applied with:
   - Core tables (schools, users, classes, subjects, students, etc.)
   - Row Level Security policies
   - Indexes for performance

3. Start the development server:
```bash
npm run dev
```

## Database Schema

### Key Tables

- **schools**: School information and configuration
- **users**: System users with role-based access
- **classes**: Class definitions by academic year
- **subjects**: Subject catalog per school
- **students**: Student records and information
- **teacher_assignments**: Links teachers to classes and subjects
- **assessments**: Student scores with CA/Exam breakdown
- **student_remarks**: Teacher comments and observations
- **promotion_history**: Track student progression
- **audit_logs**: System activity tracking

### Security Model

All tables use Row Level Security (RLS) with policies ensuring:
- Super admins have full access
- School staff can only access their school's data
- Teachers can only modify assessments for assigned classes
- Headmasters can approve and lock assessments
- Students can only view their own data

## Edge Functions

Three Supabase Edge Functions are included:

1. **generate_report**: Create comprehensive student reports
2. **bulk_promote**: Mass promote students to next class
3. **export_csv**: Export class data to CSV format

Deploy edge functions using the Supabase MCP tools.

## Grading System

- **CA Score**: 0-40 points (Continuous Assessment)
- **Exam Score**: 0-60 points
- **Total**: 0-100 points

### Grade Scale
- A: 80-100
- B: 70-79
- C: 60-69
- D: 50-59
- E: 40-49
- F: 0-39

## Development Guidelines

### Code Organization

- Follow single responsibility principle
- Keep files under 300 lines when possible
- Use TypeScript for type safety
- Implement proper error handling

### Styling

- Use the theme system for consistency
- Follow the 8px spacing grid
- Maintain clear visual hierarchy
- Ensure readability with proper contrast

### Security

- Never expose sensitive data in client code
- Validate all user inputs
- Use RLS policies for data access control
- Follow principle of least privilege

## Available Scripts

- `npm run dev` - Start Expo development server
- `npm run build:web` - Build for web deployment
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint

## Testing

To test the application:

1. Create test users with different roles in Supabase
2. Sign in with each role to test permissions
3. Verify RLS policies prevent unauthorized access
4. Test score entry and grade calculations
5. Verify promotion workflow

## Future Enhancements

- Student mobile app for viewing grades
- Push notifications for score submissions
- Advanced analytics and insights
- Attendance tracking
- Fee management
- Parent portal
- Offline mode with sync

## Support

For issues or questions, please refer to the documentation or contact the development team.

## License

Private - All Rights Reserved
