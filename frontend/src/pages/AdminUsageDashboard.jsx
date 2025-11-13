import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/AdminUsageDashboard.css';

export default function AdminUsageDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    document.title = 'API使用量 - Athena Scout';
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await apiClient.get('/api/admin/usage-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      if (error.response?.status === 403) {
        setError('管理者権限が必要です');
      } else {
        setError('データの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloadMessage('');
    setError('');

    try {
      const response = await apiClient.get('/api/admin/generation-history/download-csv', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadMessage('CSVファイルのダウンロードが完了しました');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setError('CSVのダウンロードに失敗しました');
    }
  };

  if (loading) return <div className="admin-dashboard"><div className="loading">読み込み中...</div></div>;
  if (error) return <div className="admin-dashboard"><div className="error">{error}</div></div>;
  if (!stats) return <div className="admin-dashboard"><div className="error">データがありません</div></div>;

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>API使用量</h1>
        <Link to="/my-page" className="btn-back">
          ← マイページに戻る
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {downloadMessage && <div className="success-message">{downloadMessage}</div>}

      {/* 生成履歴CSVダウンロード */}
      <div className="download-section">
        <h2>生成履歴データ</h2>
        <p>全ユーザーの生成履歴をCSV形式でダウンロードできます。</p>
        <button onClick={handleDownloadCSV} className="btn-download">
          生成履歴をCSVでダウンロード
        </button>
      </div>

      {/* 全期間の合計 */}
      <div className="total-stats">
        <h2>全期間の合計</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">リクエスト数</span>
            <span className="stat-value">{parseInt(stats.total.total_requests || 0).toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">トークン数</span>
            <span className="stat-value">{parseInt(stats.total.total_tokens || 0).toLocaleString()}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">コスト</span>
            <span className="stat-value">${parseFloat(stats.total.total_cost || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 月別の統計 */}
      <div className="monthly-stats">
        <h2>月別の使用状況</h2>
        <table>
          <thead>
            <tr>
              <th>月</th>
              <th>リクエスト数</th>
              <th>トークン数</th>
              <th>コスト</th>
            </tr>
          </thead>
          <tbody>
            {stats.monthly.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>データがありません</td>
              </tr>
            ) : (
              stats.monthly.map((month) => (
                <tr key={month.month}>
                  <td>{month.month}</td>
                  <td>{parseInt(month.requests).toLocaleString()}</td>
                  <td>{parseInt(month.tokens).toLocaleString()}</td>
                  <td>${parseFloat(month.cost).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="info-note">
        <p>※ Claude Sonnet 4の料金: 入力 $3/百万トークン、出力 $15/百万トークン</p>
      </div>
    </div>
  );
}