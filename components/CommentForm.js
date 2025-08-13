// components/CommentForm.js - Component form thêm comment

import { useState } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';
import supabase from '../utils/supabase';

export default function CommentForm({ postId, currentUser, onCommentAdded }) {
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // text, image, audio

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioRecorded = (audioBlob) => {
    setAudio(audioBlob);
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioPreview(audioUrl);
    } else {
      setAudioPreview(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const removeAudio = () => {
    setAudio(null);
    setAudioPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || (!comment.trim() && !image && !audio)) return;

    setLoading(true);
    try {
      let imageUrl = null;
      let audioUrl = null;

      // Upload hình ảnh nếu có
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `comment-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      // Upload âm thanh nếu có
      if (audio) {
        const fileName = `${Math.random()}.wav`;
        const filePath = `comment-audio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filePath, audio);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('audio')
          .getPublicUrl(filePath);

        audioUrl = data.publicUrl;
      }

      // Tạo comment
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            content: comment,
            post_id: postId,
            user_id: currentUser.id,
            image_url: imageUrl,
            audio_url: audioUrl
          }
        ])
        .select('*, profiles:user_id(username)');

      if (error) throw error;

      // Reset form
      setComment('');
      setImage(null);
      setImagePreview(null);
      setAudio(null);
      setAudioPreview(null);
      setActiveTab('text');

      // Gọi callback để cập nhật danh sách comment
      onCommentAdded(data[0]);

    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Có lỗi xảy ra khi thêm bình luận.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-4 text-bluesky-secondary">
        <p>Vui lòng đăng nhập để bình luận.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-bluesky-light pt-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent resize-none"
            placeholder="Viết bình luận..."
            rows="3"
          />
        </div>

        {/* Media Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded text-sm font-medium ${
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
              className={`px-3 py-1 rounded text-sm font-medium ${
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
              className={`px-3 py-1 rounded text-sm font-medium ${
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
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-bluesky-light rounded-md focus:outline-none focus:ring-2 focus:ring-bluesky-accent text-sm"
              />
              
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-48 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audio Recording */}
          {activeTab === 'audio' && (
            <div className="space-y-3">
              <AudioRecorder 
                onAudioRecorded={handleAudioRecorded}
                disabled={loading}
              />
              
              {audioPreview && (
                <div className="relative">
                  <AudioPlayer audioUrl={audioPreview} />
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || (!comment.trim() && !image && !audio)}
            className="bg-bluesky-accent text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang gửi...' : 'Bình luận'}
          </button>
        </div>
      </form>
    </div>
  );
}

