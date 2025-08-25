import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HaikuPost, ReactionId } from '../types';
import ReplyForm from './ReplyForm';
import ReplyCard from './ReplyCard';
import QuotedHaikuCard from './QuotedHaikuCard';
import { ReplyIcon } from './icons/ReplyIcon';
import { QuoteIcon } from './icons/QuoteIcon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface HaikuCardProps {
  post: HaikuPost;
  replies: HaikuPost[];
  quotedPost?: HaikuPost;
  onReact: (postId: string, reactionId: ReactionId) => void;
  addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
  showAllReplies?: boolean; // 詳細ページで全ての返信を表示するかどうか
}

const HaikuCard: React.FC<HaikuCardProps> = ({ post, replies, quotedPost, onReact, addPost, showAllReplies = false }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [animatingReactionId, setAnimatingReactionId] = useState<ReactionId | null>(null);
  const [replyingToReply, setReplyingToReply] = useState<HaikuPost | null>(null);
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

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

  const handleReplyToReply = (reply: HaikuPost) => {
    if (!currentUser) {
      showError("ログインが必要です。");
      return;
    }
    setReplyingToReply(reply);
  };

  const handleReplyToReplySubmit = (line1: string, line2: string, line3: string) => {
    if (!replyingToReply) return;
    
    setIsSubmittingReply(true);
    addPost({
      line1,
      line2,
      line3,
      visibility: post.visibility,
      isAiGenerated: false,
      replyToId: replyingToReply.id
    });
    setReplyingToReply(null);
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
      <div className="p-5 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
        <div className="flex items-center mb-4">
          <img src={post.authorAvatar} alt={post.author} className="w-12 h-12 rounded-full mr-4 border-2 border-slate-200" />
          <div>
            <p className="font-bold text-slate-800">{post.author}</p>
            <p className="text-xs text-slate-500">{new Date(post.timestamp).toLocaleString('ja-JP')}</p>
          </div>
          {post.isAiGenerated && (
             <div className="ml-auto bg-accent-bg text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
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
                    <button onClick={(e) => { e.stopPropagation(); setShowReplyForm(!showReplyForm); }} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group" aria-label="返信する" title="返信する">
          <div className="p-2 rounded-full group-hover:bg-accent-bg transition-colors">
                    <div className="h-6 w-6"><ReplyIcon/></div>
                </div>
                {replies.length > 0 && <span className="font-semibold text-sm">{replies.length}</span>}
            </button>
          
            {/* Quote Button */}
                    <Link to={`/new?quote=${post.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors group" aria-label="引用して詠む" title="引用して詠む">
          <div className="p-2 rounded-full group-hover:bg-accent-bg transition-colors">
                    <div className="h-6 w-6"><QuoteIcon/></div>
                </div>
            </Link>

            {/* Reaction Buttons */}
            {post.reactions.map((reaction) => {
                const isReacted = !!reaction.isReacted;
                const buttonClasses = `flex items-center gap-2 transition-colors group ${
                isReacted ? 'text-primary' : 'text-slate-600 hover:text-primary'
                }`;
                const iconBgClasses = `p-2 rounded-full transition-colors ${
                isReacted ? 'bg-accent-bg' : 'bg-slate-200/50 group-hover:bg-accent-bg'
                }`;
                const animationClass = animatingReactionId === reaction.id ? 'animate-pop' : '';
                const countClasses = `font-semibold text-sm transition-colors ${
                isReacted ? 'text-primary' : 'text-slate-600'
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
                    <div className={`${iconBgClasses} ${animationClass}`}>
                        <div className="h-6 w-6">{reaction.icon}</div>
                    </div>
                    <span className={countClasses}>{reaction.count}</span>
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

      {replyingToReply && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <div className="mb-3 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">返信先:</p>
            <p className="font-serif text-slate-800">{replyingToReply.line1}　{replyingToReply.line2}　{replyingToReply.line3}</p>
            <p className="text-xs text-slate-500 mt-1">— {replyingToReply.author}</p>
          </div>
          <ReplyForm
            onSubmit={handleReplyToReplySubmit}
            onCancel={() => setReplyingToReply(null)}
            isSubmitting={isSubmittingReply}
          />
        </div>
      )}
      
      {replies.length > 0 && (
        <div className="px-5 pb-4">
            {!showAllReplies && (
                <button onClick={(e) => { e.stopPropagation(); setShowReplies(!showReplies); }} className="text-sm text-primary font-semibold hover:underline mt-2">
                    {showReplies ? '返歌を隠す' : `${replies.length}件の返歌を表示`}
                </button>
            )}
            {(showReplies || showAllReplies) && (
                <div className="mt-2 space-y-2">
                    {replies.map(reply => (
                        <ReplyCard 
                            key={reply.id} 
                            reply={reply} 
                            onReact={onReact} 
                            onReply={handleReplyToReply}
                            addPost={addPost}
                            depth={showAllReplies ? 999 : 1} // 詳細ページでは制限なし、通常は1階層目から開始
                        />
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default HaikuCard;