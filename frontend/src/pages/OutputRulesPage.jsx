import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/OutputRulesPage.css';

export default function OutputRulesPage() {
  const [outputRules, setOutputRules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_text: '',
    description: '',
    is_active: true,
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    document.title = '出力ルール管理 - Athena Scout';
    fetchOutputRules();
  }, []);

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
      rule_name: '',
      rule_text: '',
      description: '',
      is_active: true,
    });
  };

  const handleEditClick = (rule) => {
    setEditingId(rule.id);
    setIsAdding(false);
    setFormData({
      rule_name: rule.rule_name,
      rule_text: rule.rule_text,
      description: rule.description,
      is_active: rule.is_active,
    });
  };

  const handleSave = async () => {
    if (!formData.rule_name.trim() || !formData.rule_text.trim()) {
      alert('ルール名とルール内容を入力してください');
      return;
    }

    try {
      if (editingId) {
        await apiClient.put(`/api/output-rules/${editingId}`, formData);
        alert('出力ルールを更新しました');
      } else {
        await apiClient.post('/api/output-rules', formData);
        alert('出力ルールを追加しました');
      }
      fetchOutputRules();
      setEditingId(null);
      setIsAdding(false);
      setFormData({
        rule_name: '',
        rule_text: '',
        description: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving output rule:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当に削除しますか？')) {
      try {
        await apiClient.delete(`/api/output-rules/${id}`);
        alert('出力ルールを削除しました');
        fetchOutputRules();
      } catch (error) {
        console.error('Error deleting output rule:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      rule_name: '',
      rule_text: '',
      description: '',
      is_active: true,
    });
  };

  return (
    <div className="output-rules-page">
      <div className="page-header">
        <h1>出力ルール管理</h1>
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
          <h2>{editingId ? '出力ルールを編集' : '出力ルールを追加'}</h2>
          <div className="form-group">
            <label>ルール名 *</label>
            <input
              type="text"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="例：default_rule、簡潔ルール"
            />
          </div>
          <div className="form-group">
            <label>説明</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例：標準出力ルール、営業職向けルール"
            />
          </div>
          <div className="form-group">
            <label>ルール内容 *</label>
            <textarea
              value={formData.rule_text}
              onChange={(e) => setFormData({ ...formData, rule_text: e.target.value })}
              placeholder="例：- 【】内の文章のみを出力する&#10;- 200-300文字程度..."
              rows="8"
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              有効にする
            </label>
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

      <div className="output-rules-list">
        <h2>登録済み出力ルール</h2>
        {outputRules.length === 0 ? (
          <p>出力ルールがまだ登録されていません</p>
        ) : (
          <div className="rules-grid">
            {outputRules.map((rule) => (
              <div key={rule.id} className="rule-card">
                <div className="rule-header">
                  <h3>{rule.rule_name}</h3>
                  <span className={`status ${rule.is_active ? 'active' : 'inactive'}`}>
                    {rule.is_active ? '有効' : '無効'}
                  </span>
                </div>
                {rule.description && (
                  <p className="rule-description">{rule.description}</p>
                )}
                <p className="rule-text">{rule.rule_text}</p>
                <div className="rule-actions">
                  <button
                    onClick={() => handleEditClick(rule)}
                    className="btn-edit"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="btn-delete"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}