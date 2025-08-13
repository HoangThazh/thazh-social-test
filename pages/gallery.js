// pages/gallery.js - Trang thư viện hình ảnh

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import supabase from '../utils/supabase';

export default function Gallery() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, recent, popular

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
    fetchImagePosts();
  }, [selectedCategory]);

  const fetchImagePosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          image_url,
          created_at,
          likes_count,
          comments_count,
          user_id,
          profiles:user_id (username)
        `)
        .not('image_url', 'is', null);

      // Áp dụng bộ lọc
      if (selectedCategory === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (selectedCategory === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      setPosts(data || []);
    } catch (error) {
      console.error('Lỗi khi tải hình ảnh:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hôm nay';
    if (diffInDays === 1) return 'Hôm qua';
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-threads-primary">Thư viện hình ảnh</h1>
          
          {/* Bộ lọc */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-threads-accent text-white'
                  : 'bg-gray-100 text-threads-secondary hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedCategory('recent')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'recent'
                  ? 'bg-threads-accent text-white'
                  : 'bg-gray-100 text-threads-secondary hover:bg-gray-200'
              }`}
            >
              Mới nhất
            </button>
            <button
              onClick={() => setSelectedCategory('popular')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'popular'
                  ? 'bg-threads-accent text-white'
                  : 'bg-gray-100 text-threads-secondary hover:bg-gray-200'
              }`}
            >
              Phổ biến
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-threads-secondary">Đang tải hình ảnh...</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="group">
                <Link href={`/image/${post.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={post.image_url}
                      alt={post.title || 'Image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* Overlay với thông tin */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end">
                      <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Thông tin bài viết */}
                <div className="mt-2">
                  <div className="flex items-center text-sm text-threads-secondary">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-threads-primary mr-2">
                      {post.profiles?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="mr-2">{post.profiles?.username || 'Người dùng'}</span>
                    <span>•</span>
                    <span className="ml-2">{formatDate(post.created_at)}</span>
                  </div>
                  
                  {post.title && (
                    <h3 className="text-sm font-medium text-threads-primary mt-1 line-clamp-2">
                      {post.title}
                    </h3>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-threads-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-threads-secondary mb-4">Chưa có hình ảnh nào.</p>
            <Link href="/new-post" className="bg-threads-accent text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Đăng hình ảnh đầu tiên
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

