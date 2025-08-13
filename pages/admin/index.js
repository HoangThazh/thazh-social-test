// pages/admin/index.js - Admin Dashboard

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import supabase from '../../utils/supabase';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    verifiedUsers: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is admin (in a real app, you'd check user role from database)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      setUser(session.user);
      await fetchDashboardData();
      setLoading(false);
    };

    checkAdminAccess();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch statistics
      const [usersCount, postsCount, commentsCount, verifiedCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }),
        supabase.from('comments').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }).eq('is_verified', true)
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalComments: commentsCount.count || 0,
        verifiedUsers: verifiedCount.count || 0
      });

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles:user_id(username)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentPosts(posts || []);

      // Fetch recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUsers(users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bluesky-accent mx-auto mb-4"></div>
          <p className="text-bluesky-secondary">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-bluesky-primary">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/users"
              className="bg-bluesky-accent text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Quản lý người dùng
            </Link>
            <Link
              href="/admin/posts"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Quản lý bài viết
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-bluesky-secondary">Tổng người dùng</p>
                <p className="text-2xl font-bold text-bluesky-primary">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-bluesky-secondary">Tổng bài viết</p>
                <p className="text-2xl font-bold text-bluesky-primary">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-bluesky-secondary">Tổng bình luận</p>
                <p className="text-2xl font-bold text-bluesky-primary">{stats.totalComments}</p>
              </div>
            </div>
          </div>

          <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-bluesky-secondary">Người dùng đã xác minh</p>
                <p className="text-2xl font-bold text-bluesky-primary">{stats.verifiedUsers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Posts */}
          <div className="bg-bluesky-card rounded-lg border border-bluesky-light">
            <div className="p-6 border-b border-bluesky-light">
              <h2 className="text-xl font-semibold text-bluesky-primary">Bài viết gần đây</h2>
            </div>
            <div className="p-6">
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                        {post.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-bluesky-primary truncate">
                          {post.title}
                        </p>
                        <p className="text-sm text-bluesky-secondary">
                          bởi {post.profiles?.username || 'Người dùng'} • {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-bluesky-secondary">Chưa có bài viết nào.</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-bluesky-card rounded-lg border border-bluesky-light">
            <div className="p-6 border-b border-bluesky-light">
              <h2 className="text-xl font-semibold text-bluesky-primary">Người dùng mới</h2>
            </div>
            <div className="p-6">
              {recentUsers.length > 0 ? (
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">
                          {user.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-bluesky-primary">
                            {user.username || 'Người dùng'}
                          </p>
                          <p className="text-sm text-bluesky-secondary">
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                      {user.is_verified && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-bluesky-secondary">Chưa có người dùng nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

