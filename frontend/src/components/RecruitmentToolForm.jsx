import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RecruitmentToolForm.css';

export default function RecruitmentToolForm() {
  // フォーム状態
  const [companyId] = useState('company_001');
  const [templateName, setTemplateName] = useState('');
  const [jobType, setJobType] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyRequirement, setCompanyRequirement] = useState('');
  const [offerTemplate, setOfferTemplate] = useState('');
  const [studentProfile, setStudentProfile] = useState('');

  // 保存済みテンプレート
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // 生成結果
  const [generatedComment, setGeneratedComment] = useState('');
  const [loading, setLoading] = useState(false);

  // 初期ロード
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 保存済みテンプレート一覧取得
  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates', {
        params: { company_id: companyId },
      });
      setSavedTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

// テンプレート選択時に値を埋める
const handleSelectTemplate = async (templateId) => {
    try {
      const response = await axios.get(`/api/templates/${templateId}`);
      const template = response.data;
      setSelectedTemplate(templateId);
      setEditingTemplateId(templateId);
      setTemplateName(template.template_name);
      setJobType(template.job_type);
      setIndustry(template.industry);
      setCompanyRequirement(template.company_requirement);
      setOfferTemplate(template.offer_template);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

// テンプレート保存（新規作成 or 更新）
const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('テンプレート名を入力してください');
      return;
    }
  
    try {
      if (editingTemplateId) {
        // 既存テンプレート更新
        await axios.put(`/api/templates/${editingTemplateId}`, {
          job_type: jobType,
          industry: industry,
          company_requirement: companyRequirement,
          offer_template: offerTemplate,
        });
        alert('テンプレートを更新しました');
      } else {
        // 新規テンプレート作成
        await axios.post('/api/templates', {
          company_id: companyId,
          template_name: templateName,
          job_type: jobType,
          industry: industry,
          company_requirement: companyRequirement,
          offer_template: offerTemplate,
        });
        alert('テンプレートを保存しました');
      }
      fetchTemplates();
      handleCancelEdit();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('テンプレート保存に失敗しました');
    }
  };

  // 編集をキャンセル
const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setSelectedTemplate(null);
    setJobType('');
    setIndustry('');
    setCompanyRequirement('');
    setOfferTemplate('');
  };

  // コメント生成
  const handleGenerateComment = async () => {
    if (!jobType || !industry || !companyRequirement || !offerTemplate || !studentProfile) {
      alert('すべてのフィールドを入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/generate', {
        job_type: jobType,
        industry: industry,
        company_requirement: companyRequirement,
        offer_template: offerTemplate,
        student_profile: studentProfile,
      });
      setGeneratedComment(response.data.comment);
    } catch (error) {
      console.error('Error generating comment:', error);
      alert('コメント生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 結果をコピー
  const handleCopyComment = () => {
    navigator.clipboard.writeText(generatedComment);
    alert('コピーしました');
  };

  return (
    <div className="recruitment-tool">
      <h1>採用評価コメント生成ツール</h1>

      {/* 保存済みテンプレート選択 */}
      <section className="saved-templates">
        <h2>保存済みテンプレート</h2>
        <select
          value={selectedTemplate || ''}
          onChange={(e) => handleSelectTemplate(parseInt(e.target.value))}
        >
          <option value="">テンプレートを選択...</option>
          {savedTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.template_name} ({template.job_type})
            </option>
          ))}
        </select>
      </section>

      {/* テンプレート設定フォーム */}
      <section className="template-form">
        <h2>テンプレート設定</h2>

        <div className="form-group">
          <label>テンプレート名（保存用）</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="例：A社_営業職"
          />
        </div>

        <div className="form-group">
          <label>職種 *</label>
          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">選択してください</option>
            <option value="営業職">営業職</option>
            <option value="サービス職">サービス職</option>
            <option value="企画職">企画職</option>
            <option value="事務職">事務職</option>
            <option value="技術職">技術職</option>
            <option value="研究職">研究職</option>
          </select>
        </div>

        <div className="form-group">
          <label>業種 *</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="例：FinTech、EC、SaaS"
          />
        </div>

        <div className="form-group">
          <label>企業が望むこと *</label>
          <textarea
            value={companyRequirement}
            onChange={(e) => setCompanyRequirement(e.target.value)}
            placeholder="例：新規顧客開拓に積極的で、数字目標達成へのコミットメントが高い人材"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>オファー文テンプレート *</label>
          <textarea
            value={offerTemplate}
            onChange={(e) => setOfferTemplate(e.target.value)}
            placeholder="例：【・・・を経験する中で発揮された・・・の能力】が大変素晴らしく、その熱意や考え方がとても魅力的で、当社でも活躍して頂ける人物と感じました！"
            rows="3"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSaveTemplate} className="btn-save-template" style={{ flex: 1 }}>
            {editingTemplateId ? 'テンプレートを更新' : 'テンプレートを保存'}
          </button>
          {editingTemplateId && (
            <button onClick={handleCancelEdit} className="btn-cancel" style={{ flex: 1 }}>
              編集をキャンセル
            </button>
          )}
        </div>
      </section>

      {/* 学生プロフィール入力 */}
      <section className="student-profile">
        <h2>学生のプロフィール</h2>
        <div className="form-group">
          <label>学生のプロフィール情報 *</label>
          <textarea
            value={studentProfile}
            onChange={(e) => setStudentProfile(e.target.value)}
            placeholder="自己PR、将来像、過去エピソード、研究内容、インターン経験等を入力してください"
            rows="6"
          />
        </div>
      </section>

      {/* 生成ボタン */}
      <div className="action-buttons">
        <button
          onClick={handleGenerateComment}
          disabled={loading}
          className="btn-generate"
        >
          {loading ? '生成中...' : 'コメントを生成'}
        </button>
      </div>

      {/* 生成結果 */}
      {generatedComment && (
        <section className="generated-result">
          <h2>生成されたコメント</h2>
          <div className="result-box">
            <p>{generatedComment}</p>
            <button onClick={handleCopyComment} className="btn-copy">
              コピー
            </button>
          </div>
        </section>
      )}
    </div>
  );
}