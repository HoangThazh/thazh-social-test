// pages/image/[id].js - Trang chi tiết hình ảnh

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import PostCard from '../../components/PostCard';
import supabase from '../../utils/supabase';

export default function ImageDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState(null);
  const [error, setError] = useState(null);

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
    if (id) {
      fetchPost();
      fetchRelatedPosts();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      
      // Kiểm tra xem bài viết có hình ảnh không
      if (!post.image_url) {
        setError('Bài viết này không có hình ảnh.');
        return;
      }
      
      setPost(post);
      
      if (post) {
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', post.user_id)
          .single();
        
        if (authorError) throw authorError;
        setAuthor(authorData);
      }
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error.message);
      setError('Không thể tải hình ảnh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      // Lấy các bài viết khác có hình ảnh
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .not('image_url', 'is', null)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      
      setRelatedPosts(data || []);
    } catch (error) {
      console.error('Lỗi khi tải bài viết liên quan:', error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadImage = async () => {
    if (!post?.image_url) return;
    
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${post.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Lỗi khi tải hình ảnh:', error);
      alert('Không thể tải hình ảnh. Vui lòng thử lại.');
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <div className="mt-4 text-center">
            <Link href="/" className="text-threads-accent hover:underline">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-16 text-center">
          <p className="text-threads-secondary">Đang tải hình ảnh...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-threads-secondary hover:text-threads-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-threads-primary">Chi tiết hình ảnh</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hình ảnh chính */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-threads-light overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title || 'Post image'}
                className="w-full h-auto max-h-screen object-contain"
              />
            </div>
            
            {/* Nút hành động */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={downloadImage}
                  className="flex items-center px-4 py-2 bg-threads-accent text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tải xuống
                </button>
                
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-center px-4 py-2 border border-threads-light text-threads-primary rounded-md hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Xem bài viết
                </Link>
              </div>
            </div>
          </div>
          
          {/* Thông tin bài viết */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-threads-light p-6">
              {author && (
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
                    {author.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <Link href={`/profile/${author.id}`} className="font-medium text-threads-primary hover:underline">
                      {author.username || 'Người dùng'}
                    </Link>
                    <p className="text-sm text-threads-secondary">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              )}
              
              {post.title && (
                <h2 className="text-lg font-bold mb-3 text-threads-primary">{post.title}</h2>
              )}
              
              {post.content && (
                <p className="text-threads-primary mb-4">{post.content}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-threads-secondary">
                <span>{post.likes_count || 0} lượt thích</span>
                <span>{post.comments_count || 0} bình luận</span>
              </div>
            </div>
            
            {/* Hình ảnh liên quan */}
            {relatedPosts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-threads-primary">Hình ảnh khác</h3>
                <div className="grid grid-cols-2 gap-2">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/image/${relatedPost.id}`}
                      className="block aspect-square overflow-hidden rounded-lg border border-threads-light hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={relatedPost.image_url}
                        alt={relatedPost.title || 'Related image'}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

