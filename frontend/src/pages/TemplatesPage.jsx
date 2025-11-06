import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import { UserContext } from '../contexts/UserContext';
import '../styles/TemplatesPage.css';

export default function TemplatesPage() {
  const { user } = useContext(UserContext);
  const [templates, setTemplates] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [outputRules, setOutputRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    job_type: '',
    industry: '',
    company_requirement: '',
    offer_template: '',
    output_rule_id: '',
  });

  // モーダル状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.user_role === 'admin';
  const isAdminOrManager = user?.user_role === 'admin' || user?.user_role === 'manager';

  useEffect(() => {
    document.title = 'テンプレート管理 - Athena Scout';
    fetchTemplates();
    fetchJobTypes();
    fetchOutputRules();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await apiClient.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchJobTypes = async () => {
    try {
      const response = await apiClient.get('/api/job-types');
      setJobTypes(response.data);
    } catch (error) {
      console.error('Error fetching job types:', error);
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

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      template_name: '',
      job_type: '',
      industry: '',
      company_requirement: '',
      offer_template: '',
      output_rule_id: '',
    });
  };

  const handleEditClick = (template) => {
    setEditingId(template.id);
    setIsAdding(false);
    setFormData({
      template_name: template.template_name,
      job_type: template.job_type,
      industry: template.industry,
      company_requirement: template.company_requirement,
      offer_template: template.offer_template,
      output_rule_id: template.output_rule_id || '',
    });
  };

  const handleSave = async () => {
    if (!formData.template_name.trim() || !formData.job_type.trim() || !formData.output_rule_id) {
      alert('テンプレート名、職種、出力ルールは必須です');
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/api/templates/${editingId}`, formData);
        alert('テンプレートを更新しました');
      } else {
        await apiClient.post('/api/templates', formData);
        alert('テンプレートを追加しました');
      }
      fetchTemplates();
      setEditingId(null);
      setIsAdding(false);
      setFormData({
        template_name: '',
        job_type: '',
        industry: '',
        company_requirement: '',
        offer_template: '',
        output_rule_id: '',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当に削除しますか？')) {
      try {
        await apiClient.delete(`/api/templates/${id}`);
        alert('テンプレートを削除しました');
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      template_name: '',
      job_type: '',
      industry: '',
      company_requirement: '',
      offer_template: '',
      output_rule_id: '',
    });
  };

  const handleViewUsers = async (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setIsEditing(false);
    
    try {
      // 割り当てられているユーザーを取得
      const assignedResponse = await apiClient.get(`/api/templates/${template.id}/users`);
      setModalUsers(assignedResponse.data);
      setSelectedUserIds(assignedResponse.data.map(u => u.id));

      // 管理者または責任者の場合は全ユーザーも取得
      if (isAdminOrManager) {
        const allUsersResponse = await apiClient.get('/api/users');
        setAllUsers(allUsersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setModalError('ユーザー情報の取得に失敗しました');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDuplicate = async (template) => {
    // 確認ダイアログを表示
    if (!window.confirm(`「${template.template_name}」を複製しますか？`)) {
      return; // キャンセルされた場合は何もしない
    }

    try {
      // 新しい複製専用エンドポイントを使用（ユーザー割り当ても自動的に行われる）
      // 空のオブジェクトを送信（バックエンドがタイムスタンプを自動生成）
      const response = await apiClient.post(`/api/templates/${template.id}/duplicate`, {});
      
      if (response.data.success) {
        alert(`テンプレートを複製しました: ${response.data.template_name}`);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('複製に失敗しました');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setModalUsers([]);
    setAllUsers([]);
    setSelectedUserIds([]);
    setModalError(null);
    setIsEditing(false);
  };

  const handleEditMode = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 元の選択状態に戻す
    setSelectedUserIds(modalUsers.map(u => u.id));
  };

  const handleUserToggle = (userId) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSaveAssignment = async () => {
    try {
      await apiClient.post(`/api/templates/${selectedTemplate.id}/assign-users`, {
        user_ids: selectedUserIds
      });

      alert('ユーザー割り当てを更新しました');
      
      // 割り当てられたユーザーリストを再取得
      const response = await apiClient.get(`/api/templates/${selectedTemplate.id}/users`);
      setModalUsers(response.data);
      setIsEditing(false);
      
      // テンプレート一覧も更新（管理者以外のユーザーの表示に影響する可能性があるため）
      fetchTemplates();
    } catch (error) {
      console.error('Error saving user assignment:', error);
      alert('ユーザー割り当ての更新に失敗しました');
    }
  };

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'manager':
        return '責任者';
      case 'user':
        return '一般ユーザー';
      default:
        return role;
    }
  };

  return (
    <div className="templates-page">
      <div className="page-header">
        <h1>テンプレート管理</h1>
        <Link to="/" className="btn-back">
          ← オファーメッセージ生成に戻る
        </Link>
      </div>

      {!isAdding && !editingId && (
        <button onClick={handleAddClick} className="btn-add">
          + 新規追加
        </button>
      )}

      {(isAdding || editingId) && (
        <div className="form-card">
          <h2>{editingId ? 'テンプレートを編集' : 'テンプレートを追加'}</h2>
          <div className="form-group">
            <label>テンプレート名 *</label>
            <input
              type="text"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="例：営業職向け2024年新卒"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>職種 *</label>
              <select
                value={formData.job_type}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
              >
                <option value="">選択してください</option>
                {jobTypes.map((job) => (
                  <option key={job.id} value={job.name}>
                    {job.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>業種</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="例：IT、金融、製造業"
              />
            </div>
          </div>
          <div className="form-group">
            <label>企業が望むこと</label>
            <textarea
              value={formData.company_requirement}
              onChange={(e) => setFormData({ ...formData, company_requirement: e.target.value })}
              placeholder="例：マーケット感度があり、顧客理解が深い人材"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>オファー文テンプレート *</label>
            <textarea
              value={formData.offer_template}
              onChange={(e) => setFormData({ ...formData, offer_template: e.target.value })}
              placeholder="例：【業務内容】\n【今のあなたに期待すること】\n【待遇】"
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>出力ルール *</label>
            <select
              value={formData.output_rule_id}
              onChange={(e) => setFormData({ ...formData, output_rule_id: e.target.value })}
            >
              <option value="">選択してください</option>
              {outputRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.rule_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button onClick={handleSave} className="btn-save">
              保存
            </button>
            <button onClick={handleCancel} className="btn-cancel">
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="templates-list">
        <h2>登録済みテンプレート</h2>
        {templates.length === 0 ? (
          <p>テンプレートがまだ登録されていません</p>
        ) : (
          <div className="templates-grid">
            <div className="grid-header">テンプレート名</div>
            <div className="grid-header">職種</div>
            <div className="grid-header">業種</div>
            <div className="grid-header">操作</div>

            {templates.map((template) => (
              <React.Fragment key={template.id}>
                <div className="grid-cell">{template.template_name}</div>
                <div className="grid-cell">{template.job_type}</div>
                <div className="grid-cell">{template.industry || '—'}</div>
                <div className="grid-cell grid-actions">
                  <button
                    onClick={() => handleViewUsers(template)}
                    className="btn-view-users"
                  >
                    割当ユーザー
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="btn-duplicate"
                  >
                    複製
                  </button>
                  <button
                    onClick={() => handleEditClick(template)}
                    className="btn-edit"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn-delete"
                  >
                    削除
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>割り当てユーザー管理2</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <p className="template-name">
                <strong>テンプレート：</strong> {selectedTemplate?.template_name}
              </p>

              {modalLoading && <p className="loading">読み込み中...</p>}

              {modalError && <p className="error">{modalError}</p>}

              {!modalLoading && !isEditing && (
                <>
                  {modalUsers.length === 0 && (
                    <p className="no-users">割り当てられたユーザーがいません</p>
                  )}

                  {modalUsers.length > 0 && (
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>ユーザー名</th>
                          <th>ロール</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>
                              <span className={`role-badge role-${user.user_role}`}>
                                {getRoleBadgeText(user.user_role)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {!modalLoading && isEditing && (
                <div className="user-selection">
                  <p className="selection-help">割り当てるユーザーをチェックしてください</p>
                  <div className="user-checkboxes">
                    {allUsers.map((user) => (
                      <label key={user.id} className="user-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                        />
                        <span className="user-info">
                          <span className="username">{user.username}</span>
                          <span className={`role-badge role-${user.user_role}`}>
                            {getRoleBadgeText(user.user_role)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!isEditing && isAdminOrManager && (
                <>
                  <button className="btn-edit-users" onClick={handleEditMode}>
                    ユーザーを編集
                  </button>
                  <button className="btn-close" onClick={handleCloseModal}>
                    閉じる
                  </button>
                </>
              )}
              
              {!isEditing && !isAdminOrManager && (
                <button className="btn-close" onClick={handleCloseModal}>
                  閉じる
                </button>
              )}

              {isEditing && (
                <>
                  <button className="btn-save" onClick={handleSaveAssignment}>
                    保存
                  </button>
                  <button className="btn-cancel" onClick={handleCancelEdit}>
                    キャンセル
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}