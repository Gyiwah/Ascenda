import { supabase } from './client';

export interface CreateSchoolAdminParams {
  name: string;
  email: string;
  password: string;
  school_id: string;
}

export interface CreateSchoolUserParams {
  name: string;
  email: string;
  password: string;
  role: 'headmaster' | 'teacher';
}

export interface FunctionResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

export const functionsService = {
  /**
   * Create a School Admin user (SuperAdmin only)
   * @param params - User details including name, email, password, and school_id
   * @returns Created user object or error
   */
  async createSchoolAdmin(params: CreateSchoolAdminParams): Promise<FunctionResponse<{ user: any }>> {
    try {
      const { data, error } = await supabase.functions.invoke('create_school_admin', {
        body: params,
      });

      if (error) {
        return {
          error: {
            message: error.message || 'Failed to create school admin',
            status: (error as any).status,
          },
        };
      }

      return { data };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'Unexpected error creating school admin',
        },
      };
    }
  },

  /**
   * Create a Headmaster or Teacher user (SchoolAdmin only)
   * @param params - User details including name, email, password, and role
   * @returns Created user object or error
   */
  async createSchoolUser(params: CreateSchoolUserParams): Promise<FunctionResponse<{ user: any }>> {
    try {
      const { data, error } = await supabase.functions.invoke('create_school_user', {
        body: params,
      });

      if (error) {
        return {
          error: {
            message: error.message || 'Failed to create user',
            status: (error as any).status,
          },
        };
      }

      return { data };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'Unexpected error creating user',
        },
      };
    }
  },
};


