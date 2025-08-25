import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HaikuPost, ReactionId } from '../types';
import { fetchPosts, createPost, react, unreact, replyToPost, quotePost } from '../services/backendService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import HaikuCard from '../components/HaikuCard';
import ReplyForm from '../components/ReplyForm';
import { getInitialReactions } from '../constants';

interface PostDetailPageProps {
  addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
}

const PostDetailPage: React.FC<PostDetailPageProps> = ({ addPost }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [post, setPost] = useState<HaikuPost | null>(null);
  const [replies, setReplies] = useState<HaikuPost[]>([]);
  const [quotedPost, setQuotedPost] = useState<HaikuPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const storageKey = 'reactedByPost';

  const mapCountsToReactions = (sense?: number, fukai?: number, postId?: string) => {
    const reactions = getInitialReactions();
    const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    return reactions.map(r => {
      const isReacted = postId ? !!store[`${postId}:${r.id}`] : false;
      if (r.id === (ReactionId as any).Sense) return { ...r, count: sense ?? 0, isReacted };
      if (r.id === (ReactionId as any).Fukai) return { ...r, count: fukai ?? 0, isReacted };
      return { ...r, isReacted };
    });
  };

  // 階層構造を構築する関数
  const buildReplyTree = (allPosts: any[], rootPostId: number): HaikuPost[] => {
    const postsMap = new Map<string, HaikuPost>();
    
    // すべての投稿をマップに変換
    allPosts.forEach(p => {
      const mappedPost: HaikuPost = {
        id: String(p.id),
        author: p.author_name || '匿名',
        authorAvatar: p.author_avatar || `https://picsum.photos/seed/${p.id}/100/100`,
        line1: p.line1,
        line2: p.line2,
        line3: p.line3,
        image: p.image,
        reactions: mapCountsToReactions(p.sense_count, p.fukai_count, String(p.id)),
        timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        visibility: 'public' as any,
        isAiGenerated: false,
        replyToId: p.reply_to_id ? String(p.reply_to_id) : undefined,
        quotedPostId: p.quoted_post_id ? String(p.quoted_post_id) : undefined,
      };
      postsMap.set(String(p.id), mappedPost);
    });
    
    // 階層構造を構築
    const buildChildren = (parentId: number): HaikuPost[] => {
      const children: HaikuPost[] = [];
      
      allPosts.forEach(p => {
        if (p.reply_to_id === parentId) {
          const childPost = postsMap.get(String(p.id));
          if (childPost) {
            // 再帰的に子要素を構築
            const nestedReplies = buildChildren(p.id);
            if (nestedReplies.length > 0) {
              // 子要素がある場合は、HaikuPostにrepliesプロパティを追加
              (childPost as any).replies = nestedReplies;
            }
            children.push(childPost);
          }
        }
      });
      
      // タイムスタンプでソート（新しい順）
      return children.sort((a, b) => b.timestamp - a.timestamp);
    };
    
    return buildChildren(rootPostId);
  };

  const loadPost = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      // 投稿とその返信を取得
      const allPosts = await fetchPosts('new', 1); // 十分な数の投稿を取得
      
      // メイン投稿を探す
      const mainPost = allPosts.find(p => String(p.id) === postId);
      if (!mainPost) {
        showError('投稿が見つかりませんでした。');
        navigate('/');
        return;
      }

      // 階層構造で返信を取得
      const replyTree = buildReplyTree(allPosts, mainPost.id);
      
      // 引用元投稿を探す
      const quoted = mainPost.quoted_post_id ? allPosts.find(p => p.id === mainPost.quoted_post_id) : null;

      const mappedPost: HaikuPost = {
        id: String(mainPost.id),
        author: mainPost.author_name || '匿名',
        authorAvatar: mainPost.author_avatar || `https://picsum.photos/seed/${mainPost.id}/100/100`,
        line1: mainPost.line1,
        line2: mainPost.line2,
        line3: mainPost.line3,
        image: mainPost.image,
        reactions: mapCountsToReactions(mainPost.sense_count, mainPost.fukai_count, String(mainPost.id)),
        timestamp: mainPost.created_at ? new Date(mainPost.created_at).getTime() : Date.now(),
        visibility: 'public' as any,
        isAiGenerated: false,
        replyToId: mainPost.reply_to_id ? String(mainPost.reply_to_id) : undefined,
        quotedPostId: mainPost.quoted_post_id ? String(mainPost.quoted_post_id) : undefined,
      };

      const mappedQuotedPost = quoted ? {
        id: String(quoted.id),
        author: quoted.author_name || '匿名',
        authorAvatar: quoted.author_avatar || `https://picsum.photos/seed/${quoted.id}/100/100`,
        line1: quoted.line1,
        line2: quoted.line2,
        line3: quoted.line3,
        image: quoted.image,
        reactions: mapCountsToReactions(quoted.sense_count, quoted.fukai_count, String(quoted.id)),
        timestamp: quoted.created_at ? new Date(quoted.created_at).getTime() : Date.now(),
        visibility: 'public' as any,
        isAiGenerated: false,
        replyToId: quoted.reply_to_id ? String(quoted.reply_to_id) : undefined,
        quotedPostId: quoted.quoted_post_id ? String(quoted.quoted_post_id) : undefined,
      } : null;

      setPost(mappedPost);
      setReplies(replyTree);
      setQuotedPost(mappedQuotedPost);
    } catch (error) {
      console.error('Failed to load post:', error);
      showError('投稿の読み込みに失敗しました。');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  // 階層構造内の特定の投稿を更新する関数
  const updatePostInTree = (posts: HaikuPost[], targetId: string, updatedReactions: any[]): HaikuPost[] => {
    return posts.map(post => {
      if (post.id === targetId) {
        return { ...post, reactions: updatedReactions };
      }
      // ネストした返信も更新
      if ((post as any).replies) {
        return {
          ...post,
          replies: updatePostInTree((post as any).replies, targetId, updatedReactions)
        };
      }
      return post;
    });
  };

  const handleReaction = async (postId: string, reactionId: ReactionId) => {
    try {
      const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const key = `${postId}:${reactionId}`;
      const isReacted = !!store[key];
      const kind = reactionId === (ReactionId as any).Sense ? 'sense' : 'fukai';
      const updated = isReacted ? await unreact(parseInt(postId, 10), kind as any) : await react(parseInt(postId, 10), kind as any);
      store[key] = !isReacted;
      localStorage.setItem(storageKey, JSON.stringify(store));
      
      const updatedReactions = mapCountsToReactions(updated.sense_count, updated.fukai_count, postId);
      
      // メイン投稿のリアクション状態を更新
      setPost(prev => prev ? {
        ...prev,
        reactions: prev.id === postId ? updatedReactions : prev.reactions
      } : null);
      
      // 階層構造内の返信のリアクション状態を更新
      setReplies(prev => updatePostInTree(prev, postId, updatedReactions));
    } catch (e) {
      console.error('Failed to react', e);
      showError('リアクションの送信に失敗しました。');
    }
  };

  const handleReplySubmit = (line1: string, line2: string, line3: string) => {
    if (!post || !currentUser) return;
    
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
    showSuccess('返信を投稿しました！');
    // 投稿一覧を再読み込み
    setTimeout(() => {
      loadPost();
    }, 1000); // 少し待ってから再読み込み
    setIsSubmittingReply(false);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg mb-4">投稿が見つかりませんでした</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 戻るボタン */}
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-600 hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
      </div>

      {/* 投稿詳細 */}
      <div className="space-y-6">
        <HaikuCard 
          post={post}
          replies={replies}
          quotedPost={quotedPost}
          onReact={handleReaction}
          addPost={addPost}
          showAllReplies={true} // 詳細ページでは全ての返信を表示
        />

        {/* 返信フォーム */}
        {showReplyForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <ReplyForm
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
              isSubmitting={isSubmittingReply}
            />
          </div>
        )}

        {/* 返信ボタン */}
        {!showReplyForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <button
              onClick={() => setShowReplyForm(true)}
              className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
            >
              返信を投稿...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
