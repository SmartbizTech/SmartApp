import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import Drawer from 'devextreme-react/drawer';
import List from 'devextreme-react/list';
import { Button } from 'devextreme-react/button';
import { UserPanel } from './UserPanel';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getNavItems = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { id: '/admin', text: 'Admin', icon: 'admin' },
      ];
    }

    if (user?.role === 'CLIENT') {
      return [
        { id: '/dashboard', text: 'Dashboard', icon: 'home' },
        { id: '/documents', text: 'Documents', icon: 'file' },
        { id: '/tasks', text: 'Tasks', icon: 'checklist' },
        { id: '/calendar', text: 'Calendar', icon: 'event' },
        { id: '/chat', text: 'Messages', icon: 'message' },
      ];
    } else {
      const items = [
        { id: '/dashboard', text: 'Dashboard', icon: 'home' },
        { id: '/clients', text: 'Clients', icon: 'group' },
        { id: '/documents', text: 'Documents', icon: 'file' },
        { id: '/tasks', text: 'Tasks', icon: 'checklist' },
        { id: '/calendar', text: 'Calendar', icon: 'event' },
        { id: '/chat', text: 'Messages', icon: 'message' },
      ];
      if (user?.role === 'CA_ADMIN') {
        items.splice(2, 0, { id: '/team', text: 'Team', icon: 'user' });
      }
      return items;
    }
  };

  const menuItems = getNavItems();

  const onMenuItemClick = (e: any) => {
    navigate(e.itemData.id);
    setDrawerOpen(false);
  };

  const menuItemRender = (item: any) => {
    const active = isActive(item.id);
    return (
      <div className={`dx-menu-item ${active ? 'dx-state-selected' : ''}`}>
        <i className={`dx-icon dx-icon-${item.icon}`}></i>
        <span>{item.text}</span>
      </div>
    );
  };

  const toolbarItems = [
    {
      widget: 'dxButton',
      location: 'before',
      options: {
        icon: 'menu',
        onClick: () => setDrawerOpen(!drawerOpen),
        stylingMode: 'text',
      },
    },
    {
      widget: 'dxButton',
      location: 'before',
      options: {
        text: 'CA Portal',
        stylingMode: 'text',
        onClick: () => navigate(user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'),
      },
    },
    {
      location: 'after',
      template: 'userPanel',
    },
  ];

  return (
    <div className="dx-layout">
      <Toolbar items={toolbarItems}>
        <Item location="after" template="userPanel">
          <UserPanel user={user} onLogout={logout} />
        </Item>
      </Toolbar>

      <Drawer
        opened={drawerOpen}
        openedStateMode="overlap"
        position="before"
        revealMode="slide"
        height="100%"
        closeOnOutsideClick={true}
        onOpenedChange={setDrawerOpen}
        template="menu"
      >
        <div className="dx-drawer-content">
          {children}
        </div>
        <List
          dataSource={menuItems}
          onItemClick={onMenuItemClick}
          itemRender={menuItemRender}
        />
      </Drawer>
    </div>
  );
};
