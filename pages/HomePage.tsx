import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import HaikuCard from '../components/HaikuCard';
import { HaikuPost, ReactionId } from '../types';

interface HomePageProps {
    posts: HaikuPost[];
    onReact: (postId: string, reactionId: ReactionId) => void;
    addPost: (post: Omit<HaikuPost, 'id' | 'timestamp' | 'author' | 'authorAvatar' | 'reactions'>) => void;
    requestSort?: (sort: 'new' | 'trending') => void;
    loading?: boolean;
    error?: string | null;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onRefresh?: () => void;
}

type FilterType = 'new' | 'popular';

// デバイス判定用のカスタムフック
const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkDevice = () => {
            // タッチデバイスと画面サイズで判定
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(hasTouch && isSmallScreen);
        };
        
        checkDevice();
        window.addEventListener('resize', checkDevice);
        
        return () => window.removeEventListener('resize', checkDevice);
    }, []);
    
    return isMobile;
};

// プルダウン更新用のカスタムフック（スマホ版のみ）
const usePullToRefresh = (onRefresh: () => void, loading: boolean) => {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const PULL_THRESHOLD = 80; // プルダウン更新の閾値
    
    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (loading) return;
        
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop <= 0) {
            startY.current = e.touches[0].clientY;
        }
    }, [loading]);
    
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (loading || !startY.current) return;
        
        const scrollTop = containerRef.current?.scrollTop || 0;
        if (scrollTop <= 0) {
            const currentY = e.touches[0].clientY;
            const distance = Math.max(0, currentY - startY.current);
            
            if (distance > 0) {
                e.preventDefault();
                setIsPulling(true);
                setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
            }
        }
    }, [loading]);
    
    const handleTouchEnd = useCallback(() => {
        if (loading || !isPulling) return;
        
        if (pullDistance >= PULL_THRESHOLD) {
            onRefresh();
        }
        
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
    }, [loading, isPulling, pullDistance, onRefresh]);
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
    
    return { containerRef, isPulling, pullDistance, PULL_THRESHOLD };
};

const HomePage: React.FC<HomePageProps> = ({ 
    posts, 
    onReact, 
    addPost, 
    requestSort, 
    loading = false, 
    error = null, 
    hasMore = false, 
    onLoadMore,
    onRefresh
}) => {
    const [filter, setFilter] = useState<FilterType>('new');
    
    // デバイス判定
    const isMobile = useDeviceDetection();

    // プルダウン更新機能
    const { containerRef, isPulling, pullDistance, PULL_THRESHOLD } = usePullToRefresh(
        onRefresh || (() => {}), 
        loading
    );

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
            // 新着順: 新しい投稿が最上部、スクロールで下に進むと古い投稿
            return postsCopy.sort((a, b) => b.timestamp - a.timestamp);
        }
        if (filter === 'popular') {
            // 人気順: リアクション数の多い投稿が最上部、スクロールで下に進むと人気の低い投稿
            return postsCopy.sort((a, b) => {
                const totalReactionsA = a.reactions.reduce((sum, r) => sum + r.count, 0);
                const totalReactionsB = b.reactions.reduce((sum, r) => sum + r.count, 0);
                return totalReactionsB - totalReactionsA;
            });
        }
        return postsCopy;
    }, [topLevelPosts, filter]);

    const handleFilterChange = (next: FilterType) => {
        setFilter(next);
        if (next === 'new') requestSort?.('new');
        if (next === 'popular') requestSort?.('trending');
    };

    // 無限スクロール用のIntersection Observer（スクロールコンテナをrootに設定）
    const observerRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;

        const rootEl = containerRef.current || null;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && onLoadMore) {
                    onLoadMore();
                }
            },
            {
                // 最下部の少し手前（20%の位置）で読み込み開始
                root: rootEl,
                rootMargin: '0px 0px 20% 0px',
                threshold: 0,
            }
        );

        if (node) observer.observe(node);

        return () => observer.disconnect();
    }, [loading, hasMore, onLoadMore, containerRef]);

    // PC版用の最下部更新監視要素
    const pcRefreshRef = useCallback((node: HTMLDivElement) => {
        if (loading || isMobile || !onRefresh) return;
        
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                onRefresh();
            }
        }, {
            // 最下部で更新
            rootMargin: '0px 0px 0px 0px'
        });
        
        if (node) observer.observe(node);
        
        return () => observer.disconnect();
    }, [loading, isMobile, onRefresh]);

    return (
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <div className="flex justify-center bg-slate-100 rounded-full p-1">
                    <button
                        onClick={() => handleFilterChange('new')}
                        disabled={loading}
                        className={`w-full py-2.5 text-sm font-semibold rounded-full transition-colors ${
                            filter === 'new' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:bg-slate-200'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        新着
                    </button>
                    <button
                        onClick={() => handleFilterChange('popular')}
                        disabled={loading}
                        className={`w-full py-2.5 text-sm font-semibold rounded-full transition-colors ${
                            filter === 'popular' ? 'bg-white shadow text-primary' : 'text-slate-600 hover:bg-slate-200'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        人気
                    </button>
                </div>
            </div>

            {/* プルダウン更新インジケーター */}
            {isPulling && (
                <div 
                    className="flex justify-center items-center py-4 text-primary text-sm font-medium"
                    style={{ 
                        transform: `translateY(${Math.min(pullDistance, PULL_THRESHOLD)}px)`,
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {pullDistance >= PULL_THRESHOLD ? '離して更新' : '下に引っ張って更新'}
                </div>
            )}

            {/* 最新投稿読み込みボタン（新着タブのみ） */}
            {filter === 'new' && onRefresh && (
                <div className="mb-4">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="w-full py-2 text-sm font-medium text-primary bg-accent-bg border border-accent-border rounded-lg hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '読み込み中...' : '最新の投稿を読み込む'}
                    </button>
                </div>
            )}

            {/* エラーメッセージ */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* スクロール可能なコンテナ */}
            <div 
                ref={containerRef}
                className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
                style={{
                    transform: isPulling ? `translateY(${Math.min(pullDistance * 0.3, PULL_THRESHOLD * 0.3)}px)` : 'translateY(0)',
                    transition: isPulling ? 'none' : 'transform 0.3s ease-out'
                }}
            >
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
                
                {/* ローディングインジケーター */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                
                {/* 無限スクロール用の監視要素 */}
                {hasMore && !loading && (
                    <div ref={observerRef} className="h-4" />
                )}
                
                {/* 投稿がない場合 */}
                {!loading && sortedPosts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-lg">まだ投稿がありません</p>
                        <p className="text-slate-400 text-sm mt-2">最初の俳句を投稿してみましょう</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;