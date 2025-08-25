import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName);
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser]);

  if (!currentUser) {
    // This should be handled by ProtectedRoute, but as a fallback
    return <div className="text-center p-8">ユーザー情報の読み込みに失敗しました。</div>;
  }
  
  const handleAvatarChange = () => {
    // This is a mock function to change avatar to a new random one
    const newAvatarUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
    setAvatarUrl(newAvatarUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateProfile({ displayName, bio, avatarUrl });
      const successMessage = 'プロフィールが更新されました！';
      setMessage(successMessage);
      showSuccess(successMessage);
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (err: any) {
      const errorMessage = err.message || '更新中にエラーが発生しました。';
      setMessage(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-800 text-center mb-8">
            プロフィール編集
        </h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 shadow-md"
              />
              <button
                type="button"
                onClick={handleAvatarChange}
                className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                変更
              </button>
            </div>
            <p className="text-sm text-slate-500">アイコンをクリックして変更</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={currentUser.email || ''}
              disabled
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg py-2 px-4 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">表示名</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-white border-2 border-slate-200 focus:border-teal-400 focus:ring-0 rounded-lg py-2 px-4 text-slate-800"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">自己紹介</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-white border-2 border-slate-200 focus:border-teal-400 focus:ring-0 rounded-lg py-2 px-4 text-slate-800"
              placeholder="あなたのことを教えてください"
            />
          </div>

          {message && <p className="text-primary text-sm text-center bg-accent-bg p-3 rounded-lg">{message}</p>}

          <div className="flex justify-end items-center gap-4">
            <button
                type="button"
                onClick={() => navigate('/')}
                className="py-2 px-5 text-sm font-semibold text-slate-600 bg-white rounded-full hover:bg-slate-50 border border-slate-300"
            >
                キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-light disabled:bg-slate-400 shadow-md"
            >
              {loading ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;