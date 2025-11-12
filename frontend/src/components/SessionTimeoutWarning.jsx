import React from 'react';
import '../styles/SessionTimeoutWarning.css';

export default function SessionTimeoutWarning({ timeLeft, onExtend, onLogout }) {
  const handleLogoutClick = () => {
    console.log('ログアウトボタンがクリックされました');
    console.log('onLogout:', onLogout);
    if (onLogout) {
      onLogout();
    } else {
      console.error('onLogout関数が渡されていません');
    }
  };

  const handleExtendClick = () => {
    console.log('続行ボタンがクリックされました');
    if (onExtend) {
      onExtend();
    }
  };

  return (
    <div className="timeout-modal-overlay">
      <div className="timeout-modal">
        <div className="timeout-icon">⏰</div>
        <h2>セッションタイムアウト警告</h2>
        <p>
          操作がないため、あと <strong>{timeLeft}分</strong> で自動的にログアウトされます。
        </p>
        <p className="timeout-hint">
          セッションを延長するには「続行」をクリックしてください。
        </p>
        <div className="timeout-actions">
          <button className="btn-extend" onClick={handleExtendClick}>
            続行
          </button>
          <button className="btn-logout-now" onClick={handleLogoutClick}>
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}