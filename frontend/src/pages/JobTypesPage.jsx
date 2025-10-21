import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/JobTypesPage.css';

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', definition: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchJobTypes = async () => {
    try {
      const response = await axios.get('/api/job-types');
      setJobTypes(response.data);
    } catch (error) {
      console.error('Error fetching job types:', error);
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ name: '', definition: '' });
  };

  const handleEditClick = (jobType) => {
    setEditingId(jobType.id);
    setIsAdding(false);
    setFormData({ name: jobType.name, definition: jobType.definition });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.definition.trim()) {
      alert('職種名と定義を入力してください');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/job-types/${editingId}`, formData);
        alert('職業適性を更新しました');
      } else {
        await axios.post('/api/job-types', formData);
        alert('職業適性を追加しました');
      }
      fetchJobTypes();
      setEditingId(null);
      setIsAdding(false);
      setFormData({ name: '', definition: '' });
    } catch (error) {
      console.error('Error saving job type:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当に削除しますか？')) {
      try {
        await axios.delete(`/api/job-types/${id}`);
        alert('職業適性を削除しました');
        fetchJobTypes();
      } catch (error) {
        console.error('Error deleting job type:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', definition: '' });
  };

  return (
    <div className="job-types-page">
      <div className="page-header">
        <h1>職業適性管理</h1>
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
          <h2>{editingId ? '職業適性を編集' : '職業適性を追加'}</h2>
          <div className="form-group">
            <label>職種名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：営業職、企画職"
            />
          </div>
          <div className="form-group">
            <label>定義 *</label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              placeholder="例：相手の懐に臆さず飛び込み、多くの人との関係の輪を広げていく"
              rows="4"
            />
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

      <div className="job-types-list">
        <h2>登録済み職業適性</h2>
        {jobTypes.length === 0 ? (
          <p>職業適性がまだ登録されていません</p>
        ) : (
          <div className="job-types-grid">
            <div className="grid-header">職種名</div>
            <div className="grid-header">定義</div>
            <div className="grid-header">操作</div>

            {jobTypes.map((jobType) => (
              <React.Fragment key={jobType.id}>
                <div className="grid-cell">{jobType.name}</div>
                <div className="grid-cell">{jobType.definition}</div>
                <div className="grid-cell grid-actions">
                  <button
                    onClick={() => handleEditClick(jobType)}
                    className="btn-edit"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(jobType.id)}
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
    </div>
  );
}