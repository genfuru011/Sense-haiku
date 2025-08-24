import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  updateProfile: (data: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
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

const MOCK_USERS_STORAGE_KEY = 'haiku-mock-users';
const CURRENT_USER_STORAGE_KEY = 'haiku-current-user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMockUsers = (): { [email: string]: User } => {
    const usersJson = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
  };

  const saveMockUsers = (users: { [email: string]: User }) => {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
  };
  
  const saveCurrentUser = (user: User | null) => {
      if (user) {
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
      } else {
          localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
      setCurrentUser(user);
  }

  const login = async (email: string, pass: string): Promise<void> => {
    // Note: Password is not actually checked in this mock implementation
    const users = getMockUsers();
    if (users[email]) {
      saveCurrentUser(users[email]);
    } else {
      throw new Error("ユーザーが見つかりません。");
    }
  };

  const signup = async (email: string, pass: string, displayName: string): Promise<void> => {
    const users = getMockUsers();
    if (users[email]) {
      throw new Error("このメールアドレスは既に使用されています。");
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      displayName,
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
      bio: `こんにちは！${displayName}です。よろしくお願いします。`,
    };
    users[email] = newUser;
    saveMockUsers(users);
    saveCurrentUser(newUser);
  };
  
  const googleLogin = async (): Promise<void> => {
      const googleUserEmail = 'google.user@example.com';
      let users = getMockUsers();
      let user = users[googleUserEmail];
      if (!user) {
          user = {
            id: `user_${Date.now()}`,
            email: googleUserEmail,
            displayName: 'Googleユーザー',
            avatarUrl: `https://picsum.photos/seed/google/200/200`,
            bio: 'Googleアカウントでログインしました。',
          };
          users[googleUserEmail] = user;
          saveMockUsers(users);
      }
      saveCurrentUser(user);
      navigate('/');
  }

  const logout = () => {
    saveCurrentUser(null);
  };

  const updateProfile = async (data: Partial<Omit<User, 'id' | 'email'>>): Promise<void> => {
      if(!currentUser) throw new Error("Not logged in");
      const updatedUser = { ...currentUser, ...data };
      saveCurrentUser(updatedUser);
      
      const users = getMockUsers();
      if(currentUser.email && users[currentUser.email]){
          users[currentUser.email] = updatedUser;
          saveMockUsers(users);
      }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    googleLogin,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
