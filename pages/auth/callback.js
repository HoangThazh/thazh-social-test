// pages/auth/callback.js - Callback page for OAuth authentication

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../utils/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          // Authentication successful, redirect to home
          router.push('/');
        } else {
          // No session found, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bluesky-accent mx-auto mb-4"></div>
        <p className="text-bluesky-secondary">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

