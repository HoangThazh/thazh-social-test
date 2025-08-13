// pages/search.js - Trang tìm kiếm

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import supabase from '../utils/supabase';
import { extractHashtags } from '../utils/hashtag';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // posts, users, hashtags
  const [trendingHashtags, setTrendingHashtags] = useState([]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getCurrentUser();
    fetchTrendingHashtags();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      // Lấy các bài viết gần đây để tìm hashtag trending
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 ngày qua
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Trích xuất và đếm hashtag
      const hashtagCount = {};
      data?.forEach(post => {
        const hashtags = extractHashtags(post.content);
        hashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      });

      // Sắp xếp theo số lượng và lấy top 10
      const trending = Object.entries(hashtagCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      setTrendingHashtags(trending);
    } catch (error) {
      console.error('Lỗi khi tải hashtag trending:', error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSearchResults(data || []);
      } else if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${searchQuery}%`)
          .order('username');

        if (error) throw error;
        setSearchResults(data || []);
      } else if (activeTab === 'hashtags') {
        // Tìm kiếm hashtag
        const cleanQuery = searchQuery.replace('#', '').toLowerCase();
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .ilike('content', `%#${cleanQuery}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Lọc chính xác các bài viết có hashtag
        const filteredPosts = data?.filter(post => {
          const hashtagRegex = new RegExp(`#${cleanQuery}\\b`, 'i');
          return hashtagRegex.test(post.content);
        }) || [];

        setSearchResults(filteredPosts);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-threads-primary">Tìm kiếm</h1>

        {/* Form tìm kiếm */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-threads-light rounded-full focus:outline-none focus:ring-1 focus:ring-threads-accent"
              placeholder="Tìm kiếm bài viết, người dùng, hashtag..."
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-4 text-threads-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Hashtag trending (hiển thị khi chưa tìm kiếm) */}
        {!searchQuery && trendingHashtags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-threads-primary">Hashtag thịnh hành</h2>
            <div className="bg-white rounded-lg border border-threads-light p-4">
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/hashtag/${tag}`}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
                  >
                    <span className="text-threads-accent font-medium">#{tag}</span>
                    <span className="ml-2 text-threads-secondary">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab điều hướng */}
        <div className="flex border-b border-threads-light mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'posts'
                ? 'text-threads-accent border-b-2 border-threads-accent'
                : 'text-threads-secondary hover:text-threads-primary'
            }`}
          >
            Bài viết
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'text-threads-accent border-b-2 border-threads-accent'
                : 'text-threads-secondary hover:text-threads-primary'
            }`}
          >
            Người dùng
          </button>
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'hashtags'
                ? 'text-threads-accent border-b-2 border-threads-accent'
                : 'text-threads-secondary hover:text-threads-primary'
            }`}
          >
            Hashtag
          </button>
        </div>

        {/* Kết quả tìm kiếm */}
        {loading ? (
          <p className="text-center py-8 text-threads-secondary">Đang tìm kiếm...</p>
        ) : searchResults.length > 0 ? (
          <div>
            {activeTab === 'posts' && (
              searchResults.map(post => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))
            )}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {searchResults.map(profile => (
                  <div key={profile.id} className="bg-white rounded-lg border border-threads-light p-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
                        {profile.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <Link href={`/profile/${profile.id}`} className="font-medium text-threads-primary hover:underline">
                          {profile.username}
                        </Link>
                        <p className="text-sm text-threads-secondary">{profile.bio || 'Chưa có tiểu sử'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'hashtags' && (
              searchResults.map(post => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))
            )}
          </div>
        ) : searchQuery && !loading ? (
          <p className="text-center py-8 text-threads-secondary">Không tìm thấy kết quả nào.</p>
        ) : (
          <p className="text-center py-8 text-threads-secondary">Nhập từ khóa để tìm kiếm.</p>
        )}
      </div>
    </Layout>
  );
}

