import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleIcon } from '../components/icons/GoogleIcon';

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, googleLogin } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
            throw new Error("表示名を入力してください。");
        }
        await signup(email, password, displayName);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || 'エラーが発生しました。';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
      setLoading(true);
      setError('');
      try {
          await googleLogin();
          navigate(from, { replace: true });
      } catch (err: any) {
          const errorMessage = err.message || 'Googleログインに失敗しました。';
          setError(errorMessage);
          showError(errorMessage);
      } finally {
          setLoading(false);
      }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setIsLoginView(true)}
              className={`w-full py-3 text-lg font-bold transition-colors ${isLoginView ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLoginView(false)}
              className={`w-full py-3 text-lg font-bold transition-colors ${!isLoginView ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              新規登録
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLoginView && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">表示名</label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-slate-100 border-2 border-transparent focus:border-primary focus:ring-0 rounded-lg py-2 px-4 text-slate-800"
                placeholder="俳句よみ人"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                          <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-100 border-2 border-transparent focus:border-primary focus:ring-0 rounded-lg py-2 px-4 text-slate-800"
                placeholder="email@example.com"
              />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
                          <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-100 border-2 border-transparent focus:border-primary focus:ring-0 rounded-lg py-2 px-4 text-slate-800"
                placeholder="6文字以上"
              />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-md font-bold text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-300"
            >
              {loading ? '処理中...' : (isLoginView ? 'ログイン' : '登録して始める')}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">または</span>
                </div>
            </div>
            <div className="mt-6">
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors duration-200"
                    style={{ minHeight: '40px' }}
                >
                    <GoogleIcon />
                    <span className="ml-3 font-roboto font-medium">Googleでログイン</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;