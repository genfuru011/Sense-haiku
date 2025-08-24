import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NewPostPage from './pages/NewPostPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import { HaikuPost, ReactionId, Visibility } from './types';
import { getInitialReactions } from './constants';
import { useAuth } from './contexts/AuthContext';
import { fetchPosts as apiFetchPosts, createPost as apiCreatePost, react as apiReact, unreact as apiUnreact } from './services/backendService';

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
    const { currentUser } = useAuth();

    const loadPosts = useCallback(async (sort: 'new'|'trending') => {
        const backendPosts = await apiFetchPosts(sort);
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
        setHaikuPosts(mapped);
    }, []);

    useEffect(() => {
        loadPosts(currentSort).catch(e => console.error('Failed to load posts', e));
    }, [currentSort, loadPosts]);

    const handleAddPost = useCallback(async (newPostData: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => {
        if (!currentUser) {
            alert("ログインが必要です。");
            return;
        }
        try {
            const created = await apiCreatePost({
                author_name: currentUser.displayName,
                author_avatar: currentUser.avatarUrl,
                line1: newPostData.line1,
                line2: newPostData.line2,
                line3: newPostData.line3,
                image: newPostData.image,
                reply_to_id: newPostData.replyToId ? parseInt(newPostData.replyToId, 10) : undefined,
                quoted_post_id: newPostData.quotedPostId ? parseInt(newPostData.quotedPostId, 10) : undefined,
            });
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
        } catch (e) {
            console.error('Failed to create post via backend', e);
            alert('投稿に失敗しました。しばらくしてから再度お試しください。');
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
                    <Route path="/" element={<HomePage posts={haikuPosts} onReact={handleReaction} addPost={handleAddPost} requestSort={requestSort} />} />
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