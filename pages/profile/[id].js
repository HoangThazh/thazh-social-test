// pages/profile/[id].js - Trang cá nhân người dùng

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import supabase from '../../utils/supabase';

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Lấy thông tin người dùng hiện tại
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };

    getCurrentUser();
    
    // Theo dõi thay đổi trạng thái đăng nhập
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      // Lấy thông tin người dùng
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error.message);
      setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      // Lấy danh sách bài viết của người dùng này
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const isCurrentUserProfile = currentUser?.id === id;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <p className="text-gray-500">Đang tải thông tin người dùng...</p>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Không tìm thấy người dùng này.'}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            
            <div className="ml-6">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-600">Thành viên từ: {formatDate(profile.created_at)}</p>
              
              {isCurrentUserProfile && (
                <p className="text-sm text-gray-500 mt-2">Đây là trang cá nhân của bạn.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Bài viết của {isCurrentUserProfile ? 'bạn' : profile.username}</h2>
          
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser} 
              />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                {isCurrentUserProfile
                  ? 'Bạn chưa có bài viết nào.'
                  : `${profile.username} chưa có bài viết nào.`}
              </p>
              
              {isCurrentUserProfile && (
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mt-4"
                >
                  Tạo bài viết mới
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}