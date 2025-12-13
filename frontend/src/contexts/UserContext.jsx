import React, { createContext, useState, useContext, useEffect } from 'react';

export const UserContext = createContext();  // ← ここに export を追加

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));

      // セッションタイムスタンプが存在しない場合は初期化
      const loginTime = localStorage.getItem('loginTime');
      const lastActivity = localStorage.getItem('lastActivity');
      const now = Date.now().toString();

      if (!loginTime) {
        localStorage.setItem('loginTime', now);
      }
      if (!lastActivity) {
        localStorage.setItem('lastActivity', now);
      }
    }
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // セッションタイムアウト用のタイムスタンプを初期化
    const now = Date.now().toString();
    localStorage.setItem('loginTime', now);
    localStorage.setItem('lastActivity', now);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActivity');
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, updateUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};