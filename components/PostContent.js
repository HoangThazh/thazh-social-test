// components/PostContent.js - Component hiển thị nội dung bài viết với hashtag

import Link from 'next/link';
import { linkifyHashtags } from '../utils/hashtag';

export default function PostContent({ content, className = '' }) {
  if (!content) return null;

  // Tách văn bản thành các phần (text và hashtag)
  const parts = content.split(/(#[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const hashtag = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              href={`/hashtag/${hashtag}`}
              className="text-threads-accent hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

