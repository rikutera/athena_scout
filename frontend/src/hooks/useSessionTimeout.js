import { useEffect, useState, useCallback } from 'react';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30分
const WARNING_DURATION = 5 * 60 * 1000; // 5分前に警告
const CHECK_INTERVAL = 60 * 1000; // 1分ごとにチェック
const ABSOLUTE_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間

export const useSessionTimeout = (onLogout) => {
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
    
    // 親コンポーネントのlogoutを実行
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  const extendSession = useCallback(() => {
    updateActivity();
    setShowWarning(false);
  }, [updateActivity]);

  useEffect(() => {
    // authTokenがない場合は何もしない
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      return;
    }
  
    updateActivity();
  
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const activityHandler = (e) => {
      // モーダル内のクリックは無視
      if (e.target.closest('.timeout-modal')) {
        return; // ← これを追加
      }
      updateActivity();
    };
  
    events.forEach(event => {
      window.addEventListener(event, activityHandler, true); // capture phase
    });
  
    const intervalId = setInterval(() => {
      const currentAuthToken = localStorage.getItem('authToken');
      if (!currentAuthToken) {
        clearInterval(intervalId);
        return;
      }
  
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
        window.removeEventListener(event, activityHandler, true);
      });
    };
  }, [updateActivity, logout]);

  return { showWarning, timeLeft, extendSession, logout };
};