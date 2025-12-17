import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Tabs from 'devextreme-react/tabs';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import { Switch } from 'devextreme-react/switch';
import { DataGrid, Column, Paging, Pager } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    firmName: user?.firmName || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    taskReminders: true,
    documentAlerts: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        firmName: user.firmName || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const updated = await api.put<any>(`/users/${user.id}`, {
        name: formData.name,
        email: formData.email,
      });
      setUser(updated as any);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert('Please fill all password fields');
      return;
    }

    try {
      setSaving(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const permissionsData = user
    ? [
        {
          permission: 'View Clients',
          value: user.canViewClients ? 'Yes' : 'No',
        },
        {
          permission: 'Edit Clients',
          value: user.canEditClients ? 'Yes' : 'No',
        },
        {
          permission: 'Access Documents',
          value: user.canAccessDocuments ? 'Yes' : 'No',
        },
        {
          permission: 'Access Tasks',
          value: user.canAccessTasks ? 'Yes' : 'No',
        },
        {
          permission: 'Access Calendar',
          value: user.canAccessCalendar ? 'Yes' : 'No',
        },
        {
          permission: 'Access Chat',
          value: user.canAccessChat ? 'Yes' : 'No',
        },
      ]
    : [];

  return (
    <div className="dx-profile-page">
      <PageHeader
        title="User Profile"
        subtitle={user?.name || 'User'}
      />

      <Tabs
        selectedIndex={selectedTab}
        onSelectedIndexChange={setSelectedTab}
        items={[
          { text: 'Personal Information' },
          { text: 'Account Settings' },
          { text: 'Preferences' },
          ...(user?.role === 'CA_STAFF' ? [{ text: 'Permissions' }] : []),
        ]}
      />

      {selectedTab === 0 && (
        <Form
          formData={formData}
          onFieldDataChanged={(e) => {
            if (e.dataField) {
              const field = e.dataField as keyof typeof formData;
              setFormData((prev) => ({
                ...prev,
                [field]: e.value,
              }));
            }
          }}
        >
          <Item
            dataField="name"
            editorType="dxTextBox"
          >
            <Label text="Name" />
            <RequiredRule />
          </Item>
          <Item
            dataField="email"
            editorType="dxTextBox"
            editorOptions={{
              mode: 'email',
            }}
          >
            <Label text="Email" />
            <RequiredRule />
          </Item>
          <Item
            dataField="role"
            editorType="dxTextBox"
            editorOptions={{
              readOnly: true,
            }}
          >
            <Label text="Role" />
          </Item>
          <Item
            dataField="firmName"
            editorType="dxTextBox"
            editorOptions={{
              readOnly: true,
            }}
          >
            <Label text="Firm" />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text={saving ? 'Saving...' : 'Save Changes'}
                type="default"
                onClick={handleSaveProfile}
                disabled={saving}
              />
            </div>
          </Item>
        </Form>
      )}

      {selectedTab === 1 && (
        <Form formData={passwordData}>
          <Item
            dataField="currentPassword"
            editorType="dxTextBox"
            editorOptions={{
              mode: 'password',
              value: passwordData.currentPassword,
              onValueChanged: (e: any) =>
                setPasswordData((prev) => ({ ...prev, currentPassword: e.value })),
            }}
          >
            <Label text="Current Password" />
            <RequiredRule />
          </Item>
          <Item
            dataField="newPassword"
            editorType="dxTextBox"
            editorOptions={{
              mode: 'password',
              value: passwordData.newPassword,
              onValueChanged: (e: any) =>
                setPasswordData((prev) => ({ ...prev, newPassword: e.value })),
            }}
          >
            <Label text="New Password" />
            <RequiredRule />
          </Item>
          <Item
            dataField="confirmPassword"
            editorType="dxTextBox"
            editorOptions={{
              mode: 'password',
              value: passwordData.confirmPassword,
              onValueChanged: (e: any) =>
                setPasswordData((prev) => ({ ...prev, confirmPassword: e.value })),
            }}
          >
            <Label text="Confirm New Password" />
            <RequiredRule />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text={saving ? 'Changing...' : 'Change Password'}
                type="default"
                onClick={handleChangePassword}
                disabled={saving}
              />
            </div>
          </Item>
        </Form>
      )}

      {selectedTab === 2 && (
        <Form formData={preferences}>
          <Item
            dataField="emailNotifications"
            editorType="dxSwitch"
            editorOptions={{
              value: preferences.emailNotifications,
              onValueChanged: (e: any) =>
                setPreferences((prev) => ({ ...prev, emailNotifications: e.value })),
            }}
          >
            <Label text="Email Notifications" />
          </Item>
          <Item
            dataField="taskReminders"
            editorType="dxSwitch"
            editorOptions={{
              value: preferences.taskReminders,
              onValueChanged: (e: any) =>
                setPreferences((prev) => ({ ...prev, taskReminders: e.value })),
            }}
          >
            <Label text="Task Reminders" />
          </Item>
          <Item
            dataField="documentAlerts"
            editorType="dxSwitch"
            editorOptions={{
              value: preferences.documentAlerts,
              onValueChanged: (e: any) =>
                setPreferences((prev) => ({ ...prev, documentAlerts: e.value })),
            }}
          >
            <Label text="Document Alerts" />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Save Preferences"
                type="default"
                onClick={() => {
                  // Save preferences logic here
                  alert('Preferences saved');
                }}
              />
            </div>
          </Item>
        </Form>
      )}

      {selectedTab === 3 && user?.role === 'CA_STAFF' && (
        <DataGrid
          dataSource={permissionsData}
          showBorders={true}
          columnAutoWidth={true}
        >
          <Column dataField="permission" caption="Permission" />
          <Column dataField="value" caption="Access" />
          <Paging enabled={false} />
        </DataGrid>
      )}

      <LoadPanel visible={loading} />
    </div>
  );
};

