import React, { useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useUser } from './contexts/UserContext'
import RecruitmentToolForm from './components/RecruitmentToolForm'
import JobTypesPage from './pages/JobTypesPage'
import OutputRulesPage from './pages/OutputRulesPage'
import LoginPage from './pages/LoginPage'
import MyPages from './pages/MyPages'
import UserManagementPage from './pages/UserManagementPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import './App.css'

function App() {
  const { user, isAuthenticated, login, logout } = useUser();
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    login(userData);
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            🎯 採用ツール
          </Link>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                オファーメッセージ生成
              </Link>
            </li>
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
            {user?.user_role === 'admin' && (
              <li className="nav-item">
                <Link to="/users" className="nav-link">
                  ユーザー管理
                </Link>
              </li>
            )}
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
          <Route 
            path="/job-types" 
            element={<ProtectedRoute element={<JobTypesPage />} isAuthenticated={isAuthenticated} />} 
          />
          <Route 
            path="/output-rules" 
            element={<ProtectedRoute element={<OutputRulesPage />} isAuthenticated={isAuthenticated} />} 
          />
          <Route 
            path="/my-page" 
            element={<ProtectedRoute element={<MyPages />} isAuthenticated={isAuthenticated} />} 
          />
          <Route 
            path="/users" 
            element={<AdminRoute element={<UserManagementPage />} />} 
          />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App