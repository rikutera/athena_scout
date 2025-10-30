import React from 'react';
import '../styles/SessionTimeoutWarning.css';

export default function SessionTimeoutWarning({ timeLeft, onExtend, onLogout }) {
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
          <button className="btn-extend" onClick={onExtend}>
            続行
          </button>
          <button className="btn-logout-now" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
