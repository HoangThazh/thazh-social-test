// components/PostCard.js - Component hiển thị bài viết

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostContent from './PostContent';
import VerifyBadge from './VerifyBadge';
import AudioPlayer from './AudioPlayer';
import supabase from '../utils/supabase';

export default function PostCard({ post, currentUser }) {
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUser) return;
      
      const { data } = await supabase
        .from('likes')
        .select()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id)
        .single();
      
      setIsLiked(!!data);
    };

    const getAuthor = async () => {
      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('id', post.user_id)
        .single();
      
      setAuthor(data);
    };

    checkLikeStatus();
    getAuthor();
  }, [post, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id);
      
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      await supabase
        .from('likes')
        .insert({ 
          post_id: post.id, 
          user_id: currentUser.id 
        });
      
      setLikes(likes + 1);
      setIsLiked(true);
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
    <div className="bg-bluesky-card rounded-lg border border-bluesky-light p-4 mb-4">
      {author && (
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-bluesky-primary">
            {author.username?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center space-x-1">
              <Link href={`/profile/${author.id}`} className="font-medium text-bluesky-primary hover:underline">
                {author.username || 'Người dùng'}
              </Link>
              <VerifyBadge userId={author.id} size="sm" />
            </div>
            <p className="text-xs text-bluesky-secondary">{formatDate(post.created_at)}</p>
          </div>
        </div>
      )}

      <Link href={`/posts/${post.id}`}>
        <h2 className="text-base font-semibold mb-1 text-bluesky-primary hover:text-bluesky-accent">{post.title}</h2>
      </Link>
      
      <PostContent content={post.content} className="text-sm text-bluesky-primary mb-4" />

      {/* Hiển thị hình ảnh nếu có */}
      {post.image_url && (
        <div className="mb-4">
          <Link href={`/image/${post.id}`} className="block">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-96 object-cover rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
            />
          </Link>
        </div>
      )}

      {/* Hiển thị âm thanh nếu có */}
      {post.audio_url && (
        <div className="mb-4">
          <AudioPlayer audioUrl={post.audio_url} />
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={handleLike}
          className={`flex items-center text-bluesky-secondary hover:text-bluesky-accent ${isLiked ? 'text-bluesky-accent' : ''}`}
          disabled={!currentUser}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likes}</span>
        </button>
        
        <Link href={`/posts/${post.id}`} className="text-bluesky-secondary hover:text-bluesky-accent flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments_count || 0}</span>
        </Link>

        {/* Nút chia sẻ */}
        <button className="flex items-center text-bluesky-secondary hover:text-bluesky-accent">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.4-2.88m-6.4 2.88l6.4 2.88m0-5.764a3 3 0 110-2.684m0 2.684a3 3 0 100-2.684" />
          </svg>
        </button>
      </div>
    </div>
  );
}

