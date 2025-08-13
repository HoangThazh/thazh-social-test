// utils/supabase.js - Cấu hình Supabase client

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

// Tạo mock client cho demo
const createMockClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback) => {
        callback('SIGNED_OUT', null);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode - authentication disabled' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Demo mode - authentication disabled' } })
    },
    from: (table) => ({
      select: (columns = '*') => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        limit: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        or: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        ilike: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ neq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
        gte: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
        neq: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        in: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://demo-image-url.jpg' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} })
    }),
    removeChannel: () => {}
  };
};

// Kiểm tra xem có phải demo mode không
const isDemoMode = supabaseUrl.includes('demo') || supabaseAnonKey.includes('demo');

const supabase = isDemoMode ? createMockClient() : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

