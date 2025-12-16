import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AdminUser } from '../types';
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
    const updated = await api.patch<AdminUser>(`/users/${userId}/permissions`, updates);
    setStaff((prev) => prev.map((s) => (s.id === userId ? { ...s, ...updated } : s)));
    return updated;
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (loading) {
    return <div className="page-loading">Loading team...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Team</h1>
        <button className="primary-button" onClick={() => setShowAddModal(true)}>
          Add Staff
        </button>
      </div>

      <div className="admin-card">
        {staff.length === 0 ? (
          <div className="empty-state">
            <p>No staff members yet</p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>View Clients</th>
                  <th>Edit Clients</th>
                  <th>Docs</th>
                  <th>Tasks</th>
                  <th>Calendar</th>
                  <th>Chat</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="role-badge role-ca_staff">CA_STAFF</span>
                    </td>
                    <td>
                      <select
                        value={
                          u.canViewClients && u.canEditClients
                            ? 'edit'
                            : u.canViewClients
                            ? 'view'
                            : 'none'
                        }
                        onChange={async (e) => {
                          const value = e.target.value;
                          const prevValue =
                            u.canViewClients && u.canEditClients
                              ? 'edit'
                              : u.canViewClients
                              ? 'view'
                              : 'none';
                          try {
                            const updates: Record<string, boolean> = {};
                            if (value === 'edit') {
                              updates.canViewClients = true;
                              updates.canEditClients = true;
                            } else if (value === 'view') {
                              updates.canViewClients = true;
                              updates.canEditClients = false;
                            } else {
                              updates.canViewClients = false;
                              updates.canEditClients = false;
                            }
                            await updatePermission(u.id, updates);
                          } catch (error: any) {
                            console.error('Failed to update permissions:', error);
                            alert(error?.message || 'Failed to update permissions');
                            e.target.value = prevValue;
                          }
                        }}
                        style={{ padding: '4px 8px', fontSize: '14px' }}
                      >
                        <option value="none">None</option>
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                    </td>
                    <td>-</td>
                    <td>
                      <PermissionDropdown
                        value={u.canAccessDocuments}
                        onChange={(enabled) => updatePermission(u.id, { canAccessDocuments: enabled })}
                      />
                    </td>
                    <td>
                      <PermissionDropdown
                        value={u.canAccessTasks}
                        onChange={(enabled) => updatePermission(u.id, { canAccessTasks: enabled })}
                      />
                    </td>
                    <td>
                      <PermissionDropdown
                        value={u.canAccessCalendar}
                        onChange={(enabled) => updatePermission(u.id, { canAccessCalendar: enabled })}
                      />
                    </td>
                    <td>
                      <PermissionDropdown
                        value={u.canAccessChat}
                        onChange={(enabled) => updatePermission(u.id, { canAccessChat: enabled })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Staff Member</h2>
            <form onSubmit={handleAddStaff} className="form-grid">
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() => setPasswordVisible((v) => !v)}
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PermissionDropdown: React.FC<{
  value: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}> = ({ value, onChange }) => {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const prevValue = value ? 'edit' : 'none';
    try {
      await onChange(newValue !== 'none');
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      alert(error?.message || 'Failed to update permissions');
      e.target.value = prevValue;
    }
  };

  return (
    <select
      value={value ? 'edit' : 'none'}
      onChange={handleChange}
      style={{ padding: '4px 8px', fontSize: '14px' }}
    >
      <option value="none">None</option>
      <option value="view">View</option>
      <option value="edit">Edit</option>
    </select>
  );
};
