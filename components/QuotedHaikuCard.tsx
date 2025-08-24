import React from 'react';
import { HaikuPost } from '../types';

interface QuotedHaikuCardProps {
  post: HaikuPost;
}

const QuotedHaikuCard: React.FC<QuotedHaikuCardProps> = ({ post }) => {
  if (!post) return null;

  return (
    <div className="mt-4 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center text-sm text-slate-500 mb-2">
        <img src={post.authorAvatar} alt={post.author} className="w-5 h-5 rounded-full mr-2" />
        <span className="font-bold text-slate-700">{post.author}</span>
        <span className="ml-2 text-xs">{new Date(post.timestamp).toLocaleDateString('ja-JP')}</span>
      </div>
      <p className="font-serif text-slate-700">
        {post.line1}　{post.line2}　{post.line3}
      </p>
    </div>
  );
};

export default QuotedHaikuCard;