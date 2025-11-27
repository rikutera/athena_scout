import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import '../styles/TeamsPage.css';

const TeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    team_name: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'チーム管理 - Athena Scout';
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await apiClient.get('/api/admin/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('チーム一覧の取得に失敗しました');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await apiClient.get(`/api/admin/teams/${teamId}`);
      setSelectedTeam(response.data);
    } catch (error) {
      console.error('Error fetching team details:', error);
      setError('チーム詳細の取得に失敗しました');
    }
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setFormData({ team_name: '', description: '' });
    setShowModal(true);
    setError('');
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setFormData({
      team_name: team.team_name,
      description: team.description || ''
    });
    setShowModal(true);
    setError('');
  };

  const handleSaveTeam = async () => {
    try {
      if (!formData.team_name.trim()) {
        setError('チーム名を入力してください');
        return;
      }

      if (editingTeam) {
        await apiClient.put(`/api/admin/teams/${editingTeam.id}`, formData);
      } else {
        await apiClient.post('/api/admin/teams', formData);
      }

      setShowModal(false);
      setError('');
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      setError(error.response?.data?.error || 'チームの保存に失敗しました');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('本当にこのチームを削除しますか？\nチームに所属するメンバーの情報も削除されます。')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/teams/${teamId}`);
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.error || 'チームの削除に失敗しました');
    }
  };

  const handleViewMembers = async (team) => {
    await fetchTeamDetails(team.id);
    setShowMembersModal(true);
  };

  const handleAddMember = async (userId, isManager = false) => {
    try {
      await apiClient.post(`/api/admin/teams/${selectedTeam.id}/members`, {
        user_id: parseInt(userId),
        is_manager: isManager
      });
      await fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'メンバーの追加に失敗しました');
    }
  };

  const handleToggleManager = async (userId, currentIsManager) => {
    try {
      await apiClient.put(`/api/admin/teams/${selectedTeam.id}/members/${userId}`, {
        is_manager: !currentIsManager
      });
      await fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error toggling manager:', error);
      alert('責任者設定の変更に失敗しました');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('このメンバーをチームから削除しますか？')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/teams/${selectedTeam.id}/members/${userId}`);
      await fetchTeamDetails(selectedTeam.id);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('メンバーの削除に失敗しました');
    }
  };

  // チームに未所属のユーザー一覧を取得
  const getAvailableUsers = () => {
    if (!selectedTeam) return users;
    const memberIds = selectedTeam.members.map(m => m.id);
    return users.filter(u => !memberIds.includes(u.id));
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <h1>チーム管理</h1>
        <button className="btn-add-team" onClick={handleAddTeam}>
          新規チームを追加
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="teams-list">
        {teams.length === 0 ? (
          <div className="empty-state">
            <p>チームがありません</p>
            <p>「新規チームを追加」ボタンからチームを作成してください</p>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-card-header">
                <div>
                  <h3 className="team-name">{team.team_name}</h3>
                  {team.description && (
                    <p className="team-description">{team.description}</p>
                  )}
                  <div className="team-stats">
                    <span>メンバー: {team.member_count}人</span>
                    <span>責任者: {team.manager_count}人</span>
                  </div>
                </div>
                <div className="team-actions">
                  <button
                    className="btn-view-members"
                    onClick={() => handleViewMembers(team)}
                  >
                    メンバー管理
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEditTeam(team)}
                  >
                    編集
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* チーム編集モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTeam ? 'チーム編集' : '新規チーム作成'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>チーム名 *</label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="例：開発チーム"
              />
            </div>

            <div className="form-group">
              <label>説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="チームの説明を入力（任意）"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                キャンセル
              </button>
              <button className="btn-save" onClick={handleSaveTeam}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メンバー管理モーダル */}
      {showMembersModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTeam.team_name} - メンバー管理</h2>
              <button className="btn-close" onClick={() => setShowMembersModal(false)}>
                ×
              </button>
            </div>

            <div className="members-section">
              <h3>現在のメンバー ({selectedTeam.members.length}人)</h3>
              {selectedTeam.members.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  メンバーがいません
                </p>
              ) : (
                <div className="members-list">
                  {selectedTeam.members.map(member => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <span className="member-name">{member.username}</span>
                        <span className="member-role">({member.user_role})</span>
                        {member.is_manager && (
                          <span className="manager-badge">責任者</span>
                        )}
                      </div>
                      <div className="member-actions">
                        <button
                          className="btn-toggle-manager"
                          onClick={() => handleToggleManager(member.id, member.is_manager)}
                        >
                          {member.is_manager ? '責任者解除' : '責任者に設定'}
                        </button>
                        <button
                          className="btn-remove-member"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="add-member-form">
                <select
                  id="new-member-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddMember(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">メンバーを追加...</option>
                  {getAvailableUsers().map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.user_role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowMembersModal(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
