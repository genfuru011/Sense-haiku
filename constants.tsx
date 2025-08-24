import React from 'react';
import { ReactionId, HaikuPost, Visibility } from './types';
import { SenseIcon } from './components/icons/SenseIcon';
import { FukaiIcon } from './components/icons/FukaiIcon';

export const getInitialReactions = () => ([
  { id: ReactionId.Sense, label: 'センスいいね', icon: <SenseIcon />, count: 0, isReacted: false },
  { id: ReactionId.Fukai, label: '深い', icon: <FukaiIcon />, count: 0, isReacted: false },
]);

export const INITIAL_POSTS: HaikuPost[] = [
  {
    id: '1',
    author: '風の旅人',
    authorAvatar: 'https://picsum.photos/seed/kaze/100/100',
    line1: '古池や',
    line2: '蛙飛び込む',
    line3: '水の音',
    image: 'https://picsum.photos/seed/furuike/600/400',
    reactions: [
      { id: ReactionId.Sense, label: 'センスいいね', icon: <SenseIcon />, count: 25, isReacted: false },
      { id: ReactionId.Fukai, label: '深い', icon: <FukaiIcon />, count: 18, isReacted: false },
    ],
    timestamp: Date.now() - 1000 * 60 * 5,
    visibility: Visibility.Public,
    isAiGenerated: false,
  },
  {
    id: '2',
    author: 'AI俳人',
    authorAvatar: 'https://picsum.photos/seed/ai/100/100',
    line1: '蝉時雨',
    line2: 'アスファルト揺らす',
    line3: '陽炎か',
    reactions: [
      { id: ReactionId.Sense, label: 'センスいいね', icon: <SenseIcon />, count: 12, isReacted: false },
      { id: ReactionId.Fukai, label: '深い', icon: <FukaiIcon />, count: 8, isReacted: false },
    ],
    timestamp: Date.now() - 1000 * 60 * 30,
    visibility: Visibility.Public,
    isAiGenerated: true,
  },
  {
    id: '3',
    author: '月見草',
    authorAvatar: 'https://picsum.photos/seed/tsuki/100/100',
    line1: '夏草や',
    line2: '兵どもが',
    line3: '夢の跡',
    image: 'https://picsum.photos/seed/natsukusa/600/400',
    reactions: [
      { id: ReactionId.Sense, label: 'センスいいね', icon: <SenseIcon />, count: 40, isReacted: false },
      { id: ReactionId.Fukai, label: '深い', icon: <FukaiIcon />, count: 32, isReacted: false },
    ],
    timestamp: Date.now() - 1000 * 60 * 120,
    visibility: Visibility.Public,
    isAiGenerated: false,
  },
  {
    id: '4',
    author: 'あなた',
    authorAvatar: 'https://picsum.photos/seed/anata/100/100',
    line1: '返歌です',
    line2: '古池の景',
    line3: '目に浮かぶ',
    reactions: getInitialReactions(),
    timestamp: Date.now() - 1000 * 60 * 3,
    visibility: Visibility.Public,
    isAiGenerated: false,
    replyToId: '1', // Reply to the first post
  },
  {
    id: '5',
    author: '詩心',
    authorAvatar: 'https://picsum.photos/seed/shigokoro/100/100',
    line1: 'この句受け',
    line2: '我が心にも',
    line3: '夏の風',
    reactions: getInitialReactions(),
    timestamp: Date.now() - 1000 * 60 * 10,
    visibility: Visibility.Public,
    isAiGenerated: false,
    quotedPostId: '2', // Quote the second post
  }
];