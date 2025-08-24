export interface BackendPost {
  id: number;
  author_name: string;
  author_avatar?: string;
  line1: string;
  line2: string;
  line3: string;
  image?: string;
  reply_to_id?: number;
  quoted_post_id?: number;
  sense_count?: number;
  fukai_count?: number;
  created_at?: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000';

export async function fetchPosts(sort?: 'new'|'trending'): Promise<BackendPost[]> {
  const q = sort ? `?sort=${sort}` : '';
  const res = await fetch(`${API_BASE}/api/posts${q}`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function createPost(payload: Omit<BackendPost, 'id' | 'created_at'>): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}

export async function react(postId: number, kind: 'sense'|'fukai'): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/react/${kind}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to react: ${res.status}`);
  return res.json();
}

export async function unreact(postId: number, kind: 'sense'|'fukai'): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/react/${kind}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to unreact: ${res.status}`);
  return res.json();
}
