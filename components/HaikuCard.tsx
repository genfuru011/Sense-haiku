import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HaikuPost, ReactionId } from '../types';
import ReplyForm from './ReplyForm';
import ReplyCard from './ReplyCard';
import QuotedHaikuCard from './QuotedHaikuCard';
import { ReplyIcon } from './icons/ReplyIcon';
import { QuoteIcon } from './icons/QuoteIcon';

interface HaikuCardProps {
  post: HaikuPost;
  replies: HaikuPost[];
  quotedPost?: HaikuPost;
  onReact: (postId: string, reactionId: ReactionId) => void;
  addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
}

const HaikuCard: React.FC<HaikuCardProps> = ({ post, replies, quotedPost, onReact, addPost }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [animatingReactionId, setAnimatingReactionId] = useState<ReactionId | null>(null);

  const handleReplySubmit = (line1: string, line2: string, line3: string) => {
    setIsSubmittingReply(true);
    addPost({
      line1,
      line2,
      line3,
      visibility: post.visibility,
      isAiGenerated: false,
      replyToId: post.id
    });
    setShowReplyForm(false);
    setShowReplies(true);
    setIsSubmittingReply(false);
  };
  
  const handleReactionClick = (reactionId: ReactionId) => {
    onReact(post.id, reactionId);
    setAnimatingReactionId(reactionId);
    setTimeout(() => {
      setAnimatingReactionId(null);
    }, 400); // Match animation duration in CSS
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg transition-shadow hover:shadow-xl border border-slate-100">
      <div className="p-5">
        <div className="flex items-center mb-4">
          <img src={post.authorAvatar} alt={post.author} className="w-12 h-12 rounded-full mr-4 border-2 border-slate-200" />
          <div>
            <p className="font-bold text-slate-800">{post.author}</p>
            <p className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleString('ja-JP')}</p>
          </div>
          {post.isAiGenerated && (
             <div className="ml-auto bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              AI生成
            </div>
          )}
        </div>

        <div className="my-6 flex justify-center items-center">
            <p className="font-serif text-3xl md:text-4xl text-slate-800 tracking-wider" style={{ writingMode: 'vertical-rl' }}>
              <span className="block mb-4">{post.line1}</span>
              <span className="block mb-4">{post.line2}</span>
              <span className="block">{post.line3}</span>
            </p>
        </div>

        {post.image && (
          <div className="mt-4 mb-2 rounded-lg overflow-hidden">
            <img src={post.image} alt="Haiku illustration" className="w-full h-auto object-cover" />
          </div>
        )}

        {quotedPost && <QuotedHaikuCard post={quotedPost} />}
      </div>

      <div className="bg-slate-50/70 px-5 py-3 border-t border-slate-100">
        <div className="flex justify-around items-center">
            {/* Reply Button */}
            <button onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors group" aria-label="返信する" title="返信する">
                <div className="p-2 rounded-full group-hover:bg-teal-100 transition-colors">
                    <div className="h-6 w-6"><ReplyIcon/></div>
                </div>
                {replies.length > 0 && <span className="font-semibold text-sm">{replies.length}</span>}
            </button>
          
            {/* Quote Button */}
            <Link to={`/new?quote=${post.id}`} className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors group" aria-label="引用して詠む" title="引用して詠む">
                <div className="p-2 rounded-full group-hover:bg-teal-100 transition-colors">
                    <div className="h-6 w-6"><QuoteIcon/></div>
                </div>
            </Link>

            {/* Reaction Buttons */}
            {post.reactions.map((reaction) => {
                const isReacted = !!reaction.isReacted;
                const buttonClasses = `flex items-center gap-2 transition-colors group ${
                isReacted ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'
                }`;
                const iconBgClasses = `p-2 rounded-full transition-colors ${
                isReacted ? 'bg-teal-100' : 'bg-slate-200/50 group-hover:bg-teal-100'
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
                    <div className={`${iconBgClasses} ${animationClass}`}>
                        <div className="h-6 w-6">{reaction.icon}</div>
                    </div>
                    <span className="font-semibold text-sm">{reaction.count}</span>
                </button>
                );
            })}
        </div>
      </div>
      
      {showReplyForm && (
        <ReplyForm
          onSubmit={handleReplySubmit}
          onCancel={() => setShowReplyForm(false)}
          isSubmitting={isSubmittingReply}
        />
      )}
      
      {replies.length > 0 && (
        <div className="px-5 pb-4">
            <button onClick={() => setShowReplies(!showReplies)} className="text-sm text-teal-600 font-semibold hover:underline mt-2">
                {showReplies ? '返歌を隠す' : `${replies.length}件の返歌を表示`}
            </button>
            {showReplies && (
                <div className="mt-2 space-y-2">
                    {replies.map(reply => (
                        <ReplyCard key={reply.id} reply={reply} onReact={onReact} />
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default HaikuCard;