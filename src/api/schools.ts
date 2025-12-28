import { supabase } from '../database/client';
import { School } from '@/types/database';
import { cacheSchools, getCachedSchools } from '@/offline/cache';
import { studentService } from './students';
import { classService } from './classes';
import { userService } from './users';

const LOGO_BUCKET = 'logos';

type CreateWithAdminParams = {
  name: string;
  code?: string;
  admin: {
    name: string;
    email: string;
    password: string;
  };
  logoUri?: string;
  postalAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export const schoolService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        // update cache on successful fetch
        cacheSchools(data as School[]).catch(() => {});
      }
      return { data: data as School[] | null, error };
    } catch (err: any) {
      // fall back to cache on failure
      const cached = await getCachedSchools();
      return { data: cached, error: err };
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data as School | null, error };
  },

  async getStats(schoolId: string) {
    try {
      // Use existing service methods to handle RLS properly
      const [teachersRes, studentsRes, classesRes] = await Promise.all([
        userService.getByRole('teacher', schoolId),
        studentService.getAll(schoolId),
        classService.getAll(schoolId),
      ]);

      // Log errors for debugging (only in dev mode)
      if (__DEV__) {
        if (teachersRes.error) {
          console.debug('[schoolService.getStats] teachers error:', teachersRes.error);
        }
        if (studentsRes.error) {
          console.debug('[schoolService.getStats] students error:', studentsRes.error);
        }
        if (classesRes.error) {
          console.debug('[schoolService.getStats] classes error:', classesRes.error);
        }
        console.debug('[schoolService.getStats] counts:', {
          teachers: teachersRes.data?.length ?? 0,
          students: studentsRes.data?.length ?? 0,
          classes: classesRes.data?.length ?? 0,
        });
      }

      const data = {
        total_teachers: teachersRes.data?.length ?? 0,
        total_students: studentsRes.data?.length ?? 0,
        total_classes: classesRes.data?.length ?? 0,
      };

      // Return data even if some queries failed (partial success)
      // Only return error if all queries failed
      const errors = [teachersRes.error, studentsRes.error, classesRes.error].filter(Boolean);
      const error = errors.length === 3 ? errors[0] : null;

      return { data, error };
    } catch (err: any) {
      console.error('[schoolService.getStats] caught error:', err);
      return {
        data: { total_teachers: 0, total_students: 0, total_classes: 0 },
        error: err,
      };
    }
  },

  async create(schoolData: Partial<School>) {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert(schoolData)
        .select()
        .single();

      if (error) {
        console.error('[schoolService.create] insert error', error, { schoolData });
      }

      return { data: data as School | null, error };
    } catch (err: any) {
      console.error('[schoolService.create] caught error', err, { schoolData });
      return { data: null, error: err };
    }
  },

  async update(id: string, updates: Partial<School>) {
    // Use Edge Function to bypass RLS for authenticated users
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return {
        data: null,
        error: new Error('Not authenticated'),
      };
    }

    try {
      const response = await supabase.functions.invoke('update_school', {
        body: {
          schoolId: id,
          ...updates,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // Log full response for diagnostics
      try {
        console.debug('[schoolService.update] function response', {
          error: (response as any)?.error ?? null,
          data: (response as any)?.data ?? null,
          status: (response as any)?.status ?? (response as any)?.res?.status ?? null,
        });
      } catch (logErr) {
        console.error('[schoolService.update] failed to log function response', logErr);
      }

      // Check for error first (FunctionsHttpError or similar)
      if (response?.error) {
        let errorMessage = 'Failed to update school';
        
        // Try to extract error message from various possible locations
        if (response.error.message) {
          errorMessage = response.error.message;
        } else if ((response.error as any)?.context?.message) {
          errorMessage = (response.error as any).context.message;
        } else if (typeof response.error === 'string') {
          errorMessage = response.error;
        }
        
        // Check if it's a non-2xx status code error
        const status = (response as any)?.status ?? (response as any)?.res?.status ?? (response.error as any)?.status;
        if (status && status >= 400) {
          // Try to get error from response data if available
          if (response?.data && typeof response.data === 'object' && 'error' in response.data) {
            errorMessage = (response.data as any).error || errorMessage;
          }
        }
        
        console.error('[schoolService.update] function error', errorMessage);
        return { data: null, error: new Error(errorMessage) };
      }

      // Check response status code directly
      const status = (response as any)?.status ?? (response as any)?.res?.status;
      if (status && status >= 400) {
        let errorMessage = 'Failed to update school';
        // Try to extract error from response data
        if (response?.data && typeof response.data === 'object') {
          if ('error' in response.data) {
            errorMessage = (response.data as any).error || errorMessage;
          } else if ('message' in response.data) {
            errorMessage = (response.data as any).message || errorMessage;
          }
        }
        console.error('[schoolService.update] non-2xx status', { status, errorMessage });
        return { data: null, error: new Error(errorMessage) };
      }

      // Error case: response.data contains an error field (server returned 400+ with error payload)
      if (response?.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorMessage = (response.data as any).error || 'Failed to update school';
        console.error('[schoolService.update] server error', errorMessage);
        return { data: null, error: new Error(errorMessage) };
      }

      // Success case: function returned data (school object) with an id field
      if (response?.data && typeof response.data === 'object' && 'id' in response.data) {
        console.debug('[schoolService.update] success', { id: (response.data as any).id });
        return { data: response.data as School, error: null };
      }

      // Fallback: if we have data but no id (unexpected), treat as error
      return { data: null, error: new Error('Unexpected response format from update function') };
    } catch (err: any) {
      let message = err?.message || 'Update school function failed';
      // Try to extract more details from the error
      if (err?.context?.body) {
        try {
          const body = typeof err.context.body === 'string' ? JSON.parse(err.context.body) : err.context.body;
          if (body?.error) {
            message = body.error;
          }
        } catch {}
      }
      console.error('[schoolService.update] caught error', err);
      return { data: null, error: new Error(message) };
    }
  },

  async remove(id: string) {
    const { data, error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id)
      .select()
      .single();

    return { data: data as School | null, error };
  },

  async uploadLogo(uri: string) {
    if (!uri) {
      throw new Error('Logo URI is required');
    }

    // Get session for authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // Fetch the image file
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Helper function to extract error message from various error formats
      const extractErrorMessage = (error: any, data?: any): string => {
        // Try to get error from response data first
        if (data) {
          if (typeof data === 'object') {
            if ('error' in data) return String(data.error);
            if ('message' in data) return String(data.message);
          }
          if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) return String(parsed.error);
              if (parsed.message) return String(parsed.message);
            } catch {
              return data;
            }
          }
        }

        // Try to get error from error object's context/response
        if (error) {
          // Check error.context.body (Supabase FunctionsHttpError)
          if (error.context?.body) {
            try {
              const body = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body) 
                : error.context.body;
              if (body?.error) return String(body.error);
              if (body?.message) return String(body.message);
            } catch {}
          }

          // Check error.response (if available)
          if (error.response) {
            try {
              const response = typeof error.response === 'string'
                ? JSON.parse(error.response)
                : error.response;
              if (response?.error) return String(response.error);
              if (response?.message) return String(response.message);
              if (response?.data?.error) return String(response.data.error);
            } catch {}
          }

          // Check error.message
          if (error.message && error.message !== 'Edge Function returned a non-2xx status code') {
            return error.message;
          }

          // Check error.status and provide context
          if (error.status) {
            return `Upload failed with status ${error.status}`;
          }
        }

        return 'Failed to upload logo';
      };

      // Call Edge Function to upload logo (bypasses RLS using service role)
      let functionResponse: any;
      try {
        functionResponse = await supabase.functions.invoke('upload_logo', {
          body: {
            imageData: base64,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (invokeErr: any) {
        // Supabase may throw an error for non-2xx responses
        const errorMessage = extractErrorMessage(invokeErr, invokeErr?.data || invokeErr?.context?.body);
        console.error('[schoolService.uploadLogo] Function invocation error', {
          error: invokeErr,
          message: invokeErr?.message,
          status: invokeErr?.status,
          context: invokeErr?.context,
          data: invokeErr?.data,
          extractedMessage: errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Check for error in response object
      if (functionResponse.error) {
        const errorMessage = extractErrorMessage(functionResponse.error, functionResponse.data);
        console.error('[schoolService.uploadLogo] Edge Function error', {
          error: functionResponse.error,
          data: functionResponse.data,
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Check response status (non-2xx) - Supabase may set error even for non-2xx
      const status = (functionResponse as any)?.status ?? (functionResponse as any)?.res?.status;
      if (status && status >= 400) {
        const errorMessage = extractErrorMessage(null, functionResponse.data);
        console.error('[schoolService.uploadLogo] Non-2xx status', { 
          status, 
          data: functionResponse.data,
          errorMessage 
        });
        throw new Error(errorMessage);
      }

      // Extract URL from response
      if (functionResponse.data) {
        if (typeof functionResponse.data === 'object' && 'url' in functionResponse.data) {
          const url = functionResponse.data.url;
          console.debug('[schoolService.uploadLogo] uploaded via Edge Function', { url });
          return url;
        }
        
        // Try to parse if string
        if (typeof functionResponse.data === 'string') {
          try {
            const parsed = JSON.parse(functionResponse.data);
            if (parsed.url) {
              console.debug('[schoolService.uploadLogo] uploaded via Edge Function', { url: parsed.url });
              return parsed.url;
            }
          } catch {
            // Not JSON, continue to error
          }
        }
      }

      console.error('[schoolService.uploadLogo] Unexpected response format', { 
        data: functionResponse.data,
        error: functionResponse.error,
        status 
      });
      throw new Error('Unexpected response format from upload function');
    } catch (err: any) {
      console.error('[schoolService.uploadLogo] caught error', err);
      throw err instanceof Error ? err : new Error('Failed to upload logo');
    }
  },

  async createWithAdmin({ name, code, admin, logoUri, postalAddress, contactPhone, contactEmail }: CreateWithAdminParams) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return { data: null, error: new Error('Not authenticated') };
    }

    let logoUrl: string | undefined;
    if (logoUri) {
      try {
        logoUrl = await this.uploadLogo(logoUri);
      } catch (error) {
        return { data: null, error };
      }
    }

    try {
      const response = await supabase.functions.invoke('create_school_with_admin', {
        body: {
          name,
          code: code || null,
          logo_url: logoUrl,
          postal_address: postalAddress || null,
          contact_phone: contactPhone || null,
          contact_email: contactEmail || null,
          admin_name: admin.name,
          admin_email: admin.email,
          admin_password: admin.password,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) {
        // Try to extract error message from response data
        let errorMessage = response.error.message || 'Failed to create school';
        if (response.data && typeof response.data === 'object' && 'error' in response.data) {
          errorMessage = (response.data as any).error || errorMessage;
        }
        return { data: null, error: new Error(errorMessage) };
      }

      return { data: response.data, error: null };
    } catch (fnErr: any) {
      let message = fnErr?.message || 'Create school function failed';
      try {
        // Try to extract error from response body
        if (fnErr?.context?.body) {
          const body = typeof fnErr.context.body === 'string' ? JSON.parse(fnErr.context.body) : fnErr.context.body;
          if (body?.error) {
            message = body.error;
          }
        } else if (fnErr?.response) {
          const resp = fnErr.response;
          if (typeof resp === 'string') {
            try {
              const parsed = JSON.parse(resp);
              message = parsed.error || message;
            } catch {
              message += ' - ' + resp;
            }
          } else if (resp?.data?.error) {
            message = resp.data.error;
          } else if (resp?.text) {
            const txt = typeof resp.text === 'function' ? await resp.text() : resp.text;
            try {
              const parsed = JSON.parse(txt);
              message = parsed.error || message;
            } catch {
              message += ' - ' + (txt || JSON.stringify(resp));
            }
          }
        }
      } catch (e) {
        // ignore parsing errors
      }
      return { data: null, error: new Error(message) };
    }
  },
};


