import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function AdminRoute({ element }) {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.user_role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>アクセス拒否</h2>
        <p>このページは管理者のみアクセスできます。</p>
      </div>
    );
  }

  return element;
}