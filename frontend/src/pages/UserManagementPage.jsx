import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import apiClient from '../utils/apiClient';
import '../styles/UserManagement.css';

export default function UserManagementPage() {
  const { user: currentUser } = useUser();
  const isAdmin = currentUser?.user_role === 'admin';

  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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

  // 履歴モーダル用の状態
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('login');
  const [logsLoading, setLogsLoading] = useState(false);

  // 生成履歴詳細モーダル
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);


  useEffect(() => {
    document.title = 'ユーザー管理 - Athena Scout';
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      passwordConfirm: '',
      user_status: 'active',
      user_role: 'user',
    });
    setError('');
    setMessage('');
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.username.trim()) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('パスワードを入力してください');
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
      if (editingUser) {
        const updateData = {
          username: formData.username,
          user_status: formData.user_status,
          user_role: formData.user_role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await apiClient.put(`/api/users/${editingUser.id}`, updateData);
        setMessage('ユーザー情報を更新しました');
      } else {
        await apiClient.post('/api/users', {
          username: formData.username,
          password: formData.password,
          user_status: formData.user_status,
          user_role: formData.user_role,
        });
        setMessage('ユーザーを追加しました');
      }

      fetchUsers();
      handleCancel();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.error || 'ユーザーの保存に失敗しました');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      passwordConfirm: '',
      user_status: user.user_status,
      user_role: user.user_role,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`ユーザー「${username}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/users/${userId}`);
      setMessage('ユーザーを削除しました');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.error || 'ユーザーの削除に失敗しました');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      passwordConfirm: '',
      user_status: 'active',
      user_role: 'user',
    });
    setError('');
  };

  // 履歴表示
  const handleShowLogs = async (user) => {
    setSelectedUser(user);
    setShowLogsModal(true);
    setActiveTab('login');
    setLogsLoading(true);

    try {
      const loginResponse = await apiClient.get('/api/admin/login-logs', {
        params: { user_id: user.id, limit: 50 }
      });
      setLoginLogs(loginResponse.data);

      const activityResponse = await apiClient.get('/api/admin/activity-logs', {
        params: { user_id: user.id, limit: 50 }
      });
      setActivityLogs(activityResponse.data);

      const generationResponse = await apiClient.get('/api/admin/generation-history', {
        params: { user_id: user.id, limit: 50 }
      });
      setGenerationHistory(generationResponse.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('履歴の取得に失敗しました');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCloseLogsModal = () => {
    setShowLogsModal(false);
    setSelectedUser(null);
    setLoginLogs([]);
    setActivityLogs([]);
    setGenerationHistory([]);
  };

  const handleShowDetail = (history) => {
    setSelectedHistory(history);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedHistory(null);
  };

  if (loading) {
    return <div className="user-management"><p>読み込み中...</p></div>;
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>ユーザー管理</h1>
        <Link to="/" className="btn-back">
          ← オファーメッセージ生成に戻る
        </Link>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {!showAddForm ? (
        <>
          {isAdmin && (
            <div className="action-bar">
              <button onClick={handleAddNew} className="btn-add">
                + 新規ユーザー追加
              </button>
            </div>
          )}

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ユーザー名</th>
                  <th>ステータス</th>
                  <th>ロール</th>
                  <th>最終ログイン</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`status-badge ${user.user_status}`}>
                        {user.user_status === 'active' ? 'アクティブ' : '無効'}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge ${user.user_role}`}>
                        {user.user_role === 'admin' && '管理者'}
                        {user.user_role === 'manager' && '責任者'}
                        {user.user_role === 'user' && 'ユーザー'}
                      </span>
                    </td>
                    <td>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString('ja-JP')
                        : 'ログインなし'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleShowLogs(user)}
                        className="btn-logs-small"
                      >
                        履歴
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            className="btn-edit-small"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="btn-delete-small"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="user-form">
          <h2>{editingUser ? 'ユーザー編集' : '新規ユーザー追加'}</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>ユーザー名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="ユーザー名"
                autoComplete="off"
                required
              />
            </div>

            <div className="form-group">
              <label>
                パスワード {editingUser ? '（変更しない場合は空白）' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="パスワード（6文字以上）"
                autoComplete="new-password"
                required={!editingUser}
              />
            </div>

            <div className="form-group">
              <label>パスワード確認 {!editingUser && '*'}</label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                placeholder="パスワード（確認）"
                autoComplete="new-password"
                required={!editingUser}
              />
            </div>

            <div className="form-group">
              <label>ユーザーステータス *</label>
              <select
                value={formData.user_status}
                onChange={(e) => setFormData({ ...formData, user_status: e.target.value })}
                required
              >
                <option value="active">アクティブ</option>
                <option value="inactive">無効</option>
              </select>
            </div>

            <div className="form-group">
              <label>ユーザーロール *</label>
              <select
                value={formData.user_role}
                onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                required
              >
                <option value="user">ユーザー</option>
                <option value="manager">責任者</option>
                <option value="admin">管理者</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editingUser ? '更新' : '追加'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-cancel">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 履歴モーダル */}
      {showLogsModal && (
        <div className="modal-overlay" onClick={handleCloseLogsModal}>
          <div className="modal-content logs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser?.username} の履歴</h2>
              <button className="modal-close" onClick={handleCloseLogsModal}>×</button>
            </div>

            <div className="tabs">
              <button
                className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                ログイン履歴
              </button>
              <button
                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                利用履歴
              </button>
              <button
                className={`tab ${activeTab === 'generation' ? 'active' : ''}`}
                onClick={() => setActiveTab('generation')}
              >
                生成履歴
              </button>
            </div>

            <div className="modal-body">
              {logsLoading ? (
                <p>読み込み中...</p>
              ) : (
                <>
                  {activeTab === 'login' && (
                    <div className="logs-table">
                      {loginLogs.length === 0 ? (
                        <p>ログイン履歴がありません</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>ログイン日時</th>
                              <th>IPアドレス</th>
                              <th>ユーザーエージェント</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loginLogs.map((log) => (
                              <tr key={log.id}>
                                <td>{new Date(log.login_at).toLocaleString('ja-JP')}</td>
                                <td>{log.ip_address}</td>
                                <td className="user-agent">{log.user_agent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="logs-table">
                      {activityLogs.length === 0 ? (
                        <p>利用履歴がありません</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>日時</th>
                              <th>アクション</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activityLogs.map((log) => (
                              <tr key={log.id}>
                                <td>{new Date(log.created_at).toLocaleString('ja-JP')}</td>
                                <td>{log.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'generation' && (
                    <div className="logs-table">
                      {generationHistory.length === 0 ? (
                        <p>生成履歴がありません</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>生成日時</th>
                              <th>テンプレート名</th>
                              <th>生成メッセージ（プレビュー）</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generationHistory.map((history) => (
                              <tr key={history.id}>
                                <td>{new Date(history.created_at).toLocaleString('ja-JP')}</td>
                                <td>{history.template_name || '未設定'}</td>
                                <td className="message-preview">
                                  {history.generated_comment.substring(0, 50)}
                                  {history.generated_comment.length > 50 && '...'}
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleShowDetail(history)}
                                    className="btn-view-detail-small"
                                  >
                                    詳細
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 生成履歴詳細モーダル */}
      {showDetailModal && selectedHistory && (
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>生成メッセージ詳細</h2>
              <button className="modal-close" onClick={handleCloseDetailModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>生成情報</h3>
                <div className="detail-row">
                  <span className="detail-label">テンプレート名：</span>
                  <span>{selectedHistory.template_name || '未設定'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">職種：</span>
                  <span>{selectedHistory.job_type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">業種：</span>
                  <span>{selectedHistory.industry}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">生成日時：</span>
                  <span>{new Date(selectedHistory.created_at).toLocaleString('ja-JP')}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>学生プロフィール</h3>
                <div className="detail-content">
                  {selectedHistory.student_profile}
                </div>
              </div>

              <div className="detail-section">
                <h3>生成メッセージ</h3>
                <div className="detail-content generated-message">
                  {selectedHistory.generated_comment}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={handleCloseDetailModal} className="btn-close-modal">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}