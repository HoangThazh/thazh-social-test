// pages/activity.js - Trang hoạt động/thông báo

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import supabase from '../utils/supabase';

export default function Activity() {
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };

    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Lấy các hoạt động liên quan đến người dùng
      // Ví dụ: likes, comments trên bài viết của người dùng
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          user_id,
          posts!inner(id, title, user_id)
        `)
        .eq('posts.user_id', user.id)
        .neq('user_id', user.id) // Không lấy like của chính mình
        .order('created_at', { ascending: false })
        .limit(20);

      if (likesError) throw likesError;

      // Lấy thông tin người dùng đã like
      const userIds = [...new Set(likesData?.map(like => like.user_id) || [])];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      // Kết hợp dữ liệu
      const activitiesWithUsers = likesData?.map(like => ({
        ...like,
        type: 'like',
        user: usersData?.find(u => u.id === like.user_id)
      })) || [];

      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Lỗi khi tải hoạt động:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-threads-secondary">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-threads-primary">Hoạt động</h1>

        {loading ? (
          <p className="text-center py-8 text-threads-secondary">Đang tải hoạt động...</p>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="bg-white rounded-lg border border-threads-light p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-threads-primary">
                    {activity.user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      {activity.type === 'like' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                      <p className="text-threads-primary">
                        <span className="font-medium">{activity.user?.username || 'Người dùng'}</span>
                        {activity.type === 'like' && ' đã thích bài viết của bạn'}
                      </p>
                    </div>
                    {activity.posts && (
                      <p className="text-sm text-threads-secondary mt-1">
                        "{activity.posts.title || 'Bài viết'}"
                      </p>
                    )}
                    <p className="text-xs text-threads-secondary mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-threads-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-threads-secondary">Chưa có hoạt động nào.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

