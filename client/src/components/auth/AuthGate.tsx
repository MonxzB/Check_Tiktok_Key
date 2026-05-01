import React, { useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import LoginPage from './LoginPage.js';
import SignupPage from './SignupPage.js';
import ForgotPasswordPage from './ForgotPasswordPage.js';

type AuthView = 'login' | 'signup' | 'forgot';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  if (loading) return (
    <div className="auth-page">
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ marginTop: 16 }}>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    </div>
  );

  if (user) return <>{children}</>;

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
