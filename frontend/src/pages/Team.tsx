import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AdminUser } from '../types';
import { DataGrid, Column, Paging, Pager, FilterRow, SearchPanel, Editing } from 'devextreme-react/data-grid';
import { Popup } from 'devextreme-react/popup';
import { Form, Item, Label, RequiredRule } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { PageHeader } from '../components/PageHeader';
import './Dashboard.css';

export const Team: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.get<AdminUser[]>('/users?role=CA_STAFF');
      setStaff(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    userId: string,
    updates: Partial<Pick<AdminUser, 'canViewClients' | 'canEditClients' | 'canAccessDocuments' | 'canAccessTasks' | 'canAccessCalendar' | 'canAccessChat'>>
  ) => {
    try {
      const updated = await api.patch<AdminUser>(`/users/${userId}/permissions`, updates);
      setStaff((prev) => prev.map((s) => (s.id === userId ? { ...s, ...updated } : s)));
      return updated;
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      alert(error?.message || 'Failed to update permissions');
      throw error;
    }
  };

  const handleAddStaff = async () => {
    if (!name || !email || !password) {
      alert('Please fill all fields');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/users', {
        name,
        email,
        password,
        role: 'CA_STAFF',
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setPasswordVisible(false);
      await loadStaff();
    } catch (error) {
      console.error('Failed to add staff member:', error);
      alert('Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const permissionCellRender = (data: any, field: string) => {
    const value = data.data[field];
    const permissionValue = value ? 'edit' : 'none';
    return (
      <SelectBox
        value={permissionValue}
        items={[
          { value: 'none', text: 'None' },
          { value: 'view', text: 'View' },
          { value: 'edit', text: 'Edit' },
        ]}
        displayExpr="text"
        valueExpr="value"
        onValueChanged={async (e: any) => {
          const newValue = e.value;
          const updates: any = {};
          if (field === 'canViewClients' || field === 'canEditClients') {
            if (newValue === 'edit') {
              updates.canViewClients = true;
              updates.canEditClients = true;
            } else if (newValue === 'view') {
              updates.canViewClients = true;
              updates.canEditClients = false;
            } else {
              updates.canViewClients = false;
              updates.canEditClients = false;
            }
          } else {
            updates[field] = newValue !== 'none';
          }
          await updatePermission(data.data.id, updates);
        }}
        stylingMode="outlined"
        width="100%"
      />
    );
  };

  const clientsPermissionCellRender = (data: any) => {
    const canView = data.data.canViewClients;
    const canEdit = data.data.canEditClients;
    const value = canView && canEdit ? 'edit' : canView ? 'view' : 'none';
    return (
      <SelectBox
        value={value}
        items={[
          { value: 'none', text: 'None' },
          { value: 'view', text: 'View' },
          { value: 'edit', text: 'Edit' },
        ]}
        displayExpr="text"
        valueExpr="value"
        onValueChanged={async (e: any) => {
          const newValue = e.value;
          const updates: any = {};
          if (newValue === 'edit') {
            updates.canViewClients = true;
            updates.canEditClients = true;
          } else if (newValue === 'view') {
            updates.canViewClients = true;
            updates.canEditClients = false;
          } else {
            updates.canViewClients = false;
            updates.canEditClients = false;
          }
          await updatePermission(data.data.id, updates);
        }}
        stylingMode="outlined"
        width="100%"
      />
    );
  };

  return (
    <div className="dx-admin-page">
      <PageHeader
        title="Team"
        subtitle="Manage team members and permissions"
        actions={
          <Button
            text="Add Staff"
            type="default"
            icon="plus"
            onClick={() => setShowAddModal(true)}
          />
        }
      />

      <DataGrid
        dataSource={staff}
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        keyExpr="id"
      >
        <FilterRow visible={true} />
        <SearchPanel visible={true} />
        <Paging defaultPageSize={20} />
        <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50]} />
        <Column dataField="name" caption="Name" />
        <Column dataField="email" caption="Email" />
        <Column
          dataField="role"
          caption="Role"
          cellRender={(data: any) => (
            <span className="role-badge role-ca_staff">CA_STAFF</span>
          )}
        />
        <Column
          caption="View Clients"
          cellRender={(data: any) => clientsPermissionCellRender(data)}
          allowSorting={false}
        />
        <Column
          caption="Edit Clients"
          cellRender={() => '-'}
        />
        <Column
          caption="Docs"
          cellRender={(data: any) => permissionCellRender(data, 'canAccessDocuments')}
          allowSorting={false}
        />
        <Column
          caption="Tasks"
          cellRender={(data: any) => permissionCellRender(data, 'canAccessTasks')}
          allowSorting={false}
        />
        <Column
          caption="Calendar"
          cellRender={(data: any) => permissionCellRender(data, 'canAccessCalendar')}
          allowSorting={false}
        />
        <Column
          caption="Chat"
          cellRender={(data: any) => permissionCellRender(data, 'canAccessChat')}
          allowSorting={false}
        />
      </DataGrid>

      <Popup
        visible={showAddModal}
        onHiding={() => setShowAddModal(false)}
        showTitle={true}
        title="Add Staff Member"
        width={500}
        height="auto"
        showCloseButton={true}
      >
        <Form formData={{}}>
          <Item
            dataField="name"
            editorType="dxTextBox"
            editorOptions={{
              value: name,
              onValueChanged: (e: any) => setName(e.value),
            }}
          >
            <Label text="Name" />
            <RequiredRule />
          </Item>
          <Item
            dataField="email"
            editorType="dxTextBox"
            editorOptions={{
              value: email,
              onValueChanged: (e: any) => setEmail(e.value),
              mode: 'email',
            }}
          >
            <Label text="Email" />
            <RequiredRule />
          </Item>
          <Item
            dataField="password"
            editorType="dxTextBox"
            editorOptions={{
              value: password,
              onValueChanged: (e: any) => setPassword(e.value),
              mode: passwordVisible ? 'text' : 'password',
              buttons: [
                {
                  name: 'password',
                  location: 'after',
                  options: {
                    icon: passwordVisible ? 'eyeopen' : 'eyeclose',
                    onClick: () => setPasswordVisible(!passwordVisible),
                  },
                },
              ],
            }}
          >
            <Label text="Password" />
            <RequiredRule />
          </Item>
          <Item>
            <div className="dx-form-actions">
              <Button
                text="Cancel"
                stylingMode="outlined"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
              />
              <Button
                text={submitting ? 'Adding...' : 'Add Staff'}
                type="default"
                onClick={handleAddStaff}
                disabled={submitting}
              />
            </div>
          </Item>
        </Form>
      </Popup>

      <LoadPanel visible={loading} />
    </div>
  );
};
