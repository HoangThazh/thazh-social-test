// components/CommentCard.js - Component hiển thị comment

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostContent from './PostContent';
import VerifyBadge from './VerifyBadge';
import AudioPlayer from './AudioPlayer';
import supabase from '../utils/supabase';

export default function CommentCard({ comment, currentUser, onDelete }) {
  const [author, setAuthor] = useState(null);
  const [likes, setLikes] = useState(comment.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const getAuthor = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', comment.user_id)
        .single();
      
      setAuthor(data);
    };

    const checkLikeStatus = async () => {
      if (!currentUser) return;
      
      const { data } = await supabase
        .from('comment_likes')
        .select()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id)
        .single();
      
      setIsLiked(!!data);
    };

    getAuthor();
    checkLikeStatus();
  }, [comment, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;

    if (isLiked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', currentUser.id);
      
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      await supabase
        .from('comment_likes')
        .insert({ 
          comment_id: comment.id, 
          user_id: currentUser.id 
        });
      
      setLikes(likes + 1);
      setIsLiked(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;

      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Có lỗi xảy ra khi xóa bình luận.');
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

  return (
    <div className="border-b border-bluesky-light pb-4 last:border-b-0">
      <div className="p-4">
        {author && (
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-bluesky-primary">
              {author.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center space-x-1">
                <Link href={`/profile/${author.id}`} className="font-medium text-bluesky-primary hover:underline">
                  {author.username || 'Người dùng'}
                </Link>
                <VerifyBadge userId={author.id} size="xs" />
              </div>
              <p className="text-xs text-bluesky-secondary">{formatDate(comment.created_at)}</p>
            </div>
            {currentUser && currentUser.id === comment.user_id && (
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Xóa
              </button>
            )}
          </div>
        )}

        <PostContent content={comment.content} className="text-sm text-bluesky-primary mb-3" />

        {/* Hiển thị hình ảnh nếu có */}
        {comment.image_url && (
          <div className="mb-3">
            <img
              src={comment.image_url}
              alt="Comment image"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}

        {/* Hiển thị âm thanh nếu có */}
        {comment.audio_url && (
          <div className="mb-3">
            <AudioPlayer audioUrl={comment.audio_url} />
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            className={`flex items-center text-bluesky-secondary hover:text-bluesky-accent ${isLiked ? 'text-bluesky-accent' : ''}`}
            disabled={!currentUser}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs">{likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

