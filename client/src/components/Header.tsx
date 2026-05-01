import React from 'react';
import { APP_NOTICE } from '../engine/constants.js';
import { useAuth } from '../hooks/useAuth.tsx';
import WorkspaceSwitcher from './WorkspaceSwitcher.tsx';
import SyncBadge from './SyncBadge.tsx';
import type { UseWorkspacesReturn } from '../hooks/useWorkspaces.ts';
import type { SyncStatus } from '../hooks/useKeywords.ts';

interface HeaderProps {
  workspaceProps?: UseWorkspacesReturn;
  syncStatus?: SyncStatus;
}

export default function Header({ workspaceProps, syncStatus }: HeaderProps) {
  const { user, signOut } = useAuth();
  return (
    <header className="header">
      <h1>🎌 YouTube Long-Form Key Finder</h1>
      <p>Tìm &amp; chấm điểm keyword YouTube long-form tiếng Nhật cho nội dung gốc</p>
      <div className="notice-banner">{APP_NOTICE}</div>
      {user && (
        <div className="auth-user-bar">
          {/* Workspace switcher */}
          {workspaceProps && workspaceProps.workspaces.length > 0 && (
            <WorkspaceSwitcher
              workspaces={workspaceProps.workspaces}
              activeWorkspace={workspaceProps.activeWorkspace}
              loading={workspaceProps.loading}
              onCreate={workspaceProps.createWorkspace}
              onSwitch={workspaceProps.switchWorkspace}
              onUpdate={workspaceProps.updateWorkspace}
              onDelete={workspaceProps.deleteWorkspace}
            />
          )}
          {/* Sync badge */}
          {syncStatus && <SyncBadge syncStatus={syncStatus} />}
          <span className="auth-email">👤 {user.email}</span>
          <button className="btn btn-secondary auth-logout-btn" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}
