import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NewPostPage from './pages/NewPostPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { HaikuPost, ReactionId, Visibility } from './types';
import { getInitialReactions } from './constants';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { fetchPosts as apiFetchPosts, createPost as apiCreatePost, react as apiReact, unreact as apiUnreact, replyToPost as apiReplyToPost, quotePost as apiQuotePost } from './services/backendService';
import ProtectedRoute from './components/ProtectedRoute';

const mapCountsToReactions = (sense?: number, fukai?: number) => {
    const reactions = getInitialReactions();
    return reactions.map(r => {
        if (r.id === (ReactionId as any).Sense) return { ...r, count: sense ?? 0 };
        if (r.id === (ReactionId as any).Fukai) return { ...r, count: fukai ?? 0 };
        return r;
    });
};

const App: React.FC = () => {
    const [haikuPosts, setHaikuPosts] = useState<HaikuPost[]>([]);
    const [currentSort, setCurrentSort] = useState<'new'|'trending'>('new');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const { currentUser } = useAuth();
    const { showError, showSuccess } = useToast();

    const loadPosts = useCallback(async (sort: 'new'|'trending', pageNum: number = 1, append: boolean = false) => {
        setLoading(true);
        setError(null);
        
        try {
            const backendPosts = await apiFetchPosts(sort, pageNum);
            const mapped: HaikuPost[] = backendPosts.map(p => ({
                id: String(p.id),
                author: p.author_name || '匿名',
                authorAvatar: p.author_avatar || `https://picsum.photos/seed/${p.id}/100/100`,
                line1: p.line1,
                line2: p.line2,
                line3: p.line3,
                image: p.image,
                reactions: mapCountsToReactions(p.sense_count, p.fukai_count),
                timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
                visibility: Visibility.Public,
                isAiGenerated: false,
                replyToId: p.reply_to_id ? String(p.reply_to_id) : undefined,
                quotedPostId: p.quoted_post_id ? String(p.quoted_post_id) : undefined,
            }));
            
            if (append) {
                setHaikuPosts(prev => [...prev, ...mapped]);
            } else {
                setHaikuPosts(mapped);
            }
            
            // ページネーション制御（20件未満なら最後のページとみなす）
            setHasMore(backendPosts.length >= 20);
        } catch (e) {
            console.error('Failed to load posts', e);
            const errorMessage = '投稿の読み込みに失敗しました。';
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        loadPosts(currentSort, 1, false).catch(e => console.error('Failed to load posts', e));
    }, [currentSort, loadPosts]);

    const loadMorePosts = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadPosts(currentSort, nextPage, true);
        }
    }, [loading, hasMore, page, currentSort, loadPosts]);

    const refreshPosts = useCallback(() => {
        // 最新の投稿を読み込む（ページ1を再読み込み）
        setPage(1);
        loadPosts(currentSort, 1, false);
    }, [currentSort, loadPosts]);

    const handleAddPost = useCallback(async (newPostData: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => {
        if (!currentUser) {
            showError("ログインが必要です。");
            return;
        }
        try {
            let created;
            
            // 返信の場合
            if (newPostData.replyToId) {
                created = await apiReplyToPost(parseInt(newPostData.replyToId, 10), {
                    author_name: currentUser.displayName,
                    author_avatar: currentUser.avatarUrl,
                    line1: newPostData.line1,
                    line2: newPostData.line2,
                    line3: newPostData.line3,
                    image: newPostData.image,
                });
            }
            // 引用の場合
            else if (newPostData.quotedPostId) {
                created = await apiQuotePost(parseInt(newPostData.quotedPostId, 10), {
                    author_name: currentUser.displayName,
                    author_avatar: currentUser.avatarUrl,
                    line1: newPostData.line1,
                    line2: newPostData.line2,
                    line3: newPostData.line3,
                    image: newPostData.image,
                });
            }
            // 通常の投稿の場合
            else {
                created = await apiCreatePost({
                    author_name: currentUser.displayName,
                    author_avatar: currentUser.avatarUrl,
                    line1: newPostData.line1,
                    line2: newPostData.line2,
                    line3: newPostData.line3,
                    image: newPostData.image,
                    reply_to_id: undefined,
                    quoted_post_id: undefined,
                });
            }
            
            const newPost: HaikuPost = {
                id: String(created.id),
                author: created.author_name,
                authorAvatar: created.author_avatar || currentUser.avatarUrl,
                line1: created.line1,
                line2: created.line2,
                line3: created.line3,
                image: created.image,
                reactions: mapCountsToReactions(created.sense_count, created.fukai_count),
                timestamp: created.created_at ? new Date(created.created_at).getTime() : Date.now(),
                visibility: newPostData.visibility ?? Visibility.Public,
                isAiGenerated: newPostData.isAiGenerated,
                replyToId: created.reply_to_id ? String(created.reply_to_id) : undefined,
                quotedPostId: created.quoted_post_id ? String(created.quoted_post_id) : undefined,
            };
            setHaikuPosts(prevPosts => [newPost, ...prevPosts]);
            showSuccess('投稿が完了しました！');
        } catch (e) {
            console.error('Failed to create post via backend', e);
            showError('投稿に失敗しました。しばらくしてから再度お試しください。');
        }
    }, [currentUser]);

    const storageKey = 'reactedByPost';

    const handleReaction = useCallback(async (postId: string, reactionId: ReactionId) => {
        try {
            const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const key = `${postId}:${reactionId}`;
            const isReacted = !!store[key];
            const kind = reactionId === (ReactionId as any).Sense ? 'sense' : 'fukai';
            const updated = isReacted ? await apiUnreact(parseInt(postId, 10), kind as any) : await apiReact(parseInt(postId, 10), kind as any);
            store[key] = !isReacted;
            localStorage.setItem(storageKey, JSON.stringify(store));
            setHaikuPosts(prev => prev.map(p => p.id === postId ? {
                ...p,
                reactions: mapCountsToReactions(updated.sense_count, updated.fukai_count)
            } : p));
        } catch (e) {
            console.error('Failed to react', e);
            showError('リアクションの送信に失敗しました。');
        }
    }, []);

    const requestSort = useCallback((sort: 'new'|'trending') => {
        setCurrentSort(sort);
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header />
            <main>
                <Routes>
                    <Route path="/" element={
                        <HomePage 
                            posts={haikuPosts} 
                            onReact={handleReaction} 
                            addPost={handleAddPost} 
                            requestSort={requestSort}
                            loading={loading}
                            error={error}
                            hasMore={hasMore}
                            onLoadMore={loadMorePosts}
                            onRefresh={refreshPosts}
                        />
                    } />
                    <Route path="/login" element={<LoginPage />} />
                    <Route 
                        path="/new" 
                        element={
                            <ProtectedRoute>
                                <NewPostPage posts={haikuPosts} addPost={handleAddPost} />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;