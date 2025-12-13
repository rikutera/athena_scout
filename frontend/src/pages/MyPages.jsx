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
    username_jp: '',
    password: '',
    passwordConfirm: '',
    user_status: 'active',
    user_role: 'user',
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 生成履歴用の状態
  const [generationHistory, setGenerationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // ページネーション用の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  useEffect(() => {
    document.title = 'マイページ - Athena Scout';
    fetchUserInfo();
    fetchGenerationHistory();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.user);
      setFormData({
        username: response.data.user.username,
        username_jp: response.data.user.username_jp || '',
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

  const fetchGenerationHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.get('/api/my-generation-history?limit=50');
      setGenerationHistory(response.data);
    } catch (error) {
      console.error('Error fetching generation history:', error);
    } finally {
      setHistoryLoading(false);
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
        username_jp: formData.username_jp,
        user_status: formData.user_status,
        user_role: formData.user_role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await apiClient.put('/api/auth/me', updateData);

      setUser(response.data.user);
      updateUser(response.data.user);

      setMessage('ユーザー情報を更新しました');
      setIsEditing(false);

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
      username_jp: user.username_jp || '',
      password: '',
      passwordConfirm: '',
      user_status: user.user_status,
      user_role: user.user_role,
    });
  };

  const handleShowHistoryDetail = (history) => {
    setSelectedHistory(history);
    setShowHistoryModal(true);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedHistory(null);
  };

  const handleDeleteHistory = async (historyId) => {
    if (!window.confirm('この履歴を削除してもよろしいですか？')) {
      return;
    }

    try {
      await apiClient.delete(`/api/my-generation-history/${historyId}`);
      setMessage('履歴を削除しました');
      fetchGenerationHistory();
      if (selectedHistory?.id === historyId) {
        handleCloseHistoryModal();
      }
    } catch (error) {
      console.error('Error deleting history:', error);
      setError('履歴の削除に失敗しました');
    }
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
        <>
          <div className="user-info-display">
            <div className="info-card">
              <h2>ユーザー情報</h2>

              <div className="info-row">
                <label>ユーザー名</label>
                <p>{user?.username}</p>
              </div>

              <div className="info-row">
                <label>日本語名</label>
                <p>{user?.username_jp || '未設定'}</p>
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
                    {user?.user_role === 'admin' && '管理者'}
                    {user?.user_role === 'manager' && '責任者'}
                    {user?.user_role === 'user' && 'ユーザー'}
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

            {/* 管理者専用リンク（追加） */}
            {user?.user_role === 'admin' && (
              <div className="info-card admin-section" style={{ marginTop: '20px' }}>
                <h2>管理機能</h2>
                <Link to="/admin/usage" className="btn-edit" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                  API使用量を確認
                </Link>
              </div>
            )}
          </div>

          {/* 生成履歴セクション */}
          <div className="generation-history-section">
            <div className="section-header">
              <h2>生成メッセージ履歴</h2>
              <span className="history-count">全{generationHistory.length}件</span>
            </div>

            {historyLoading ? (
              <p>読み込み中...</p>
            ) : generationHistory.length === 0 ? (
              <p className="no-history">まだ生成履歴がありません</p>
            ) : (
              <>
                <div className="history-list">
                  {generationHistory
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((history) => (
                      <div key={history.id} className="history-item">
                        <div className="history-header">
                          <div className="history-meta">
                            <span className="history-template-name">{history.template_name || '未設定'}</span>
                          </div>
                          <span className="history-date">
                            {new Date(history.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <div className="history-preview">
                          {history.generated_comment.substring(0, 100)}
                          {history.generated_comment.length > 100 && '...'}
                        </div>
                        <div className="history-actions">
                          <button
                            onClick={() => handleShowHistoryDetail(history)}
                            className="btn-view-detail"
                          >
                            詳細
                          </button>
                          {/* <button
                            onClick={() => handleDeleteHistory(history.id)}
                            className="btn-delete-history"
                          >
                            削除
                          </button> */}
                        </div>
                      </div>
                    ))}
                </div>
                {generationHistory.length > itemsPerPage && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      前へ
                    </button>
                    <span className="pagination-info">
                      {currentPage} / {Math.ceil(generationHistory.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(generationHistory.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(generationHistory.length / itemsPerPage)}
                      className="pagination-btn"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
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
              <label>日本語名</label>
              <input
                type="text"
                value={formData.username_jp}
                onChange={(e) => setFormData({ ...formData, username_jp: e.target.value })}
                placeholder="山田 太郎"
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
                    <option value="manager">責任者</option>
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

      {/* 履歴詳細モーダル */}
      {showHistoryModal && selectedHistory && (
        <div className="modal-overlay" onClick={handleCloseHistoryModal}>
          <div className="modal-content history-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>生成メッセージ詳細</h2>
              <button className="modal-close" onClick={handleCloseHistoryModal}>×</button>
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
                {/* <button
                  onClick={() => handleDeleteHistory(selectedHistory.id)}
                  className="btn-delete-modal"
                >
                  削除
                </button> */}
                <button onClick={handleCloseHistoryModal} className="btn-close-modal">
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
