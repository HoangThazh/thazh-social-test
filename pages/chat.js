// pages/chat.js - Trang chat chính

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import supabase from '../utils/supabase';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
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
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách cuộc trò chuyện của người dùng
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          updated_at,
          participant1_id,
          participant2_id,
          last_message,
          last_message_at,
          profiles!conversations_participant1_id_fkey(id, username),
          profiles!conversations_participant2_id_fkey(id, username)
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Xử lý dữ liệu để hiển thị
      const processedConversations = data?.map(conv => {
        const otherParticipant = conv.participant1_id === user.id 
          ? conv.profiles[1] || conv.profiles[0]
          : conv.profiles[0] || conv.profiles[1];
        
        return {
          ...conv,
          otherParticipant
        };
      }) || [];

      setConversations(processedConversations);
    } catch (error) {
      console.error('Lỗi khi tải cuộc trò chuyện:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes}p`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-threads-primary">Tin nhắn</h1>
          <Link href="/chat/new" className="bg-threads-accent text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
            Tin nhắn mới
          </Link>
        </div>

        {loading ? (
          <p className="text-center py-8 text-threads-secondary">Đang tải tin nhắn...</p>
        ) : conversations.length > 0 ? (
          <div className="bg-white rounded-lg border border-threads-light">
            {conversations.map((conversation, index) => (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={`block p-4 hover:bg-gray-50 transition-colors ${
                  index !== conversations.length - 1 ? 'border-b border-threads-light' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
                    {conversation.otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-threads-primary">
                        {conversation.otherParticipant?.username || 'Người dùng'}
                      </h3>
                      <span className="text-xs text-threads-secondary">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-threads-secondary mt-1 truncate">
                      {conversation.last_message || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-threads-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-threads-secondary mb-4">Chưa có cuộc trò chuyện nào.</p>
            <Link href="/chat/new" className="bg-threads-accent text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Bắt đầu trò chuyện
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

