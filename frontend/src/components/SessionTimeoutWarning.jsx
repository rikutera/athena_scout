import React from 'react';
import '../styles/SessionTimeoutWarning.css';

export default function SessionTimeoutWarning({ timeLeft, onExtend, onLogout }) {
  const handleOverlayClick = (e) => {
    // オーバーレイ自体がクリックされた場合は何もしない
    if (e.target === e.currentTarget) {
      e.stopPropagation();
    }
  };

  const handleModalClick = (e) => {
    // モーダル内のクリックは伝播させない
    e.stopPropagation();
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== ログアウトボタンクリック ===');
    if (onLogout) {
      onLogout();
    }
  };

  const handleExtendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== 続行ボタンクリック ===');
    if (onExtend) {
      onExtend();
    }
  };

  return (
    <div 
      className="timeout-modal-overlay" 
      onClick={handleOverlayClick}
    >
      <div 
        className="timeout-modal" 
        onClick={handleModalClick}
      >
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
            onMouseDown={handleExtendClick}
            onTouchStart={handleExtendClick}
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            続行
          </button>
          <button 
            className="btn-logout-now"
            onClick={handleLogoutClick}
            onMouseDown={handleLogoutClick}
            onTouchStart={handleLogoutClick}
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}