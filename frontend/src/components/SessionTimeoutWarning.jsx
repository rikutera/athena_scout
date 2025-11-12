import React from 'react';
import '../styles/SessionTimeoutWarning.css';

export default function SessionTimeoutWarning({ timeLeft, onExtend, onLogout }) {
  console.log('SessionTimeoutWarning rendered');
  console.log('Props:', { timeLeft, onExtend, onLogout });

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== ログアウトボタンクリック ===');
    console.log('Event:', e);
    console.log('onLogout:', onLogout);
    console.log('typeof onLogout:', typeof onLogout);
    
    if (typeof onLogout === 'function') {
      console.log('onLogout関数を実行します');
      onLogout();
      console.log('onLogout関数を実行しました');
    } else {
      console.error('onLogoutが関数ではありません:', onLogout);
    }
  };

  const handleExtendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== 続行ボタンクリック ===');
    if (typeof onExtend === 'function') {
      onExtend();
    }
  };

  return (
    <div className="timeout-modal-overlay" onClick={(e) => {
      console.log('Overlay clicked');
      e.stopPropagation();
    }}>
      <div className="timeout-modal" onClick={(e) => {
        console.log('Modal clicked');
        e.stopPropagation();
      }}>
        <div className="timeout-icon">⏰</div>
        <h2>セッションタイムアウト警告</h2>
        <p>
          操作がないため、あと <strong>{timeLeft}分</strong> で自動的にログアウトされます。
        </p>
        <p className="timeout-hint">
          セッションを延長するには「続行」をクリックしてください。
        </p>
        <div className="timeout-actions">
          <button 
            className="btn-extend" 
            onClick={handleExtendClick}
            type="button"
          >
            続行
          </button>
          <button 
            className="btn-logout-now" 
            onClick={handleLogoutClick}
            type="button"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}