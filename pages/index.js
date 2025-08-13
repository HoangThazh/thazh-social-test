// pages/index.js - Trang chủ

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import supabase from '../utils/supabase';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*, profiles:user_id(username)') // Fetch username along with posts
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPosts(data || []);
      } catch (error) {
        console.error('Lỗi khi tải bài viết:', error.message);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
    fetchPosts();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleInputChange = (e) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          { 
            title: newPost.title, 
            content: newPost.content,
            user_id: user.id
          }
        ])
        .select('*, profiles:user_id(username)'); // Select with profile to get username immediately
        
      if (error) throw error;
      
      setPosts([data[0], ...posts]);
      setNewPost({ title: '', content: '' });
    } catch (error) {
      console.error('Lỗi khi đăng bài:', error.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto"> {/* Container đã được điều chỉnh trong globals.css */}
        <h1 className="text-3xl font-bold mb-6 text-center text-bluesky-primary">Thazh Social</h1>

        {user && (
          <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6 mb-8"> {/* Cập nhật styling */}
            <h2 className="text-xl font-semibold mb-4 text-bluesky-primary">Đăng bài viết mới</h2>
            <form onSubmit={handleSubmitPost}>
              <div className="mb-4">
                <label className="block text-bluesky-secondary mb-2">Tiêu đề</label>
                <input
                  type="text"
                  name="title"
                  value={newPost.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-1 focus:ring-bluesky-accent"
                  placeholder="Nhập tiêu đề bài viết"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-bluesky-secondary mb-2">Nội dung</label>
                <textarea
                  name="content"
                  value={newPost.content}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-1 focus:ring-bluesky-accent"
                  placeholder="Chia sẻ điều gì đó..."
                  rows="4"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-bluesky-accent text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Đăng bài
              </button>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-bluesky-primary">Bảng tin</h2>
          
          {loading ? (
            <p className="text-center py-8 text-bluesky-secondary">Đang tải bài viết...</p>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={user} 
              />
            ))
          ) : (
            <p className="text-center py-8 text-bluesky-secondary">Chưa có bài viết nào.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

