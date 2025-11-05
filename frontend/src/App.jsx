import React, { useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useUser } from './contexts/UserContext'
import { useSessionTimeout } from './hooks/useSessionTimeout'
import RecruitmentToolForm from './components/RecruitmentToolForm'
import JobTypesPage from './pages/JobTypesPage'
import OutputRulesPage from './pages/OutputRulesPage'
import LoginPage from './pages/LoginPage'
import MyPages from './pages/MyPages'
import UserManagementPage from './pages/UserManagementPage'
import TermsPage from './pages/TermsPage'
import HowToPage from './pages/HowToPage';
import AdminUsageDashboard from './pages/AdminUsageDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminOrManagerRoute from './components/AdminOrManagerRoute'
import SessionTimeoutWarning from './components/SessionTimeoutWarning'
import './App.css'

function App() {
  const { user, isAuthenticated, login, logout } = useUser();
  const navigate = useNavigate();
  const { showWarning, timeLeft, extendSession, logout: timeoutLogout } = useSessionTimeout();

  const handleLoginSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTimeoutLogout = () => {
    logout();
    timeoutLogout();
  };

  // ログインページ
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    );
  }

  // 認証済みユーザー用ナビゲーション
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src="/logo.png" alt="logo" className="nav-logo-icon" />
            Athena Scout
          </Link>

          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                スカウトメッセージ生成
              </Link>
            </li>
            {(user?.user_role === 'admin' || user?.user_role === 'manager') && (
              <>
                <li className="nav-item">
                  <Link to="/job-types" className="nav-link">
                    職業適性管理
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/output-rules" className="nav-link">
                    出力ルール管理
                  </Link>
                </li>
              </>
            )}
            {user?.user_role === 'admin' && (
              <li className="nav-item">
                <Link to="/users" className="nav-link">
                  ユーザー管理
                </Link>
              </li>
            )}
            {/* 👇 新規追加：使い方リンク（全ユーザー対象） */}
            <li className="nav-item">
              <Link to="/howto" className="nav-link">
                利用方法・注意事項
              </Link>
            </li>
            <li className="nav-item nav-user">
              <Link to="/my-page" className="nav-link nav-username">
                {user?.username}
              </Link>
              <button onClick={handleLogout} className="nav-logout">
                ログアウト
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<RecruitmentToolForm />} />
          <Route path="/terms" element={<ProtectedRoute element={<TermsPage />} isAuthenticated={isAuthenticated} />} />
          <Route path="/job-types" element={<AdminOrManagerRoute element={<JobTypesPage />} />} />
          <Route path="/output-rules" element={<AdminOrManagerRoute element={<OutputRulesPage />} />} />
          <Route path="/my-page" element={<ProtectedRoute element={<MyPages />} isAuthenticated={isAuthenticated} />} />
          <Route path="/howto" element={<ProtectedRoute element={<HowToPage />} isAuthenticated={isAuthenticated} />} />
          <Route path="/users" element={<AdminRoute element={<UserManagementPage />} />} />
          <Route path="/admin/usage" element={<AdminRoute element={<AdminUsageDashboard />} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2025 株式会社リクテラ - Athena Scout（社内専用ツール）</p>
          <div className="footer-links">
            <Link to="/terms">利用規約</Link>
            <span className="footer-divider">|</span>
            <span>お問い合わせ: 情報システム部</span>
          </div>
        </div>
      </footer>

      {showWarning && (
        <SessionTimeoutWarning
          timeLeft={timeLeft}
          onExtend={extendSession}
          onLogout={handleTimeoutLogout}
        />
      )}
    </div>
  )
}

export default App
