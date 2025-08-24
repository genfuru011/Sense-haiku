import React, { useState, useMemo } from 'react';
import HaikuCard from '../components/HaikuCard';
import { HaikuPost, ReactionId } from '../types';

interface HomePageProps {
    posts: HaikuPost[];
    onReact: (postId: string, reactionId: ReactionId) => void;
    addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
}

type FilterType = 'new' | 'popular';

const HomePage: React.FC<HomePageProps> = ({ posts, onReact, addPost }) => {
    const [filter, setFilter] = useState<FilterType>('new');

    const { topLevelPosts, repliesByPostId, postsById } = useMemo(() => {
        const topLevel: HaikuPost[] = [];
        const repliesMap: { [key: string]: HaikuPost[] } = {};
        const postsMap: { [key: string]: HaikuPost } = {};

        for (const post of posts) {
            postsMap[post.id] = post;
            if (post.replyToId) {
                if (!repliesMap[post.replyToId]) {
                    repliesMap[post.replyToId] = [];
                }
                repliesMap[post.replyToId].push(post);
            } else {
                topLevel.push(post);
            }
        }
        
        for (const postId in repliesMap) {
            repliesMap[postId].sort((a, b) => a.timestamp - b.timestamp);
        }

        return { topLevelPosts: topLevel, repliesByPostId: repliesMap, postsById: postsMap };
    }, [posts]);


    const sortedPosts = useMemo(() => {
        const postsCopy = [...topLevelPosts];
        if (filter === 'new') {
            return postsCopy.sort((a, b) => b.timestamp - a.timestamp);
        }
        if (filter === 'popular') {
            return postsCopy.sort((a, b) => {
                const totalReactionsA = a.reactions.reduce((sum, r) => sum + r.count, 0);
                const totalReactionsB = b.reactions.reduce((sum, r) => sum + r.count, 0);
                return totalReactionsB - totalReactionsA;
            });
        }
        return postsCopy;
    }, [topLevelPosts, filter]);

    return (
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <div className="flex justify-center bg-slate-100 rounded-full p-1">
                    <button
                        onClick={() => setFilter('new')}
                        className={`w-full py-2.5 text-sm font-semibold rounded-full transition-colors ${
                            filter === 'new' ? 'bg-white shadow text-teal-600' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        新着
                    </button>
                    <button
                        onClick={() => setFilter('popular')}
                        className={`w-full py-2.5 text-sm font-semibold rounded-full transition-colors ${
                            filter === 'popular' ? 'bg-white shadow text-teal-600' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        人気
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {sortedPosts.map(post => (
                    <HaikuCard 
                        key={post.id} 
                        post={post} 
                        onReact={onReact} 
                        addPost={addPost}
                        replies={repliesByPostId[post.id] || []}
                        quotedPost={post.quotedPostId ? postsById[post.quotedPostId] : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePage;