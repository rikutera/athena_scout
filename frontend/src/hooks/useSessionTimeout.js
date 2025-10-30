import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TIMEOUT_DURATION = 2 * 60 * 1000; // テスト用: 2分
const WARNING_DURATION = 1 * 60 * 1000; // テスト用: 1分前に警告
const CHECK_INTERVAL = 10 * 1000; // テスト用: 10秒ごとにチェック

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const updateActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    navigate('/login', { 
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
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const now = Date.now();
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
