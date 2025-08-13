// pages/chat/new.js - Trang tạo cuộc trò chuyện mới

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import supabase from '../../utils/supabase';

export default function NewChat() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id) // Không hiển thị chính mình
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm người dùng:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (otherUserId) => {
    try {
      // Kiểm tra xem cuộc trò chuyện đã tồn tại chưa
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingConv) {
        // Cuộc trò chuyện đã tồn tại, chuyển đến đó
        router.push(`/chat/${existingConv.id}`);
        return;
      }

      // Tạo cuộc trò chuyện mới
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            participant1_id: user.id,
            participant2_id: otherUserId,
            last_message_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error.message);
      alert('Có lỗi xảy ra khi tạo cuộc trò chuyện.');
    }
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
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-threads-secondary hover:text-threads-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-threads-primary">Tin nhắn mới</h1>
        </div>

        {/* Tìm kiếm người dùng */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-threads-light rounded-full focus:outline-none focus:ring-1 focus:ring-threads-accent"
              placeholder="Tìm kiếm người dùng..."
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-4 text-threads-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Kết quả tìm kiếm */}
        {loading ? (
          <p className="text-center py-8 text-threads-secondary">Đang tìm kiếm...</p>
        ) : searchResults.length > 0 ? (
          <div className="bg-white rounded-lg border border-threads-light">
            {searchResults.map((profile, index) => (
              <button
                key={profile.id}
                onClick={() => startConversation(profile.id)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  index !== searchResults.length - 1 ? 'border-b border-threads-light' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-threads-primary">{profile.username}</h3>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery && !loading ? (
          <p className="text-center py-8 text-threads-secondary">Không tìm thấy người dùng nào.</p>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-threads-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-threads-secondary">Tìm kiếm người dùng để bắt đầu trò chuyện.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

