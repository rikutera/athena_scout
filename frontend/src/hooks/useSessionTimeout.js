import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_DURATION = 1 * 60 * 1000; // 2分（非アクティブタイムアウト）
const WARNING_DURATION = 0.5 * 60 * 1000; // 1分前に警告
const CHECK_INTERVAL = 10 * 1000; // 10秒ごとにチェック
const ABSOLUTE_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間（絶対的なタイムアウト）

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const updateActivity = useCallback(() => {
    const loginTime = localStorage.getItem('loginTime');
    
    if (!loginTime) {
      localStorage.setItem('loginTime', Date.now().toString());
    }
    
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  }, []);

  const logout = useCallback(() => {
    // LocalStorageをクリア
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('loginTime');
    
    // 警告を非表示
    setShowWarning(false);
    
    // ログインページに遷移
    navigate('/login', { 
      replace: true, // 履歴を置き換え
      state: { message: 'セッションがタイムアウトしました。再度ログインしてください。' }
    });
  }, [navigate]);

  const extendSession = useCallback(() => {
    updateActivity();
    setShowWarning(false);
  }, [updateActivity]);

  useEffect(() => {
    updateActivity();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const intervalId = setInterval(() => {
      const loginTime = parseInt(localStorage.getItem('loginTime') || Date.now().toString());
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const now = Date.now();
      
      const timeSinceLogin = now - loginTime;
      
      if (timeSinceLogin >= ABSOLUTE_TIMEOUT) {
        logout();
        return;
      }
      
      const elapsed = now - lastActivity;
      const remaining = TIMEOUT_DURATION - elapsed;

      if (elapsed >= TIMEOUT_DURATION) {
        logout();
      } else if (remaining <= WARNING_DURATION && remaining > 0) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000 / 60));
      } else {
        setShowWarning(false);
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity, logout]);

  return { showWarning, timeLeft, extendSession, logout };
};