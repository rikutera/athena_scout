import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import apiClient from '../utils/apiClient';
import '../styles/TeamsPage.css';

const TeamsPage = () => {
  const { user: currentUser } = useUser();
  const isAdmin = currentUser?.user_role === 'admin';

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [outputRules, setOutputRules] = useState([]);
  const [teamTemplates, setTeamTemplates] = useState([]);
  const [teamOutputRules, setTeamOutputRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
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
    fetchTemplates();
    fetchOutputRules();
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

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchOutputRules = async () => {
    try {
      const response = await apiClient.get('/api/output-rules');
      setOutputRules(response.data);
    } catch (error) {
      console.error('Error fetching output rules:', error);
    }
  };

  const fetchTeamAssignments = async (teamId) => {
    try {
      const [templatesRes, rulesRes] = await Promise.all([
        apiClient.get(`/api/admin/teams/${teamId}/templates`),
        apiClient.get(`/api/admin/teams/${teamId}/output-rules`)
      ]);
      setTeamTemplates(templatesRes.data);
      setTeamOutputRules(rulesRes.data);
    } catch (error) {
      console.error('Error fetching team assignments:', error);
      setError('割り当ての取得に失敗しました');
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

  // 割り当て管理モーダルを開く
  const handleViewAssignments = async (team) => {
    setSelectedTeam(team);
    await fetchTeamAssignments(team.id);
    setShowAssignmentsModal(true);
  };

  // テンプレートを割り当て
  const handleAssignTemplate = async (templateId) => {
    try {
      await apiClient.post(`/api/admin/teams/${selectedTeam.id}/templates`, {
        templateId: parseInt(templateId)
      });
      await fetchTeamAssignments(selectedTeam.id);
    } catch (error) {
      console.error('Error assigning template:', error);
      alert(error.response?.data?.error || 'テンプレートの割り当てに失敗しました');
    }
  };

  // テンプレートの割り当てを解除
  const handleUnassignTemplate = async (templateId) => {
    if (!window.confirm('このテンプレートの割り当てを解除しますか？')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/teams/${selectedTeam.id}/templates/${templateId}`);
      await fetchTeamAssignments(selectedTeam.id);
    } catch (error) {
      console.error('Error unassigning template:', error);
      alert('テンプレートの割り当て解除に失敗しました');
    }
  };

  // 出力ルールを割り当て
  const handleAssignOutputRule = async (ruleId) => {
    try {
      await apiClient.post(`/api/admin/teams/${selectedTeam.id}/output-rules`, {
        outputRuleId: parseInt(ruleId)
      });
      await fetchTeamAssignments(selectedTeam.id);
    } catch (error) {
      console.error('Error assigning output rule:', error);
      alert(error.response?.data?.error || '出力ルールの割り当てに失敗しました');
    }
  };

  // 出力ルールの割り当てを解除
  const handleUnassignOutputRule = async (ruleId) => {
    if (!window.confirm('この出力ルールの割り当てを解除しますか？')) {
      return;
    }

    try {
      await apiClient.delete(`/api/admin/teams/${selectedTeam.id}/output-rules/${ruleId}`);
      await fetchTeamAssignments(selectedTeam.id);
    } catch (error) {
      console.error('Error unassigning output rule:', error);
      alert('出力ルールの割り当て解除に失敗しました');
    }
  };

  // 割り当て可能なテンプレート一覧を取得
  const getAvailableTemplates = () => {
    const assignedIds = teamTemplates.map(t => t.id);
    return templates.filter(t => !assignedIds.includes(t.id));
  };

  // 割り当て可能な出力ルール一覧を取得
  const getAvailableOutputRules = () => {
    const assignedIds = teamOutputRules.map(r => r.id);
    return outputRules.filter(r => !assignedIds.includes(r.id));
  };

  return (
    <div className="teams-page">
      <div className="page-header">
        <h1>チーム管理</h1>
        <Link to="/" className="btn-back">
          ← オファーメッセージ生成に戻る
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isAdmin && (
        <div className="action-bar">
          <button className="btn-add" onClick={handleAddTeam}>
            + 新規チーム追加
          </button>
        </div>
      )}

      <div className="teams-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>チーム名</th>
              <th>説明</th>
              <th>メンバー数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  チームがまだ登録されていません
                </td>
              </tr>
            ) : (
              teams.map(team => (
                <tr key={team.id}>
                  <td>{team.id}</td>
                  <td>{team.team_name}</td>
                  <td>{team.description || '-'}</td>
                  <td>{team.member_count || 0}人</td>
                  <td>
                    <button
                      className="btn-logs-small"
                      onClick={() => handleViewMembers(team)}
                    >
                      メンバー
                    </button>
                    <button
                      className="btn-logs-small"
                      onClick={() => handleViewAssignments(team)}
                    >
                      割り当て
                    </button>
                    <button
                      className="btn-edit-small"
                      onClick={() => handleEditTeam(team)}
                    >
                      編集
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                          <span className="manager-badge">チーム長</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="member-actions">
                          <button
                            className="btn-toggle-manager"
                            onClick={() => handleToggleManager(member.id, member.is_manager)}
                          >
                            {member.is_manager ? 'チーム長解除' : 'チーム長設定'}
                          </button>
                          <button
                            className="btn-remove-member"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
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
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowMembersModal(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 割り当て管理モーダル */}
      {showAssignmentsModal && selectedTeam && (
        <div className="modal-overlay" onClick={() => setShowAssignmentsModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTeam.team_name} - 割り当て管理</h2>
              <button className="btn-close" onClick={() => setShowAssignmentsModal(false)}>
                ×
              </button>
            </div>

            <div className="assignments-container">
              {/* テンプレート割り当て */}
              <div className="assignment-section">
                <h3>テンプレート ({teamTemplates.length}件)</h3>
                {teamTemplates.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                    割り当てられたテンプレートがありません
                  </p>
                ) : (
                  <div className="assigned-items-list">
                    {teamTemplates.map(template => (
                      <div key={template.id} className="assigned-item">
                        <div className="item-info">
                          <span className="item-name">{template.template_name}</span>
                        </div>
                        <button
                          className="btn-remove-item"
                          onClick={() => handleUnassignTemplate(template.id)}
                        >
                          解除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="add-assignment-form">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignTemplate(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">テンプレートを追加...</option>
                    {getAvailableTemplates().map(template => (
                      <option key={template.id} value={template.id}>
                        {template.template_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 出力ルール割り当て */}
              <div className="assignment-section">
                <h3>出力ルール ({teamOutputRules.length}件)</h3>
                {teamOutputRules.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                    割り当てられた出力ルールがありません
                  </p>
                ) : (
                  <div className="assigned-items-list">
                    {teamOutputRules.map(rule => (
                      <div key={rule.id} className="assigned-item">
                        <div className="item-info">
                          <span className="item-name">{rule.rule_name}</span>
                        </div>
                        <button
                          className="btn-remove-item"
                          onClick={() => handleUnassignOutputRule(rule.id)}
                        >
                          解除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="add-assignment-form">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignOutputRule(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">出力ルールを追加...</option>
                    {getAvailableOutputRules().map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.rule_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAssignmentsModal(false)}>
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
