// utils/hashtag.js - Utility functions cho hashtag

// Trích xuất hashtag từ văn bản
export function extractHashtags(text) {
  if (!text) return [];
  
  const hashtagRegex = /#[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Loại bỏ dấu # và chuyển về lowercase, loại bỏ trùng lặp
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

// Chuyển đổi hashtag thành link
export function linkifyHashtags(text) {
  if (!text) return text;
  
  const hashtagRegex = /#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  
  return text.replace(hashtagRegex, (match, hashtag) => {
    return `<a href="/hashtag/${hashtag.toLowerCase()}" class="text-threads-accent hover:underline">${match}</a>`;
  });
}

// Highlight hashtag trong văn bản
export function highlightHashtags(text) {
  if (!text) return text;
  
  const hashtagRegex = /#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  
  return text.replace(hashtagRegex, (match) => {
    return `<span class="text-threads-accent font-medium">${match}</span>`;
  });
}

// Validate hashtag
export function isValidHashtag(hashtag) {
  if (!hashtag) return false;
  
  const hashtagRegex = /^[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+$/;
  return hashtagRegex.test(hashtag) && hashtag.length >= 2 && hashtag.length <= 50;
}

