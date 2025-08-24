import React, { useState } from 'react';
import { HaikuPost, ReactionId } from '../types';

interface ReplyCardProps {
  reply: HaikuPost;
  onReact: (postId: string, reactionId: ReactionId) => void;
}

const ReplyCard: React.FC<ReplyCardProps> = ({ reply, onReact }) => {
  const [animatingReactionId, setAnimatingReactionId] = useState<ReactionId | null>(null);

  const handleReactionClick = (reactionId: ReactionId) => {
    onReact(reply.id, reactionId);
    setAnimatingReactionId(reactionId);
    setTimeout(() => {
      setAnimatingReactionId(null);
    }, 400); // Match animation duration in CSS
  };

  return (
    <div className="pt-4 mt-4 border-t border-slate-200">
      <div className="flex items-start">
        <img src={reply.authorAvatar} alt={reply.author} className="w-10 h-10 rounded-full mr-3 border-2 border-slate-200" />
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <p className="font-bold text-slate-800 text-sm">{reply.author}</p>
            <p className="text-xs text-slate-500 ml-3">{new Date(reply.timestamp).toLocaleString('ja-JP')}</p>
          </div>
          <p className="font-serif text-slate-800 text-lg">{reply.line1}　{reply.line2}　{reply.line3}</p>
          <div className="flex items-center mt-2 space-x-4">
            {reply.reactions.map((reaction) => {
              const isReacted = !!reaction.isReacted;
              const buttonClasses = `flex items-center gap-1.5 transition-colors group ${
                isReacted ? 'text-teal-600' : 'text-slate-500 hover:text-teal-600'
              }`;
              const iconContainerClasses = `p-1 rounded-full transition-colors ${
                isReacted ? 'bg-teal-100' : 'bg-transparent group-hover:bg-teal-100'
              }`;
              const animationClass = animatingReactionId === reaction.id ? 'animate-pop' : '';

              return (
                <button
                  key={reaction.id}
                  onClick={() => handleReactionClick(reaction.id)}
                  className={buttonClasses}
                  aria-pressed={isReacted}
                  aria-label={`"${reaction.label}"にリアクションする。現在のカウント: ${reaction.count}`}
                  title={reaction.label}
                >
                  <div className={`${iconContainerClasses} ${animationClass}`}>
                    <div className="h-4 w-4">{reaction.icon}</div>
                  </div>
                  <span className="font-semibold text-xs">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyCard;