// pages/posts/[id].js - Trang chi tiết bài viết

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import PostContent from '../../components/PostContent';
import CommentCard from '../../components/CommentCard';
import CommentForm from '../../components/CommentForm';
import supabase from '../../utils/supabase';

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [author, setAuthor] = useState(null);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

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
      fetchComments();
    }
  }, [id]);

  useEffect(() => {
    if (user && post) {
      checkLikeStatus();
    }
  }, [user, post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      
      setPost(post);
      setLikes(post.likes_count || 0);
      
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
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          image_url,
          user_id,
          created_at,
          likes_count
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error('Lỗi khi tải bình luận:', error.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('likes')
      .select()
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();
    
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) return;

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      await supabase
        .from('likes')
        .insert({ 
          post_id: post.id, 
          user_id: user.id 
        });
      
      setLikes(likes + 1);
      setIsLiked(true);
    }
  };

  const handleCommentAdded = (newComment) => {
    setComments([...comments, newComment]);
  };

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter(comment => comment.id !== commentId));
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

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-8">
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
        <div className="max-w-2xl mx-auto py-16 text-center">
          <p className="text-threads-secondary">Đang tải bài viết...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-threads-secondary hover:text-threads-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-threads-primary">Bài viết</h1>
        </div>
        
        {/* Bài viết chính */}
        <div className="bg-white rounded-lg border border-threads-light p-6 mb-4">
          {author && (
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
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
            <h2 className="text-xl font-bold mb-3 text-threads-primary">{post.title}</h2>
          )}
          
          <PostContent content={post.content} className="text-threads-primary mb-4" />

          {/* Hiển thị hình ảnh nếu có */}
          {post.image_url && (
            <div className="mb-4">
              <img
                src={post.image_url}
                alt="Post image"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-6 pt-4 border-t border-threads-light">
            <button 
              onClick={handleLike}
              className={`flex items-center text-threads-secondary hover:text-threads-accent ${isLiked ? 'text-threads-accent' : ''}`}
              disabled={!user}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likes}</span>
            </button>
            
            <div className="flex items-center text-threads-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comments.length}</span>
            </div>

            <button className="flex items-center text-threads-secondary hover:text-threads-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.4-2.88m-6.4 2.88l6.4 2.88m0-5.764a3 3 0 110-2.684m0 2.684a3 3 0 100-2.684" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Phần bình luận */}
        <div className="bg-white rounded-lg border border-threads-light">
          <div className="p-4 border-b border-threads-light">
            <h3 className="text-lg font-semibold text-threads-primary">
              Bình luận ({comments.length})
            </h3>
          </div>
          
          {loadingComments ? (
            <p className="text-center py-8 text-threads-secondary">Đang tải bình luận...</p>
          ) : comments.length > 0 ? (
            <div>
              {comments.map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  currentUser={user}
                  onDelete={handleCommentDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-threads-secondary">Chưa có bình luận nào.</p>
            </div>
          )}
          
          <CommentForm 
            postId={id} 
            currentUser={user} 
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>
    </Layout>
  );
}

