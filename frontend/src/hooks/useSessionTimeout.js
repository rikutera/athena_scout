import { useEffect, useState, useCallback, useRef } from 'react';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30分
const WARNING_DURATION = 5 * 60 * 1000; // 5分前に警告
const CHECK_INTERVAL = 60 * 1000; // 1分ごとにチェック
const ABSOLUTE_TIMEOUT = 2 * 60 * 60 * 1000; // 2時間

export const useSessionTimeout = (onLogout) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // onLogoutをrefに保存して、依存配列の変更を防ぐ
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

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
    if (onLogoutRef.current) {
      onLogoutRef.current();
    }
  }, []);

  const extendSession = useCallback(() => {
    const loginTime = localStorage.getItem('loginTime');

    if (!loginTime) {
      localStorage.setItem('loginTime', Date.now().toString());
    }

    localStorage.setItem('lastActivity', Date.now().toString());
    setShowWarning(false);
  }, []);

  useEffect(() => {
    // authTokenがない場合は何もしない
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('[SessionTimeout] No authToken found, skipping timeout setup');
      return;
    }

    // 初回のアクティビティ更新
    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();

    if (!loginTime) {
      console.log('[SessionTimeout] Initializing loginTime:', now);
      localStorage.setItem('loginTime', now.toString());
    }

    console.log('[SessionTimeout] Setting lastActivity:', now);
    localStorage.setItem('lastActivity', now.toString());

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const activityHandler = (e) => {
      // モーダル内のクリックは無視
      if (e.target.closest('.timeout-modal')) {
        return;
      }

      // イベントハンドラ内で直接更新
      localStorage.setItem('lastActivity', Date.now().toString());
      setShowWarning(false);
    };

    events.forEach(event => {
      window.addEventListener(event, activityHandler, true); // capture phase
    });

    const intervalId = setInterval(() => {
      const currentAuthToken = localStorage.getItem('authToken');
      if (!currentAuthToken) {
        console.log('[SessionTimeout] No authToken, clearing interval');
        clearInterval(intervalId);
        return;
      }

      const loginTimeStr = localStorage.getItem('loginTime');
      const lastActivityStr = localStorage.getItem('lastActivity');

      // loginTimeまたはlastActivityが存在しない場合は、初期化されていないので処理をスキップ
      if (!loginTimeStr || !lastActivityStr) {
        console.log('[SessionTimeout] Missing timestamps, skipping check', {
          loginTimeStr,
          lastActivityStr
        });
        return;
      }

      const loginTime = parseInt(loginTimeStr);
      const lastActivity = parseInt(lastActivityStr);
      const now = Date.now();

      const timeSinceLogin = now - loginTime;
      const elapsed = now - lastActivity;
      const remaining = TIMEOUT_DURATION - elapsed;

      console.log('[SessionTimeout] Check:', {
        timeSinceLogin: Math.floor(timeSinceLogin / 1000 / 60) + ' min',
        elapsed: Math.floor(elapsed / 1000 / 60) + ' min',
        remaining: Math.floor(remaining / 1000 / 60) + ' min'
      });

      if (timeSinceLogin >= ABSOLUTE_TIMEOUT) {
        console.log('[SessionTimeout] ABSOLUTE TIMEOUT - logging out');
        // LocalStorageをクリア
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('loginTime');
        setShowWarning(false);

        if (onLogoutRef.current) {
          onLogoutRef.current();
        }
        return;
      }

      if (elapsed >= TIMEOUT_DURATION) {
        console.log('[SessionTimeout] INACTIVITY TIMEOUT - logging out');
        // LocalStorageをクリア
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('loginTime');
        setShowWarning(false);

        if (onLogoutRef.current) {
          onLogoutRef.current();
        }
      } else if (remaining <= WARNING_DURATION && remaining > 0) {
        console.log('[SessionTimeout] WARNING - showing timeout warning');
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
  }, []); // 依存配列を空にして、マウント時のみ実行

  return { showWarning, timeLeft, extendSession, logout };
};