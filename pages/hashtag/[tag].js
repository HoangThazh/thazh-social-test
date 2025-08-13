// pages/hashtag/[tag].js - Trang chi tiết hashtag

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import supabase from '../../utils/supabase';

export default function HashtagDetail() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hashtagStats, setHashtagStats] = useState(null);
  const router = useRouter();
  const { tag } = router.query;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (tag) {
      fetchHashtagPosts();
      fetchHashtagStats();
    }
  }, [tag]);

  const fetchHashtagPosts = async () => {
    try {
      setLoading(true);
      
      // Tìm kiếm bài viết chứa hashtag
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .ilike('content', `%#${tag}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Lọc chính xác các bài viết có hashtag (tránh false positive)
      const filteredPosts = data?.filter(post => {
        const hashtagRegex = new RegExp(`#${tag}\\b`, 'i');
        return hashtagRegex.test(post.content);
      }) || [];

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Lỗi khi tải bài viết hashtag:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHashtagStats = async () => {
    try {
      // Đếm số lượng bài viết có hashtag này
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .ilike('content', `%#${tag}%`);

      if (error) throw error;

      // Lọc chính xác
      const filteredPosts = data?.filter(post => {
        const hashtagRegex = new RegExp(`#${tag}\\b`, 'i');
        return hashtagRegex.test(post.content);
      }) || [];

      setHashtagStats({
        postCount: filteredPosts.length
      });
    } catch (error) {
      console.error('Lỗi khi tải thống kê hashtag:', error.message);
    }
  };

  if (!tag) {
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
        {/* Header hashtag */}
        <div className="bg-white rounded-lg border border-threads-light p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-threads-primary mb-2">
              #{tag}
            </h1>
            {hashtagStats && (
              <p className="text-threads-secondary">
                {hashtagStats.postCount} bài viết
              </p>
            )}
          </div>
        </div>

        {/* Danh sách bài viết */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-threads-primary">Bài viết gần đây</h2>
          
          {loading ? (
            <p className="text-center py-8 text-threads-secondary">Đang tải bài viết...</p>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={user} 
              />
            ))
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-threads-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <p className="text-threads-secondary mb-4">Chưa có bài viết nào với hashtag này.</p>
              <p className="text-sm text-threads-secondary">
                Hãy là người đầu tiên sử dụng #{tag} trong bài viết của bạn!
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

