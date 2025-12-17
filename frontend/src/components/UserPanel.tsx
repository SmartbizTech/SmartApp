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
    { text: 'Profile', icon: 'user' },
    { text: 'Settings', icon: 'preferences' },
    { text: 'Logout', icon: 'export' },
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
        onItemClick={(e) => {
          const item = e.itemData as { text: string };
          if (item.text === 'Profile') {
            navigate('/profile');
          } else if (item.text === 'Logout') {
            onLogout();
          } else if (item.text === 'Settings') {
            // Future: navigate to settings page
            console.log('Settings clicked');
          }
        }}
      />
      <span className="user-role-badge">{user?.role?.replace('_', ' ')}</span>
    </div>
  );
};

