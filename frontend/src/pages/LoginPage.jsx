import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/LoginPage.css';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'ログイン - Athena Scout';
    fetchLoginPage();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;

      // トークンを localStorage に保存
      localStorage.setItem('authToken', token);

      // apiClient のデフォルトヘッダーにトークンを設定
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // ログイン成功時のコールバック（Context APIのlogin関数がlocalStorageに保存する）
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>🎯 採用ツール</h1>
          <h2>ログイン</h2>

          <form onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ユーザー名を入力"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="login-info">
            <p>社内メンバーのみが使用できます。</p>
            <p>IDとパスワードは管理者に確認してください。</p>
          </div>
        </div>
      </div>
    </div>
  );
}