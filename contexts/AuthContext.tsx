import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { signup as apiSignup, login as apiLogin, getCurrentUser, logout as apiLogout, BackendUser } from '../services/backendService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  updateProfile: (data: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// バックエンドユーザーをフロントエンドユーザーに変換
const convertBackendUser = (backendUser: BackendUser): User => ({
  id: backendUser.id.toString(),
  email: backendUser.email,
  displayName: backendUser.display_name,
  avatarUrl: backendUser.avatar_url || '',
  bio: backendUser.bio,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 初期化時にトークンがある場合はユーザー情報を取得
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(convertBackendUser(user));
      } catch (error) {
        console.log("No valid token found, user not logged in");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    try {
      await apiLogin(email, pass);
      const user = await getCurrentUser();
      setCurrentUser(convertBackendUser(user));
      navigate('/');
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (email: string, pass: string, displayName: string): Promise<void> => {
    try {
      await apiSignup(email, pass, displayName);
      const user = await getCurrentUser();
      setCurrentUser(convertBackendUser(user));
      navigate('/');
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };
  
  const googleLogin = async (): Promise<void> => {
    // Googleログインは将来的に実装
    throw new Error("Google login not implemented yet");
  }

  const logout = () => {
    apiLogout();
    setCurrentUser(null);
    navigate('/login');
  };

  const updateProfile = async (data: Partial<Omit<User, 'id' | 'email'>>): Promise<void> => {
    if (!currentUser) throw new Error("Not logged in");
    // プロフィール更新APIは将来的に実装
    const updatedUser = { ...currentUser, ...data };
    setCurrentUser(updatedUser);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    googleLogin,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
