import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/TemplatesPage.css';

export default function TemplatesPage() {
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
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

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
    
    try {
      const response = await apiClient.get(`/api/templates/${template.id}/users`);
      setModalUsers(response.data);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      setModalError('割り当てユーザーの取得に失敗しました');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
    setModalUsers([]);
    setModalError(null);
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
              placeholder="例：【・・・を経験する中で発揮された・・・の能力】"
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>割り当てユーザー</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <p className="template-name">
                <strong>テンプレート：</strong> {selectedTemplate?.template_name}
              </p>

              {modalLoading && <p className="loading">読み込み中...</p>}

              {modalError && <p className="error">{modalError}</p>}

              {!modalLoading && modalUsers.length === 0 && (
                <p className="no-users">割り当てられたユーザーがいません</p>
              )}

              {!modalLoading && modalUsers.length > 0 && (
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
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={handleCloseModal}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}