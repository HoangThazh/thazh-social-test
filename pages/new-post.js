// pages/new-post.js - Trang tạo bài viết mới

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';
import supabase from '../utils/supabase';

export default function NewPost() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState({
    title: '',
    content: '',
    image: null,
    audio: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // text, image, audio
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

  const handleInputChange = (e) => {
    setPost({ ...post, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPost({ ...post, image: file });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioRecorded = (audioBlob) => {
    setPost({ ...post, audio: audioBlob });
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioPreview(audioUrl);
    } else {
      setAudioPreview(null);
    }
  };

  const removeImage = () => {
    setPost({ ...post, image: null });
    setImagePreview(null);
  };

  const removeAudio = () => {
    setPost({ ...post, audio: null });
    setAudioPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    if (!post.title.trim() || !post.content.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung bài viết.');
      return;
    }
    
    setLoading(true);
    
    try {
      let imageUrl = null;
      let audioUrl = null;

      // Upload image if exists
      if (post.image) {
        const imageExt = post.image.name.split('.').pop();
        const imageName = `${user.id}-${Date.now()}.${imageExt}`;
        
        const { data: imageData, error: imageError } = await supabase.storage
          .from('post-images')
          .upload(imageName, post.image);

        if (imageError) throw imageError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(imageName);

        imageUrl = publicUrl;
      }

      // Upload audio if exists
      if (post.audio) {
        const audioName = `${user.id}-${Date.now()}.wav`;
        
        const { data: audioData, error: audioError } = await supabase.storage
          .from('post-audio')
          .upload(audioName, post.audio);

        if (audioError) throw audioError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-audio')
          .getPublicUrl(audioName);

        audioUrl = publicUrl;
      }

      // Create post
      const { data, error } = await supabase
        .from('posts')
        .insert([
          { 
            title: post.title, 
            content: post.content,
            image_url: imageUrl,
            audio_url: audioUrl,
            user_id: user.id
          }
        ])
        .select();
        
      if (error) throw error;
      
      router.push('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra khi đăng bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bluesky-accent mx-auto mb-4"></div>
          <p className="text-bluesky-secondary">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-6">
          <h1 className="text-2xl font-bold mb-6 text-bluesky-primary">Tạo bài viết mới</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-bluesky-secondary mb-2">Tiêu đề</label>
              <input
                type="text"
                name="title"
                value={post.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                placeholder="Nhập tiêu đề bài viết"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-bluesky-secondary mb-2">Nội dung</label>
              <textarea
                name="content"
                value={post.content}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                placeholder="Chia sẻ điều gì đó..."
                rows="6"
                required
              />
            </div>

            {/* Media Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'text'
                      ? 'bg-bluesky-accent text-white'
                      : 'bg-gray-100 text-bluesky-secondary hover:bg-gray-200'
                  }`}
                >
                  Văn bản
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'image'
                      ? 'bg-bluesky-accent text-white'
                      : 'bg-gray-100 text-bluesky-secondary hover:bg-gray-200'
                  }`}
                >
                  Hình ảnh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audio')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'audio'
                      ? 'bg-bluesky-accent text-white'
                      : 'bg-gray-100 text-bluesky-secondary hover:bg-gray-200'
                  }`}
                >
                  Âm thanh
                </button>
              </div>

              {/* Image Upload */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-bluesky-secondary mb-2">Thêm hình ảnh</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent"
                    />
                  </div>
                  
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-96 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Recording */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-bluesky-secondary mb-2">Ghi âm</label>
                    <AudioRecorder 
                      onAudioRecorded={handleAudioRecorded}
                      disabled={loading}
                    />
                  </div>
                  
                  {audioPreview && (
                    <div className="relative">
                      <AudioPlayer audioUrl={audioPreview} />
                      <button
                        type="button"
                        onClick={removeAudio}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-bluesky-accent text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang đăng...' : 'Đăng bài'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-bluesky-light text-bluesky-secondary rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

