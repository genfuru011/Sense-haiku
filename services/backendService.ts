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
  user?: BackendUser;
}

export interface BackendUser {
  id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000';

// トークン管理
const TOKEN_KEY = 'haiku-auth-token';

function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// 認証API
export async function signup(email: string, password: string, displayName: string): Promise<AuthToken> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to signup: ${res.status}`);
  }
  const token = await res.json();
  setAuthToken(token.access_token);
  return token;
}

export async function login(email: string, password: string): Promise<AuthToken> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to login: ${res.status}`);
  }
  const token = await res.json();
  setAuthToken(token.access_token);
  return token;
}

export async function getCurrentUser(): Promise<BackendUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get current user: ${res.status}`);
  return res.json();
}

export function logout(): void {
  removeAuthToken();
}

// 投稿API（更新）
export async function fetchPosts(sort?: 'new'|'trending', page?: number): Promise<BackendPost[]> {
  const params = new URLSearchParams();
  if (sort) params.append('sort', sort);
  if (page) params.append('page', page.toString());
  
  const queryString = params.toString();
  const url = `${API_BASE}/api/posts${queryString ? `?${queryString}` : ''}`;
  
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

export async function createPost(payload: Omit<BackendPost, 'id' | 'created_at' | 'user'>): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to create post: ${res.status}`);
  }
  return res.json();
}

// 返信・引用API
export async function replyToPost(
  postId: number, 
  payload: Omit<BackendPost, 'id' | 'created_at' | 'user' | 'reply_to_id' | 'quoted_post_id'>
): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to reply to post: ${res.status}`);
  }
  return res.json();
}

export async function quotePost(
  postId: number, 
  payload: Omit<BackendPost, 'id' | 'created_at' | 'user' | 'reply_to_id' | 'quoted_post_id'>
): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/quote`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || `Failed to quote post: ${res.status}`);
  }
  return res.json();
}

export async function getPostReplies(postId: number): Promise<BackendPost[]> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/replies`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch replies: ${res.status}`);
  return res.json();
}

export async function getPostQuotes(postId: number): Promise<BackendPost[]> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/quotes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
  return res.json();
}

export async function react(postId: number, kind: 'sense'|'fukai'): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/react/${kind}`, { 
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to react: ${res.status}`);
  return res.json();
}

export async function unreact(postId: number, kind: 'sense'|'fukai'): Promise<BackendPost> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/react/${kind}`, { 
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to unreact: ${res.status}`);
  return res.json();
}

// AIプロキシAPI
export interface HaikuGenerationRequest {
  text: string;
}

export interface HaikuGenerationResponse {
  line1: string;
  line2: string;
  line3: string;
}

export async function generateHaiku(request: HaikuGenerationRequest): Promise<HaikuGenerationResponse> {
  const res = await fetch(`${API_BASE}/api/ai/haiku`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to generate haiku: ${res.status}`);
  }
  return res.json();
}

// モーラ数カウントAPI
export interface MoraCountPayload {
  line1: string;
  line2: string;
  line3: string;
}

export interface MoraCountResponse {
  line1: number;
  line2: number;
  line3: number;
}

export async function countMora(payload: MoraCountPayload): Promise<MoraCountResponse> {
  const res = await fetch(`${API_BASE}/api/mora/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to count mora: ${res.status}`);
  return res.json();
}

