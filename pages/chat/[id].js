// pages/chat/[id].js - Trang chi tiết cuộc trò chuyện

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import supabase from '../../utils/supabase';

export default function ChatDetail() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const { id } = router.query;

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
    if (user && id) {
      fetchConversation();
      fetchMessages();
      subscribeToMessages();
    }
  }, [user, id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant1_id,
          participant2_id,
          profiles!conversations_participant1_id_fkey(id, username),
          profiles!conversations_participant2_id_fkey(id, username)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Kiểm tra quyền truy cập
      if (data.participant1_id !== user.id && data.participant2_id !== user.id) {
        router.push('/chat');
        return;
      }

      const otherParticipant = data.participant1_id === user.id 
        ? data.profiles[1] || data.profiles[0]
        : data.profiles[0] || data.profiles[1];

      setConversation({
        ...data,
        otherParticipant
      });
    } catch (error) {
      console.error('Lỗi khi tải cuộc trò chuyện:', error.message);
      router.push('/chat');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          image_url,
          sender_id,
          created_at,
          profiles(id, username)
        `)
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:conversation_id=eq.${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        async (payload) => {
          // Lấy thông tin người gửi
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: senderData
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: id,
            sender_id: user.id,
            content: newMessage.trim()
          }
        ]);

      if (error) throw error;

      // Cập nhật last_message trong conversation
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', id);

      setNewMessage('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error.message);
      alert('Có lỗi xảy ra khi gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || !conversation) {
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
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-threads-light bg-white">
          <button
            onClick={() => router.back()}
            className="mr-4 text-threads-secondary hover:text-threads-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-threads-primary">
            {conversation.otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="ml-3">
            <h1 className="font-medium text-threads-primary">
              {conversation.otherParticipant?.username || 'Người dùng'}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <p className="text-center py-8 text-threads-secondary">Đang tải tin nhắn...</p>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender_id === user.id
                        ? 'bg-threads-accent text-white'
                        : 'bg-white text-threads-primary border border-threads-light'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user.id ? 'text-blue-100' : 'text-threads-secondary'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-threads-secondary">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-threads-light">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-threads-light rounded-full focus:outline-none focus:ring-1 focus:ring-threads-accent"
              placeholder="Nhập tin nhắn..."
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-threads-accent text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

