import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import LoginPage from './LoginPage.jsx';
import SignupPage from './SignupPage.jsx';
import ForgotPasswordPage from './ForgotPasswordPage.jsx';


export default function AuthGate({ children }) {

  const { user, loading } = useAuth();
  const [view, setView] = useState('login');

  // Loading state
  if (loading) return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16 }}>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    </div>
  );

  // Authenticated → show main app
  if (user) return children;

  // Not authenticated → show auth flow
  if (view === 'signup') return (
    <SignupPage onGoLogin={() => setView('login')} />
  );
  if (view === 'forgot') return (
    <ForgotPasswordPage onGoLogin={() => setView('login')} />
  );
  return (
    <LoginPage
      onGoSignup={() => setView('signup')}
      onGoForgot={() => setView('forgot')}
    />
  );
}
