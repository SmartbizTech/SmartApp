import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AdminFirm, AdminUser } from '../types';
import './Dashboard.css';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [firms, setFirms] = useState<AdminFirm[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'CA_ADMIN' | 'CA_STAFF'>('CA_STAFF');
  const [creatingUser, setCreatingUser] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    loadFirms();
  }, []);

  useEffect(() => {
    if (selectedFirmId) {
      loadUsers(selectedFirmId);
    } else {
      setUsers([]);
    }
  }, [selectedFirmId]);

  const loadFirms = async () => {
    try {
      setLoadingFirms(true);
      const data = await api.get<AdminFirm[]>('/admin/firms');
      setFirms(data);
      if (data.length > 0) {
        setSelectedFirmId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load firms:', error);
    } finally {
      setLoadingFirms(false);
    }
  };

  const loadUsers = async (firmId: string) => {
    try {
      setLoadingUsers(true);
      const data = await api.get<AdminUser[]>(`/admin/firms/${firmId}/users`);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updatePermissions = async (userId: string, patch: Partial<AdminUser>) => {
    try {
      const updated = await api.patch<AdminUser>(`/admin/users/${userId}/permissions`, patch);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      );
    } catch (error) {
      console.error('Failed to update permissions:', error);
      alert('Failed to update permissions');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirmId) return;
    if (!newUserName || !newUserEmail || !newUserPassword) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setCreatingUser(true);
      const created = await api.post<AdminUser>(
        `/admin/firms/${selectedFirmId}/users`,
        {
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }
      );
      setUsers((prev) => [...prev, created]);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('CA_STAFF');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const openResetPassword = (userId: string) => {
    setResetPasswordUserId(userId);
    setResetPasswordValue('');
    setResetPasswordVisible(false);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || !resetPasswordValue) {
      alert('Please enter a new password');
      return;
    }

    try {
      setResettingPassword(true);
      await api.patch<void>(`/admin/users/${resetPasswordUserId}/password`, {
        password: resetPasswordValue,
      });
      setShowResetPasswordModal(false);
      setResetPasswordUserId(null);
      setResetPasswordValue('');
      setResetPasswordVisible(false);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <div className="page-loading">Admin panel is only for platform admins.</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Platform Admin</h1>
      </div>

      <div className="admin-grid">
        <div className="admin-card admin-firms">
          <h2>CA Firms</h2>
          {loadingFirms ? (
            <div className="page-loading">Loading firms...</div>
          ) : (
            <div className="list">
              {firms.map((firm) => (
                <div
                  key={firm.id}
                  className={`list-item ${firm.id === selectedFirmId ? 'active' : ''}`}
                  onClick={() => setSelectedFirmId(firm.id)}
                >
                  <div className="list-item-main">
                    <div className="list-title">{firm.name}</div>
                    {firm.gstin && <div className="list-subtitle">GSTIN: {firm.gstin}</div>}
                  </div>
                  <div className="list-meta">
                    {firm.users.length > 0 && (
                      <span className="pill">
                        CA: {firm.users[0].name} ({firm.users[0].email})
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {firms.length === 0 && (
                <div className="empty-state">
                  <p>No firms yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-card admin-users">
          <div className="admin-users-header">
            <h2>Users & Permissions</h2>
            {selectedFirmId && (
              <button
                className="primary-button"
                onClick={() => setShowAddUserModal(true)}
              >
                Add User
              </button>
            )}
          </div>
          {loadingUsers ? (
            <div className="page-loading">Loading users...</div>
          ) : selectedFirmId ? (
            <div className="users-table-wrapper">
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>No users in this firm</p>
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Password</th>
                      <th>View Clients</th>
                      <th>Edit Clients</th>
                      <th>Docs</th>
                      <th>Tasks</th>
                      <th>Calendar</th>
                      <th>Chat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`role-badge role-${u.role.toLowerCase()}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => openResetPassword(u.id)}
                          >
                            Reset
                          </button>
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canViewClients}
                            onChange={(e) =>
                              updatePermissions(u.id, { canViewClients: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canEditClients}
                            onChange={(e) =>
                              updatePermissions(u.id, { canEditClients: e.target.checked })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canAccessDocuments}
                            onChange={(e) =>
                              updatePermissions(u.id, {
                                canAccessDocuments: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canAccessTasks}
                            onChange={(e) =>
                              updatePermissions(u.id, {
                                canAccessTasks: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canAccessCalendar}
                            onChange={(e) =>
                              updatePermissions(u.id, {
                                canAccessCalendar: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={u.canAccessChat}
                            onChange={(e) =>
                              updatePermissions(u.id, {
                                canAccessChat: e.target.checked,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a firm to view its users</p>
            </div>
          )}
        </div>
      </div>

      {showAddUserModal && selectedFirmId && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add User to Firm</h2>
            <form onSubmit={handleCreateUser} className="form-grid">
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value as 'CA_ADMIN' | 'CA_STAFF')
                  }
                >
                  <option value="CA_STAFF">CA Staff</option>
                  <option value="CA_ADMIN">CA Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddUserModal(false)}
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && resetPasswordUserId && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword} className="form-grid">
              <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={resetPasswordVisible ? 'text' : 'password'}
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() => setResetPasswordVisible((v) => !v)}
                  >
                    {resetPasswordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowResetPasswordModal(false)}
                  disabled={resettingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

