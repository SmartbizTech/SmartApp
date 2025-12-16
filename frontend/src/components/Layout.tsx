import React from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getNavItems = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { path: '/admin', label: 'Admin' },
      ];
    }

    if (user?.role === 'CLIENT') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/documents', label: 'Documents' },
        { path: '/tasks', label: 'Tasks' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/chat', label: 'Messages' },
      ];
    } else {
      const items = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/clients', label: 'Clients' },
        { path: '/documents', label: 'Documents' },
        { path: '/tasks', label: 'Tasks' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/chat', label: 'Messages' },
      ];
      if (user?.role === 'CA_ADMIN') {
        items.splice(2, 0, { path: '/team', label: 'Team' });
      }
      return items;
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-content">
          <div
            className="nav-brand"
            onClick={() => navigate(user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard')}
          >
            <h2>CA Portal</h2>
          </div>
          <div className="nav-links">
            {getNavItems().map((item) => (
              <button
                key={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="nav-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role.replace('_', ' ')}</span>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

