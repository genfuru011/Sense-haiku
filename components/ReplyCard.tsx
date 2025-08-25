import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HaikuPost, ReactionId } from '../types';
import { ReplyIcon } from './icons/ReplyIcon';
import { QuoteIcon } from './icons/QuoteIcon';

interface ReplyCardProps {
  reply: HaikuPost;
  onReact: (postId: string, reactionId: ReactionId) => void;
  onReply?: (reply: HaikuPost) => void;
  addPost?: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
  depth?: number; // ネストの深さ（1から開始）
}

const ReplyCard: React.FC<ReplyCardProps> = ({ reply, onReact, onReply, addPost, depth = 1 }) => {
  const [animatingReactionId, setAnimatingReactionId] = useState<ReactionId | null>(null);
  const [showNestedReplies, setShowNestedReplies] = useState(false);
  const navigate = useNavigate();

  const handleReactionClick = (reactionId: ReactionId) => {
    onReact(reply.id, reactionId);
    setAnimatingReactionId(reactionId);
    setTimeout(() => {
      setAnimatingReactionId(null);
    }, 400); // Match animation duration in CSS
  };

  return (
    <div className="pt-4 mt-4 border-t border-slate-200 ml-4 border-l-2 border-slate-100 pl-4">
      <div className="flex items-start cursor-pointer" onClick={() => navigate(`/post/${reply.id}`)}>
        <img src={reply.authorAvatar} alt={reply.author} className="w-10 h-10 rounded-full mr-3 border-2 border-slate-200" />
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <p className="font-bold text-slate-800 text-sm">{reply.author}</p>
            <p className="text-xs text-slate-500 ml-3">{new Date(reply.timestamp).toLocaleString('ja-JP')}</p>
          </div>
          <p className="font-serif text-slate-800 text-lg">{reply.line1}　{reply.line2}　{reply.line3}</p>
          
          {/* 返信・引用ボタン */}
          <div className="flex items-center mt-2 space-x-4">
            {/* Reply Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onReply?.(reply); }} 
              className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors group" 
              aria-label="返信する" 
              title="返信する"
            >
              <div className="p-1 rounded-full group-hover:bg-accent-bg transition-colors">
                <div className="h-4 w-4"><ReplyIcon/></div>
              </div>
            </button>
            
            {/* Quote Button */}
            <Link 
              to={`/new?quote=${reply.id}`} 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors group" 
              aria-label="引用して詠む" 
              title="引用して詠む"
            >
              <div className="p-1 rounded-full group-hover:bg-accent-bg transition-colors">
                <div className="h-4 w-4"><QuoteIcon/></div>
              </div>
            </Link>
            
            {/* Reaction Buttons */}
            {reply.reactions.map((reaction) => {
              const isReacted = !!reaction.isReacted;
              const buttonClasses = `flex items-center gap-1.5 transition-colors group ${
                isReacted ? 'text-primary' : 'text-slate-500 hover:text-primary'
              }`;
              const iconContainerClasses = `p-1 rounded-full transition-colors ${
                isReacted ? 'bg-accent-bg' : 'bg-transparent group-hover:bg-accent-bg'
              }`;
              const animationClass = animatingReactionId === reaction.id ? 'animate-pop' : '';
              const countClasses = `font-semibold text-xs transition-colors ${
                isReacted ? 'text-primary' : 'text-slate-500'
              }`;

              return (
                <button
                  key={reaction.id}
                  onClick={(e) => { e.stopPropagation(); handleReactionClick(reaction.id); }}
                  className={buttonClasses}
                  aria-pressed={isReacted}
                  aria-label={`"${reaction.label}"にリアクションする。現在のカウント: ${reaction.count}`}
                  title={reaction.label}
                >
                  <div className={`${iconContainerClasses} ${animationClass}`}>
                    <div className="h-4 w-4">{reaction.icon}</div>
                  </div>
                  <span className={countClasses}>{reaction.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* ネストした返信の表示（2階層まで） */}
      {(reply as any).replies && (reply as any).replies.length > 0 && depth < 2 && (
        <div className="mt-3">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowNestedReplies(!showNestedReplies); }} 
            className="text-xs text-primary font-semibold hover:underline"
          >
            {showNestedReplies ? '返歌を隠す' : `${(reply as any).replies.length}件の返歌を表示`}
          </button>
          {showNestedReplies && (
            <div className="mt-2 space-y-2">
              {(reply as any).replies.map((nestedReply: HaikuPost) => (
                <ReplyCard 
                  key={nestedReply.id} 
                  reply={nestedReply} 
                  onReact={onReact} 
                  onReply={onReply}
                  addPost={addPost}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 3階層以降は詳細ページへのリンクを表示 */}
      {(reply as any).replies && (reply as any).replies.length > 0 && depth >= 2 && (
        <div className="mt-3">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/post/${reply.id}`); }} 
            className="text-xs text-primary font-semibold hover:underline"
          >
            {`${(reply as any).replies.length}件の返歌を詳細で確認`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReplyCard;