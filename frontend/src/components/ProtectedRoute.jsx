import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutWarning from './SessionTimeoutWarning';

export default function ProtectedRoute({ element, isAuthenticated }) {
  const { showWarning, timeLeft, extendSession, logout } = useSessionTimeout();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {element}
      {showWarning && (
        <SessionTimeoutWarning
          timeLeft={timeLeft}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
}
