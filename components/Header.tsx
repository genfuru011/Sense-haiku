import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { LogoutIcon } from './icons/LogoutIcon';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="text-2xl font-bold text-slate-800 hover:text-primary transition-colors">
                        センス俳句
                    </Link>
                    <div className="flex items-center gap-4">
                        {currentUser ? (
                            <>
                                {location.pathname !== '/new' && (
                                    <Link 
                                        to="/new" 
                                        className="hidden sm:flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-full shadow-md hover:shadow-lg transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        詠む
                                    </Link>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-300 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                                        <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-30 border border-slate-100">
                                            <div className="px-4 py-2 border-b border-slate-100">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{currentUser.displayName}</p>
                                                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                            </div>
                                            <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full text-left">
                                                <EditIcon />
                                                プロフィールを編集
                                            </Link>
                                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                                                <LogoutIcon />
                                                ログアウト
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                             <Link 
                                to="/login" 
                                className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-full shadow-md hover:shadow-lg transition-all"
                            >
                                ログイン
                            </Link>
                        )}
                    </div>
                </div>
            </div>
             {currentUser && location.pathname !== '/new' && (
                <div className="sm:hidden fixed bottom-4 right-4 z-10">
                     <Link 
                        to="/new" 
                        className="flex items-center justify-center bg-primary hover:bg-primary-light text-white rounded-full shadow-lg h-14 w-14"
                        aria-label="新しい句を詠む"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </Link>
                </div>
            )}
        </header>
    );
};

export default Header;