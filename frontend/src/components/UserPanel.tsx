import React from 'react';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface UserPanelProps {
  user: User | null;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      text: 'Profile',
      icon: 'user',
      onClick: () => navigate('/profile'),
    },
    {
      text: 'Settings',
      icon: 'preferences',
      onClick: () => {
        // Future: navigate to settings
        console.log('Settings clicked');
      },
    },
    {
      text: 'Logout',
      icon: 'export',
      onClick: onLogout,
    },
  ];

  return (
    <div className="user-panel">
      <DropDownButton
        text={user?.name || 'User'}
        icon="user"
        items={menuItems}
        displayExpr="text"
        showArrowIcon={true}
        dropDownOptions={{ width: 200 }}
        stylingMode="text"
      />
      <span className="user-role-badge">{user?.role?.replace('_', ' ')}</span>
    </div>
  );
};

