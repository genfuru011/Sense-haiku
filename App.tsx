import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import NewPostPage from './pages/NewPostPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { HaikuPost, ReactionId } from './types';
import { INITIAL_POSTS, getInitialReactions } from './constants';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
    const [haikuPosts, setHaikuPosts] = useState<HaikuPost[]>(INITIAL_POSTS);
    const { currentUser } = useAuth();

    const handleAddPost = useCallback((newPostData: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => {
        if (!currentUser) {
            console.error("User not logged in, cannot add post.");
            // This case should be prevented by ProtectedRoute, but as a safeguard:
            alert("ログインが必要です。");
            return;
        }

        const newPost: HaikuPost = {
            id: new Date().toISOString(),
            author: currentUser.displayName,
            authorAvatar: currentUser.avatarUrl,
            ...newPostData,
            reactions: getInitialReactions(),
            timestamp: Date.now(),
        };
        setHaikuPosts(prevPosts => [newPost, ...prevPosts]);
    }, [currentUser]);

    const handleReaction = useCallback((postId: string, reactionId: ReactionId) => {
        setHaikuPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const newReactions = post.reactions.map(reaction => {
                        if (reaction.id === reactionId) {
                            return { 
                                ...reaction, 
                                count: reaction.isReacted ? reaction.count - 1 : reaction.count + 1,
                                isReacted: !reaction.isReacted
                            };
                        }
                        return reaction;
                    });
                    return { ...post, reactions: newReactions };
                }
                return post;
            })
        );
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen">
            <Header />
            <main>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<HomePage posts={haikuPosts} onReact={handleReaction} addPost={handleAddPost} />} />
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
                </Routes>
            </main>
        </div>
    );
};

export default App;