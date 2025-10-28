import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { useUser } from '../contexts/UserContext';
import '../styles/MyPages.css';

export default function MyPage() {
  const { updateUser } = useUser();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    user_status: 'active',
    user_role: 'user',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.user);
      setFormData({
        username: response.data.user.username,
        password: '',
        passwordConfirm: '',
        user_status: response.data.user.user_status,
        user_role: response.data.user.user_role,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('ユーザー情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    if (!formData.username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (formData.password && formData.password !== formData.passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        user_status: formData.user_status,
        user_role: formData.user_role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await apiClient.put('/api/auth/me', updateData);
      
      // ローカルステートを更新
      setUser(response.data.user);
      
      // Context APIのグローバルステートを更新
      updateUser(response.data.user);
      
      setMessage('ユーザー情報を更新しました');
      setIsEditing(false);
      
      // パスワード入力フィールドをクリア
      setFormData({
        ...formData,
        password: '',
        passwordConfirm: '',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.error || 'ユーザー情報の更新に失敗しました');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setMessage('');
    setFormData({
      username: user.username,
      password: '',
      passwordConfirm: '',
      user_status: user.user_status,
      user_role: user.user_role,
    });
  };

  if (loading) {
    return <div className="mypage"><p>読み込み中...</p></div>;
  }

  return (
    <div className="mypage">
      <div className="page-header">
        <h1>マイページ</h1>
        <Link to="/" className="btn-back">
          ← ホームに戻る
        </Link>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {!isEditing ? (
        // 表示モード
        <div className="user-info-display">
          <div className="info-card">
            <h2>ユーザー情報</h2>
            
            <div className="info-row">
              <label>ユーザー名</label>
              <p>{user?.username}</p>
            </div>

            <div className="info-row">
              <label>ユーザーステータス</label>
              <p>
                <span className={`status-badge ${user?.user_status}`}>
                  {user?.user_status === 'active' ? 'アクティブ' : 'アクティブでない'}
                </span>
              </p>
            </div>

            <div className="info-row">
              <label>ユーザーロール</label>
              <p>
                <span className={`role-badge ${user?.user_role}`}>
                  {user?.user_role === 'admin' ? '管理者' : 'ユーザー'}
                </span>
              </p>
            </div>

            <div className="info-row">
              <label>登録日時</label>
              <p>{new Date(user?.created_at).toLocaleString('ja-JP')}</p>
            </div>

            <button onClick={() => setIsEditing(true)} className="btn-edit">
              編集
            </button>
          </div>
        </div>
      ) : (
        // 編集モード
        <div className="user-info-edit">
          <div className="form-card">
            <h2>ユーザー情報を編集</h2>

            <div className="form-group">
              <label>ユーザー名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="新しいユーザー名"
              />
            </div>

            <div className="form-group">
              <label>新しいパスワード（変更しない場合は空白）</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="新しいパスワード"
              />
            </div>

            <div className="form-group">
              <label>パスワード確認</label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                placeholder="新しいパスワード（確認）"
              />
            </div>

            {/* 管理者のみステータスとロールを編集可能 */}
            {user?.user_role === 'admin' ? (
              <>
                <div className="form-group">
                  <label>ユーザーステータス</label>
                  <select
                    value={formData.user_status}
                    onChange={(e) => setFormData({ ...formData, user_status: e.target.value })}
                  >
                    <option value="active">アクティブ</option>
                    <option value="inactive">アクティブでない</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>ユーザーロール</label>
                  <select
                    value={formData.user_role}
                    onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                  >
                    <option value="user">ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="info-row">
                  <label>ユーザーステータス</label>
                  <p>
                    <span className={`status-badge ${user?.user_status}`}>
                      {user?.user_status === 'active' ? 'アクティブ' : 'アクティブでない'}
                    </span>
                  </p>
                </div>

                <div className="info-row">
                  <label>ユーザーロール</label>
                  <p>
                    <span className={`role-badge ${user?.user_role}`}>
                      {user?.user_role === 'admin' ? '管理者' : 'ユーザー'}
                    </span>
                  </p>
                </div>
              </>
            )}

            <div className="form-actions">
              <button onClick={handleSave} className="btn-save">
                保存
              </button>
              <button onClick={handleCancel} className="btn-cancel">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}